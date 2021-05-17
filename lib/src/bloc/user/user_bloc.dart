import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/type.dart';

part 'user_event.dart';
part 'user_state.dart';

class UserBloc extends Bloc<UserEvent, UserState> {
  final GraphQLClient graphql;

  final String userId;

  UserBloc({
    required this.graphql,
    required this.userId,
  }) : super(UserState());

  @override
  Stream<UserState> mapEventToState(UserEvent event) async* {
    if (event is UserRequest) {
      yield await _mapUserRequestToState(state);
    }
  }

  Future<UserState> _mapUserRequestToState(UserState state) async {
    try {
      final result = await graphql.query(
        QueryOptions(
          document: gql(
            r"""
            query User($userId: String!) {
              user(identifier: {id: $userId}) {
                id
                createdAt
                name
              }
            }
            """,
          ),
          variables: {
            'userId': userId,
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      return state.copyWith(
        status: RequestStatus.success,
        user: User.fromJson(result.data!['user']),
      );
    } catch (error) {
      return state.copyWith(
        status: RequestStatus.failure,
        error: error,
      );
    }
  }
}
