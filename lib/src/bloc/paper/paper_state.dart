part of 'paper_bloc.dart';

class PaperState extends Equatable {
  final RequestStatus? status;
  final dynamic error;
  final Paper? paper;

  PaperState({
    this.status,
    this.error,
    this.paper,
  });

  PaperState copyWith({
    RequestStatus? status,
    Paper? paper,
    dynamic error,
  }) {
    return PaperState(
      status: status ?? this.status,
      error: error ?? this.error,
      paper: paper ?? this.paper,
    );
  }

  @override
  List<Object?> get props => [
        status,
        error,
        paper,
      ];
}
