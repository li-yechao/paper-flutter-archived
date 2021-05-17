part of 'paper_mutation_bloc.dart';

abstract class PaperMutationEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class PaperCreate extends PaperMutationEvent {
  final String userId;

  PaperCreate({
    required this.userId,
  });
}

class PaperUpdate extends PaperMutationEvent {
  final String userId;
  final String paperId;
  final String? title;
  final String? content;

  PaperUpdate({
    required this.userId,
    required this.paperId,
    this.title,
    this.content,
  });
}

class PaperDelete extends PaperMutationEvent {
  final String userId;
  final String paperId;

  PaperDelete({
    required this.userId,
    required this.paperId,
  });
}
