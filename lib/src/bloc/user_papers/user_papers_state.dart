part of 'user_papers_bloc.dart';

class UserPapersState extends Equatable {
  final RequestStatus? status;
  final dynamic error;
  final List<Edge<Paper>> edges;
  final int? total;
  final OrderBy<PaperOrderField> orderBy;

  UserPapersState({
    this.status,
    this.error,
    this.edges = const [],
    this.total,
    this.orderBy = const OrderBy(
      field: PaperOrderField.ID,
      direction: OrderDirection.ASC,
    ),
  });

  UserPapersState copyWith({
    RequestStatus? status,
    dynamic error,
    List<Edge<Paper>>? edges,
    int? total,
  }) {
    return UserPapersState(
      status: status ?? this.status,
      error: error ?? this.error,
      edges: edges ?? this.edges,
      total: total ?? this.total,
      orderBy: this.orderBy,
    );
  }

  @override
  List<Object?> get props => [
        status,
        error,
        edges,
        total,
        orderBy,
      ];
}

enum PaperOrderField { ID, UPDATED_AT }

class Paper {
  final String id;
  final String createdAt;
  final String updatedAt;
  final String? title;
  final bool canViewerWritePaper;

  final User user;

  Paper({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.title,
    required this.canViewerWritePaper,
    required this.user,
  });

  factory Paper.fromJson({
    required Map<String, dynamic> json,
    required User user,
  }) {
    return Paper(
      id: json['id'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      title: json['title'],
      canViewerWritePaper: json['canViewerWritePaper'],
      user: user,
    );
  }
}
