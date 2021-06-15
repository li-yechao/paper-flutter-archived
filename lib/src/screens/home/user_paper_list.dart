import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';
import 'package:paper/src/graphql/client.dart';
import 'package:paper/src/widgets/scroll_load_listener/scroll_load_listener.dart';

import 'user_paper_list_native.dart'
    if (dart.library.html) 'user_paper_list_web.dart';

class UserPaperListProvider extends StatelessWidget {
  final String userId;
  final Widget child;

  const UserPaperListProvider({
    Key? key,
    required this.userId,
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => UserPapersBloc(
        graphql: GraphQLInstance.client,
        userId: userId,
      )..add(UserPapersRequest()),
      child: _UserPapersListProvider(child: child),
    );
  }
}

class _UserPapersListProvider extends StatefulWidget {
  final Widget child;

  _UserPapersListProvider({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  __UserPapersListProviderState createState() =>
      __UserPapersListProviderState();
}

class __UserPapersListProviderState extends State<_UserPapersListProvider> {
  StreamSubscription? _createdSubscription;
  StreamSubscription? _updatedSubscription;
  StreamSubscription? _deletedSubscription;

  @override
  void initState() {
    super.initState();

    final paperMutationBloc = context.read<PaperMutationBloc>();
    _createdSubscription = paperMutationBloc.createdSubject.listen((value) {
      context.read<UserPapersBloc>().add(UserPapersRequestNewly());
    });
    _updatedSubscription = paperMutationBloc.updatedSubject.listen((value) {
      context.read<UserPapersBloc>().add(UserPapersUpdated(
            userId: value.userId,
            paperId: value.paperId,
          ));
    });
    _deletedSubscription = paperMutationBloc.deletedSubject.listen((value) {
      context.read<UserPapersBloc>()
        ..add(UserPapersDeleted(
          userId: value.userId,
          paperId: value.paperId,
        ))
        ..add(UserPapersRequestNewly());
    });
  }

  @override
  void dispose() {
    _createdSubscription?.cancel();
    _updatedSubscription?.cancel();
    _deletedSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScrollLoadListener(
      onReachBottom: () {
        context.read<UserPapersBloc>()..add(UserPapersRequest());
      },
      child: widget.child,
    );
  }
}

class UserPaperList extends UserPaperListPlatform {}
