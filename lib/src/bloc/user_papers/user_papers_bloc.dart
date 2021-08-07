import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user/user_bloc.dart';
import 'package:paper/src/extensions/extensions.dart';
import 'package:tuple/tuple.dart';

part 'user_papers_event.dart';
part 'user_papers_state.dart';

const _PAGE_SIZE = 20;

class UserPapersBloc extends Bloc<UserPapersEvent, UserPapersState> {
  final GraphQLClient graphql;

  final String userId;

  UserPapersBloc({
    required this.graphql,
    required this.userId,
  }) : super(
          UserPapersState(
            orderBy: OrderBy(
              field: PaperOrderField.UPDATED_AT,
              direction: OrderDirection.DESC,
            ),
          ),
        );

  @override
  Stream<UserPapersState> mapEventToState(UserPapersEvent event) async* {
    if (event is UserPapersRequest) {
      yield* _mapUserPapersRequestToState(state);
    } else if (event is UserPapersRequestNewly) {
      yield* _mapUserPapersRequestNewlyToState(state);
    } else if (event is UserPapersUpdated) {
      yield* _mapUserPapersUpdatedToState(state, event);
      yield* _mapUserPapersRequestNewlyToState(state);
    } else if (event is UserPapersDeleted) {
      state.edges.removeWhere((element) => element.node.id == event.paperId);
      yield state;
    }
  }

  Stream<UserPapersState> _mapUserPapersRequestToState(
    UserPapersState state,
  ) async* {
    try {
      yield state.copyWith(
        status: RequestStatus.initial,
      );
      final result = await _queryUserPapers(
        userId: userId,
        first: _PAGE_SIZE,
        after: state.edges.lastOrNull?.cursor,
        orderBy: state.orderBy,
      );
      yield state.copyWith(
        status: RequestStatus.success,
        edges: state.edges
                .where((o) => !result.item1.any((n) => o.node.id == n.node.id))
                .toList() +
            result.item1,
        total: result.item2,
      );
    } catch (error) {
      yield state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }

  Stream<UserPapersState> _mapUserPapersRequestNewlyToState(
    UserPapersState state,
  ) async* {
    try {
      yield state.copyWith(
        status: RequestStatus.initial,
      );
      final result = await _queryUserPapers(
        userId: userId,
        last: _PAGE_SIZE,
        before: state.edges.firstOrNull?.cursor,
        orderBy: state.orderBy,
      );
      yield state.copyWith(
        status: RequestStatus.success,
        edges: result.item1 +
            state.edges
                .where((o) => !result.item1.any((n) => o.node.id == n.node.id))
                .toList(),
        total: result.item2,
      );
    } catch (error) {
      yield state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }

  Stream<UserPapersState> _mapUserPapersUpdatedToState(
    UserPapersState state,
    UserPapersUpdated e,
  ) async* {
    try {
      final paper = await _queryUserPaper(userId: e.userId, paperId: e.paperId);
      final index =
          state.edges.indexWhere((element) => element.node.id == paper.id);
      if (index >= 0) {
        state.edges[index] = Edge(
          cursor: state.edges[index].cursor,
          node: paper,
        );
        yield state;
      }
    } catch (error) {
      print(error);
    }
  }

  Future<Tuple2<List<Edge<Paper>>, int>> _queryUserPapers({
    required String userId,
    int? first,
    String? after,
    int? last,
    String? before,
    OrderBy<PaperOrderField>? orderBy,
  }) async {
    final result = await graphql.query(
      QueryOptions(
        document: gql(
          r"""
          query UserPapers(
            $userId: String!
            $first: Int
            $after: PaperCursor
            $last: Int
            $before: PaperCursor
            $orderBy: PaperOrder
          ) {
            user(identifier: {id: $userId}) {
              id
              createdAt
              name

              papers(
                first: $first
                after: $after
                last: $last
                before: $before
                orderBy: $orderBy
              ) {
                total
                edges {
                  cursor
                  node {
                    id
                    createdAt
                    updatedAt
                    title
                    canViewerWritePaper
                    tags
                  }
                }
              }
            }
          }
          """,
        ),
        variables: {
          'userId': userId,
          'first': first,
          'after': after,
          'last': last,
          'before': before,
          'orderBy': orderBy?.toJson(),
        },
      ),
    );
    if (result.hasException) {
      throw result.exception!;
    }
    final user = User.fromJson(result.data!['user']);
    final edges = (result.data!['user']['papers']['edges'] as List)
        .map(
          (v) => Edge(
            cursor: v['cursor'],
            node: Paper.fromJson(
              json: v['node'],
              user: user,
            ),
          ),
        )
        .toList();
    return Tuple2(edges, result.data!['user']['papers']['total']);
  }

  Future<Paper> _queryUserPaper({
    required String userId,
    required String paperId,
  }) async {
    final result = await graphql.query(
      QueryOptions(
        document: gql(
          r"""
          query User(
            $userId: String!
            $paperId: String!
          ) {
            user(identifier: {id: $userId}) {
              id
              createdAt
              name

              paper(paperId: $paperId) {
                id
                createdAt
                updatedAt
                title
                canViewerWritePaper
                tags
              }
            }
          }
          """,
        ),
        variables: {
          'userId': userId,
          'paperId': paperId,
        },
      ),
    );
    if (result.hasException) {
      throw result.exception!;
    }
    return Paper.fromJson(
      json: result.data!['user']['paper'],
      user: User.fromJson(result.data!['user']),
    );
  }
}
