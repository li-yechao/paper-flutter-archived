import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user/user_bloc.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';

part 'paper_state.dart';
part 'paper_event.dart';

class PaperBloc extends Bloc<PaperEvent, PaperState> {
  final GraphQLClient graphql;

  final String userId;
  final String paperId;

  PaperBloc({
    required this.graphql,
    required this.userId,
    required this.paperId,
  }) : super(PaperState());

  @override
  Stream<PaperState> mapEventToState(PaperEvent event) async* {
    if (event is PaperRequest) {
      yield await _mapPaperEventSelectToState(state);
    } else if (event is PaperUpdated) {
      yield state.copyWith(paper: event.paper);
    }
  }

  Future<PaperState> _mapPaperEventSelectToState(
    PaperState state,
  ) async {
    try {
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
                  content
                  canViewerWritePaper
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
      final paper = PaperWithContent.fromJson(
        json: result.data!['user']['paper'],
        user: User.fromJson(result.data!['user']),
      );
      return state.copyWith(
        status: RequestStatus.success,
        paper: paper,
      );
    } catch (error) {
      return state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }
}
