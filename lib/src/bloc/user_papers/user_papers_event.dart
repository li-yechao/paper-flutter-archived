part of 'user_papers_bloc.dart';

abstract class UserPapersEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class UserPapersRequest extends UserPapersEvent {}

class UserPapersRequestNewly extends UserPapersEvent {}

class UserPapersUpdated extends UserPapersEvent {
  final String userId;
  final String paperId;

  UserPapersUpdated({required this.userId, required this.paperId});
}

class UserPapersDeleted extends UserPapersEvent {
  final String userId;
  final String paperId;

  UserPapersDeleted({required this.userId, required this.paperId});
}
