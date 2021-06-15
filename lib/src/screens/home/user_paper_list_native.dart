import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';
import 'package:paper/src/extensions/extensions.dart';
import 'package:paper/src/router/app.dart';
import 'package:paper/src/widgets/list_footer/list_footer.dart';

class UserPaperListPlatform extends StatefulWidget {
  @override
  _UserPaperListPlatformState createState() => _UserPaperListPlatformState();
}

class _UserPaperListPlatformState extends State<UserPaperListPlatform> {
  final _slidableController = SlidableController();

  @override
  Widget build(BuildContext context) {
    final papersBloc = context.watch<UserPapersBloc>();
    final status = papersBloc.state.status;
    final total = papersBloc.state.total;
    final edges = papersBloc.state.edges;

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= edges.length) {
            return ListFooter(
              status: status,
              noMore: edges.length >= (total ?? 0),
            );
          }

          final paper = edges[index].node;

          return PaperItem(
            paper: paper,
            slidableController: _slidableController,
          );
        },
        childCount: edges.length + 1,
      ),
    );
  }
}

class PaperItem extends StatelessWidget {
  final Paper paper;
  final SlidableController slidableController;

  const PaperItem({
    Key? key,
    required this.paper,
    required this.slidableController,
  }) : super(key: key);

  void _deletePaper(BuildContext context) {
    context.read<UserPapersBloc>()
      ..add(UserPapersDeleted(userId: paper.user.id, paperId: paper.id));
    context.read<PaperMutationBloc>().add(PaperDelete(
          userId: paper.user.id,
          paperId: paper.id,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Slidable(
      controller: slidableController,
      actionPane: SlidableDrawerActionPane(),
      key: Key(paper.id),
      child: ListTile(
        title: Text(paper.title.blankOr('Untitled')),
        subtitle: Text(
          DateFormat().format(
            DateTime.fromMillisecondsSinceEpoch(
              int.parse(paper.updatedAt),
            ),
          ),
        ),
        onTap: () {
          context.read<MyRouterDelegate>().push(MyRouteConfiguration.paper(
                userId: paper.user.id,
                paperId: paper.id,
              ));
        },
      ),
      dismissal: SlidableDismissal(
        child: SlidableDrawerDismissal(),
        onDismissed: (actionType) {
          if (actionType == SlideActionType.secondary) {
            _deletePaper(context);
          }
        },
      ),
      secondaryActions: [
        IconSlideAction(
          color: Theme.of(context).colorScheme.error,
          caption: 'Delete',
          icon: Icons.delete_outline,
          onTap: () => _deletePaper(context),
        ),
      ],
    );
  }
}
