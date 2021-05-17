part of 'viewer_bloc.dart';

class ViewerState extends Equatable {
  final RequestStatus? status;
  final dynamic error;
  final User? viewer;

  ViewerState({
    this.status,
    this.error,
    this.viewer,
  });

  ViewerState copyWith({
    RequestStatus? status,
    dynamic error,
    User? viewer,
  }) {
    return ViewerState(
      status: status ?? this.status,
      error: error ?? this.error,
      viewer: viewer ?? this.viewer,
    );
  }

  @override
  List<Object?> get props => [
        status,
        error,
        viewer,
      ];
}
