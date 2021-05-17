import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/router/app.dart';
import 'package:provider/provider.dart';

class NewButton extends StatelessWidget {
  const NewButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocListener<PaperMutationBloc, PaperMutationState>(
      listenWhen: (previous, current) {
        return previous.createStatus != current.createStatus;
      },
      listener: (context, state) {
        if (state.createStatus == RequestStatus.success) {
          final paper = state.createPaper;
          if (paper != null) {
            context.read<MyRouterDelegate>().push(MyRouteConfiguration.paper(
                  userId: paper.user.id,
                  paperId: paper.id,
                ));
          }
        }
      },
      child: InkWell(
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
      ),
    );
  }
}
