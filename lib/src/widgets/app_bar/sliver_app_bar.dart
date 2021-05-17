import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/widgets/app_bar/user_button.dart';

class MySliverAppBar extends StatelessWidget {
  final Text? title;
  final Widget? flexibleSpace;
  final bool pinned;
  final bool floating;
  final double? expandedHeight;

  const MySliverAppBar({
    Key? key,
    this.title,
    this.flexibleSpace,
    this.pinned = true,
    this.floating = false,
    this.expandedHeight,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ViewerBloc, ViewerState>(
      builder: (context, state) {
        return SliverAppBar(
          pinned: pinned,
          floating: floating,
          expandedHeight: expandedHeight,
          title: title,
          centerTitle: false,
          flexibleSpace: flexibleSpace,
          actions: [
            Padding(
              padding: EdgeInsets.all(4),
              child: UserButton(),
            ),
            SizedBox(
              width: 20,
            ),
          ],
        );
      },
    );
  }
}
