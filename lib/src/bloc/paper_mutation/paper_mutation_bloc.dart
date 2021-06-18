import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/user/user_bloc.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';
import 'package:rxdart/subjects.dart';

part 'paper_mutation_state.dart';
part 'paper_mutation_event.dart';

class PaperMutationBloc extends Bloc<PaperMutationEvent, PaperMutationState> {
  final GraphQLClient graphql;

  final createdSubject = PublishSubject<Paper>();
  final updatedSubject = PublishSubject<PaperUpdate>();
  final deletedSubject = PublishSubject<PaperDelete>();

  PaperMutationBloc({
    required this.graphql,
  }) : super(PaperMutationState());

  @override
  Stream<PaperMutationState> mapEventToState(PaperMutationEvent event) async* {
    if (event is PaperCreate) {
      yield* _mapPaperCreateToState(event);
    } else if (event is PaperUpdate) {
      yield* _mapPaperUpdateToState(event);
    } else if (event is PaperDelete) {
      yield* _mapPaperDeleteToState(event);
    }
  }

  Stream<PaperMutationState> _mapPaperCreateToState(
    PaperCreate event,
  ) async* {
    try {
      final result = await graphql.mutate(
        MutationOptions(
          document: gql(
            r"""
            mutation CreatePaper($userId: String!) {
              createPaper(userId: $userId) {
                id
                createdAt
                updatedAt
                title
                canViewerWritePaper

                user {
                  id
                  createdAt
                  name
                }
              }
            }
            """,
          ),
          variables: {
            'userId': event.userId,
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      final paper = Paper.fromJson(
        json: result.data!['createPaper'],
        user: User.fromJson(
          result.data!['createPaper']['user'],
        ),
      );
      createdSubject.add(paper);
    } catch (error) {
      createdSubject.addError(error);
    }
  }

  Stream<PaperMutationState> _mapPaperUpdateToState(
    PaperUpdate event,
  ) async* {
    updatedSubject.add(event);
  }

  Stream<PaperMutationState> _mapPaperDeleteToState(
    PaperDelete event,
  ) async* {
    try {
      final result = await graphql.mutate(
        MutationOptions(
          document: gql(
            r"""
            mutation DeletePaper(
              $userId: String!
              $paperId: String!
            ) {
              deletePaper(
                userId: $userId
                paperId: $paperId
              ) {
                id
              }
            }
            """,
          ),
          variables: {
            'userId': event.userId,
            'paperId': event.paperId,
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      deletedSubject.add(event);
    } catch (error) {
      deletedSubject.addError(error);
    }
  }

  @override
  Future<void> close() {
    createdSubject.close();
    updatedSubject.close();
    deletedSubject.close();
    return super.close();
  }
}
