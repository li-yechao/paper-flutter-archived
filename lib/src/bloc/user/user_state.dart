part of 'user_bloc.dart';

class UserState extends Equatable {
  final RequestStatus? status;
  final dynamic error;
  final User? user;

  UserState({
    this.status,
    this.error,
    this.user,
  });

  UserState copyWith({
    RequestStatus? status,
    dynamic error,
    User? user,
  }) {
    return UserState(
      status: status ?? this.status,
      error: error ?? this.error,
      user: user ?? this.user,
    );
  }

  @override
  List<Object?> get props => [
        status,
        error,
        user,
      ];
}

class User {
  final String id;
  final String createdAt;
  final String name;

  User({
    required this.id,
    required this.createdAt,
    required this.name,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      createdAt: json['createdAt'],
      name: json['name'],
    );
  }
}
