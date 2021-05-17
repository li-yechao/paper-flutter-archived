import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/router/app.dart';

class UserButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final viewerBloc = context.watch<ViewerBloc>();
    final viewer = viewerBloc.state.viewer;

    return viewer != null
        ? PopupMenuButton(
            offset: kIsWeb
                ? Offset(0, 56)
                : Platform.isIOS
                    ? Offset(0, 8)
                    : Offset.zero,
            tooltip: 'User',
            child: Padding(
              padding: EdgeInsets.only(left: 10),
              child: Row(
                children: [
                  SizedBox.fromSize(
                    size: Size.square(32),
                    child: CircleAvatar(
                      child: Text(
                        viewer.name.substring(0, 1),
                      ),
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_down,
                    color: Colors.grey[300],
                  ),
                ],
              ),
            ),
            itemBuilder: (BuildContext context) {
              return <PopupMenuEntry<dynamic>>[
                PopupMenuItem(
                  value: 'sign_out',
                  height: 40,
                  child: Row(
                    children: [
                      Padding(
                        padding: EdgeInsets.only(right: 8.0),
                        child: Icon(
                          Icons.logout,
                          color: Theme.of(context).textTheme.caption?.color,
                        ),
                      ),
                      Text('Sign Out'),
                    ],
                  ),
                ),
              ];
            },
            onSelected: (value) async {
              switch (value) {
                case 'sign_out':
                  viewerBloc.add(ViewerSignOut());
                  context
                      .read<MyRouterDelegate>()
                      .push(MyRouteConfiguration.home());
                  break;
              }
            },
          )
        : InkWell(
            borderRadius: BorderRadius.circular(4),
            child: Padding(
              padding: EdgeInsets.only(left: 4, right: 8),
              child: Row(
                children: [
                  Padding(
                    padding: EdgeInsets.only(right: 4),
                    child: Icon(Icons.login),
                  ),
                  Text('Sign In'),
                ],
              ),
            ),
            onTap: () {
              context
                  .read<MyRouterDelegate>()
                  .push(MyRouteConfiguration.auth());
            },
          );
  }
}
