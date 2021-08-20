import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/widgets/app_bar/sliver_app_bar.dart';

import 'user_paper_list.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<ViewerBloc, ViewerState>(
        builder: (context, state) {
          final viewer = state.viewer;

          if (viewer == null) {
            if (state.status == RequestStatus.initial) {
              return Center(child: CupertinoActivityIndicator());
            }
            return CustomScrollView(
              physics: BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              slivers: [
                MySliverAppBar(
                  title: Text('Paper'),
                ),
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text('Welcome...'),
                  ),
                ),
              ],
            );
          }

          return UserPaperListProvider(
            userId: viewer.id,
            child: Builder(
              builder: (context) {
                return CupertinoScrollbar(
                  child: CustomScrollView(
                    physics: BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    slivers: [
                      MySliverAppBar(
                        title: Text('Paper'),
                      ),
                      CupertinoSliverRefreshControl(
                        refreshTriggerPullDistance: 100,
                        refreshIndicatorExtent: 60,
                        onRefresh: () async {
                          final completer = Completer();

                          final papersBloc = context.read<UserPapersBloc>();
                          final subscription =
                              papersBloc.stream.listen((event) {
                            if (event.status == RequestStatus.success ||
                                event.status == RequestStatus.failure) {
                              completer.complete();
                            }
                          });
                          papersBloc.add(UserPapersRequestNewly());

                          await completer.future;
                          subscription.cancel();
                        },
                      ),
                      UserPaperList(),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
