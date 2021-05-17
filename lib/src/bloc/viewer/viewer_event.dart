part of 'viewer_bloc.dart';

abstract class ViewerEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class ViewerRequest extends ViewerEvent {}

class ViewerGithubCodeSignIn extends ViewerEvent {
  final String clientId;
  final String code;

  ViewerGithubCodeSignIn({
    required this.clientId,
    required this.code,
  });
}

class ViewerSignOut extends ViewerEvent {}
