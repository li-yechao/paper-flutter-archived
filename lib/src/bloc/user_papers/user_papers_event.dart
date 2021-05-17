part of 'user_papers_bloc.dart';

abstract class UserPapersEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class UserPapersRequest extends UserPapersEvent {}

class UserPapersRequestNewly extends UserPapersEvent {}

class UserPapersUpdated extends UserPapersEvent {
  final Paper paper;

  UserPapersUpdated({required this.paper});
}

class UserPapersDeleted extends UserPapersEvent {
  final String paperId;

  UserPapersDeleted({required this.paperId});
}
