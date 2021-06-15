import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/router/app.dart';

class NewButton extends StatefulWidget {
  const NewButton({Key? key}) : super(key: key);

  @override
  _NewButtonState createState() => _NewButtonState();
}

class _NewButtonState extends State<NewButton> {
  StreamSubscription? _createdSubscription;

  @override
  void initState() {
    super.initState();

    final paperMutationBloc = context.read<PaperMutationBloc>();
    _createdSubscription = paperMutationBloc.createdSubject.listen((value) {
      context.read<MyRouterDelegate>().push(MyRouteConfiguration.paper(
            userId: value.user.id,
            paperId: value.id,
          ));
    });
  }

  @override
  void dispose() {
    _createdSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: EdgeInsets.only(left: 4, right: 8),
        child: Row(
          children: [
            Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.add),
            ),
            Text('New'),
          ],
        ),
      ),
      onTap: () {
        final viewer = context.read<ViewerBloc>().state.viewer;
        if (viewer == null) {
          return;
        }
        context.read<PaperMutationBloc>().add(PaperCreate(
              userId: viewer.id,
            ));
      },
    );
  }
}
