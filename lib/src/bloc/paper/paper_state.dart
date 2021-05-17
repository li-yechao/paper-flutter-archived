part of 'paper_bloc.dart';

class PaperState extends Equatable {
  final RequestStatus? status;
  final dynamic error;
  final PaperWithContent? paper;

  PaperState({
    this.status,
    this.error,
    this.paper,
  });

  PaperState copyWith({
    RequestStatus? status,
    PaperWithContent? paper,
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

class PaperWithContent extends Paper {
  final String? content;

  PaperWithContent({
    required String id,
    required String createdAt,
    required String updatedAt,
    String? title,
    this.content,
    required bool canViewerWritePaper,
    required User user,
  }) : super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
          title: title,
          canViewerWritePaper: canViewerWritePaper,
          user: user,
        );

  factory PaperWithContent.fromJson({
    required Map<String, dynamic> json,
    required User user,
  }) {
    return PaperWithContent(
      id: json['id'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      title: json['title'],
      content: json['content'],
      canViewerWritePaper: json['canViewerWritePaper'],
      user: user,
    );
  }
}
