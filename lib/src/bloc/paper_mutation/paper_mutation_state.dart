part of 'paper_mutation_bloc.dart';

class PaperMutationState extends Equatable {
  final RequestStatus? createStatus;
  final dynamic createError;
  final PaperWithContent? createPaper;

  final RequestStatus? updateStatus;
  final dynamic updateError;
  final PaperWithContent? updatePaper;

  final RequestStatus? deleteStatus;
  final dynamic deleteError;
  final String? deletePaperId;

  PaperMutationState({
    this.createStatus,
    this.createError,
    this.createPaper,
    this.updateStatus,
    this.updateError,
    this.updatePaper,
    this.deleteStatus,
    this.deleteError,
    this.deletePaperId,
  });

  PaperMutationState copyWith({
    RequestStatus? createStatus,
    dynamic createError,
    PaperWithContent? createPaper,
    RequestStatus? updateStatus,
    dynamic updateError,
    PaperWithContent? updatePaper,
    RequestStatus? deleteStatus,
    dynamic deleteError,
    String? deletePaperId,
  }) {
    return PaperMutationState(
      createStatus: createStatus ?? this.createStatus,
      createError: createError ?? this.createError,
      createPaper: createPaper ?? this.createPaper,
      updateStatus: updateStatus ?? this.updateStatus,
      updateError: updateError ?? this.updateError,
      updatePaper: updatePaper ?? this.updatePaper,
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
        updateStatus,
        updateError,
        updatePaper,
        deleteStatus,
        deleteError,
        deletePaperId,
      ];
}
