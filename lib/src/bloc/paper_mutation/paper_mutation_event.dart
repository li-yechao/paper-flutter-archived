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

  PaperUpdate({
    required this.userId,
    required this.paperId,
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
