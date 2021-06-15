import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/common/config.dart';
import 'package:paper/src/common/storage.dart';
import 'package:paper/src/graphql/auth_link.dart' as AuthLink;

extension GraphQLInstance on GraphQLClient {
  static GraphQLClient? _client;
  static GraphQLClient get client {
    if (_client == null) {
      final httpLink = HttpLink(Config.graphqlUri);
      final refreshTokenLink = AuthLink.AuthLink(
        refreshTokenHandler: () async {
          final token = await Storage.token;
          if (token != null) {
            final client = GraphQLClient(link: httpLink, cache: GraphQLCache());
            final result = await client.mutate(
              MutationOptions(
                document: gql(
                  """
              mutation CreateAccessToken(\$input: CreateAccessTokenInput!) {
                createAccessToken(input: \$input) {
                  accessToken
                  tokenType
                  expiresIn
                  refreshToken
                }
              }
              """,
                ),
                variables: {
                  'input': {
                    'refreshToken': {'refreshToken': token.refreshToken},
                  },
                },
              ),
            );
            final json = result.data?['createAccessToken'];
            final newToken = Token.fromJson(json);
            await Storage.setToken(newToken);
          }
        },
        needRefreshToken: (response) async {
          final token = await Storage.token;
          return token != null &&
              response.errors != null &&
              response.errors!
                  .any((e) => e.extensions?['type'] == 'UNAUTHORIZED');
        },
        requestTransformer: (request) async {
          final token = (await Storage.token)?.accessToken;
          return request.updateContextEntry<HttpLinkHeaders>(
            (headers) => HttpLinkHeaders(
              headers: {
                ...headers?.headers ?? {},
                'Authorization': token != null ? 'Bearer $token' : '',
              },
            ),
          );
        },
      );

      _client = GraphQLClient(
        link: refreshTokenLink.concat(httpLink),
        cache: GraphQLCache(),
        defaultPolicies: DefaultPolicies(
          query: Policies(
            fetch: FetchPolicy.noCache,
          ),
        ),
      );
    }
    return _client!;
  }
}
