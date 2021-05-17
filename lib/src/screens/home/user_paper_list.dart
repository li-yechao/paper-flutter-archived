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
      child: Builder(
        builder: (context) {
          return MultiBlocListener(
            listeners: [
              BlocListener<PaperMutationBloc, PaperMutationState>(
                listenWhen: (previous, current) {
                  return previous.createStatus != current.createStatus;
                },
                listener: (context, state) {
                  if (state.createStatus == RequestStatus.success) {
                    context
                        .read<UserPapersBloc>()
                        .add(UserPapersRequestNewly());
                  }
                },
              ),
              BlocListener<PaperMutationBloc, PaperMutationState>(
                listenWhen: (previous, current) {
                  return previous.updateStatus != current.updateStatus;
                },
                listener: (context, state) {
                  if (state.updateStatus == RequestStatus.success) {
                    context.read<UserPapersBloc>()
                      ..add(UserPapersUpdated(paper: state.updatePaper!))
                      ..add(UserPapersRequestNewly());
                  }
                },
              ),
              BlocListener<PaperMutationBloc, PaperMutationState>(
                listenWhen: (previous, current) {
                  return previous.deleteStatus != current.deleteStatus;
                },
                listener: (context, state) {
                  if (state.deleteStatus == RequestStatus.success) {
                    context.read<UserPapersBloc>()
                      ..add(UserPapersDeleted(paperId: state.deletePaperId!))
                      ..add(UserPapersRequestNewly());
                  }
                },
              ),
            ],
            child: ScrollLoadListener(
              onReachBottom: () {
                context.read<UserPapersBloc>()..add(UserPapersRequest());
              },
              child: child,
            ),
          );
        },
      ),
    );
  }
}

class UserPaperList extends UserPaperListPlatform {}
