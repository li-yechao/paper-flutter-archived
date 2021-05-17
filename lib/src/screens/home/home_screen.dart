import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/widgets/app_bar/sliver_app_bar.dart';

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
              return Center(child: CircularProgressIndicator());
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
                  child: Text('Welcome, ${viewer.name}.'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
