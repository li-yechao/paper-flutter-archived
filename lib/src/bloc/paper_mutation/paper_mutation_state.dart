part of 'paper_mutation_bloc.dart';

class PaperMutationState extends Equatable {
  final RequestStatus? createStatus;
  final dynamic createError;
  final Paper? createPaper;

  final RequestStatus? deleteStatus;
  final dynamic deleteError;
  final String? deletePaperId;

  PaperMutationState({
    this.createStatus,
    this.createError,
    this.createPaper,
    this.deleteStatus,
    this.deleteError,
    this.deletePaperId,
  });

  PaperMutationState copyWith({
    RequestStatus? createStatus,
    dynamic createError,
    Paper? createPaper,
    RequestStatus? deleteStatus,
    dynamic deleteError,
    String? deletePaperId,
  }) {
    return PaperMutationState(
      createStatus: createStatus ?? this.createStatus,
      createError: createError ?? this.createError,
      createPaper: createPaper ?? this.createPaper,
      deleteStatus: deleteStatus ?? this.deleteStatus,
      deleteError: deleteError ?? this.deleteError,
      deletePaperId: deletePaperId ?? this.deletePaperId,
    );
  }

  @override
  List<Object?> get props => [
        createStatus,
        createError,
        createPaper,
        deleteStatus,
        deleteError,
        deletePaperId,
      ];
}
