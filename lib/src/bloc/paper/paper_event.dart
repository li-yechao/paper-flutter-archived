part of 'paper_bloc.dart';

abstract class PaperEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class PaperRequest extends PaperEvent {}

class PaperUpdated extends PaperEvent {
  final PaperWithContent paper;

  PaperUpdated({required this.paper});
}
