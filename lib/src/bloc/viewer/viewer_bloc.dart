import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user/user_bloc.dart';
import 'package:paper/src/common/storage.dart';

part 'viewer_event.dart';
part 'viewer_state.dart';

class ViewerBloc extends Bloc<ViewerEvent, ViewerState> {
  final GraphQLClient graphql;

  ViewerBloc({
    required this.graphql,
  }) : super(ViewerState());

  @override
  Stream<ViewerState> mapEventToState(ViewerEvent event) async* {
    if (event is ViewerRequest) {
      yield* _mapViewerRequestToState(state);
    } else if (event is ViewerGithubCodeSignIn) {
      yield* _mapViewerGithubCodeSignInToState(state, event);
    } else if (event is ViewerSignOut) {
      await Storage.setToken(null);
      yield ViewerState();
    }
  }

  Stream<ViewerState> _mapViewerRequestToState(ViewerState state) async* {
    try {
      yield state.copyWith(status: RequestStatus.initial);

      final result = await graphql.query(
        QueryOptions(
          document: gql(
            """
            query Viewer {
              viewer {
                id
                createdAt
                name
              }
            }
            """,
          ),
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      yield state.copyWith(
        status: RequestStatus.success,
        viewer: User.fromJson(result.data!['viewer']),
      );
    } catch (error) {
      yield state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }

  Stream<ViewerState> _mapViewerGithubCodeSignInToState(
    ViewerState state,
    ViewerGithubCodeSignIn event,
  ) async* {
    try {
      yield state.copyWith(status: RequestStatus.initial);

      final result = await graphql.mutate(
        MutationOptions(
          document: gql(
            r"""
            mutation CreateAccessToken($input: CreateAccessTokenInput!) {
              createAccessToken(input: $input) {
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
              'github': {
                'clientId': event.clientId,
                'code': event.code,
              }
            },
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }

      final token = Token.fromJson(result.data!['createAccessToken']);
      await Storage.setToken(token);
      yield* _mapViewerRequestToState(state);
    } catch (error) {
      yield state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }
}
