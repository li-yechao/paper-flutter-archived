import 'package:flutter/material.dart';
import 'package:paper/src/widgets/app_bar/sliver_app_bar.dart';

class ErrorScreen extends StatefulWidget {
  final dynamic error;

  const ErrorScreen({Key? key, this.error}) : super(key: key);

  @override
  _ErrorScreenState createState() => _ErrorScreenState(error: error);
}

class _ErrorScreenState extends State<ErrorScreen> {
  final dynamic error;

  _ErrorScreenState({this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        physics: BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          MySliverAppBar(),
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Text(error.toString()),
            ),
          ),
        ],
      ),
    );
  }
}
