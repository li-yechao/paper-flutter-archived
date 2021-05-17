import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/paper/paper_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user/user_bloc.dart';

part 'paper_mutation_state.dart';
part 'paper_mutation_event.dart';

class PaperMutationBloc extends Bloc<PaperMutationEvent, PaperMutationState> {
  final GraphQLClient graphql;

  PaperMutationBloc({
    required this.graphql,
  }) : super(PaperMutationState());

  @override
  Stream<PaperMutationState> mapEventToState(PaperMutationEvent event) async* {
    if (event is PaperCreate) {
      yield* _mapPaperCreateToState(state, event);
    } else if (event is PaperUpdate) {
      yield* _mapPaperUpdateToState(state, event);
    } else if (event is PaperDelete) {
      yield* _mapPaperDeleteToState(state, event);
    }
  }

  Stream<PaperMutationState> _mapPaperCreateToState(
    PaperMutationState state,
    PaperCreate event,
  ) async* {
    yield state.copyWith(
      createStatus: RequestStatus.initial,
      createError: null,
      createPaper: null,
    );

    try {
      final result = await graphql.mutate(
        MutationOptions(
          document: gql(
            r"""
            mutation CreatePaper(
              $userId: String!
              $input: CreatePaperInput!
            ) {
              createPaper(
                userId: $userId
                input: $input
              ) {
                id
                createdAt
                updatedAt
                title
                content
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
            'input': {},
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      yield state.copyWith(
        createStatus: RequestStatus.success,
        createPaper: PaperWithContent.fromJson(
          json: result.data!['createPaper'],
          user: User.fromJson(
            result.data!['createPaper']['user'],
          ),
        ),
      );
    } catch (error) {
      yield state.copyWith(
        createStatus: RequestStatus.failure,
        createError: error,
      );
    }
  }

  Stream<PaperMutationState> _mapPaperUpdateToState(
    PaperMutationState state,
    PaperUpdate event,
  ) async* {
    yield state.copyWith(
      updateStatus: RequestStatus.initial,
      updateError: null,
      updatePaper: null,
    );

    try {
      final result = await graphql.mutate(
        MutationOptions(
          document: gql(
            r"""
            mutation UpdatePaper(
              $userId: String!
              $paperId: String!
              $input: UpdatePaperInput!
            ) {
              updatePaper(
                userId: $userId
                paperId: $paperId
                input: $input
              ) {
                id
                createdAt
                updatedAt
                title
                content
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
            'paperId': event.paperId,
            'input': {
              'title': event.title,
              'content': event.content,
            },
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      yield state.copyWith(
        updateStatus: RequestStatus.success,
        updatePaper: PaperWithContent.fromJson(
          json: result.data!['updatePaper'],
          user: User.fromJson(
            result.data!['updatePaper']['user'],
          ),
        ),
      );
    } catch (error) {
      yield state.copyWith(
        updateStatus: RequestStatus.failure,
        updateError: error,
      );
    }
  }

  Stream<PaperMutationState> _mapPaperDeleteToState(
    PaperMutationState state,
    PaperDelete event,
  ) async* {
    yield state.copyWith(
      deleteStatus: RequestStatus.initial,
      deleteError: null,
      deletePaperId: null,
    );

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
      yield state.copyWith(
        deleteStatus: RequestStatus.success,
        deletePaperId: result.data!['deletePaper']['id'],
      );
    } catch (error) {
      yield state.copyWith(
        deleteStatus: RequestStatus.failure,
        deleteError: error,
      );
    }
  }
}
