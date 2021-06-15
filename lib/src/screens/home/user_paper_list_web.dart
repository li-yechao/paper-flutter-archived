import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/user_papers/user_papers_bloc.dart';
import 'package:paper/src/extensions/extensions.dart';
import 'package:paper/src/router/app.dart';
import 'package:paper/src/widgets/hover/hover.dart';
import 'package:paper/src/widgets/list_footer/list_footer.dart';

class UserPaperListPlatform extends StatelessWidget {
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
          );
        },
        childCount: edges.length + 1,
      ),
    );
  }
}

class PaperItem extends StatelessWidget {
  final Paper paper;

  const PaperItem({
    Key? key,
    required this.paper,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Hover(
        builder: (context, isHover) {
          return Container(
            constraints: BoxConstraints(maxWidth: 800),
            child: ListTile(
              title: Text(paper.title.blankOr('Untitled')),
              subtitle: Text(
                DateFormat().format(
                  DateTime.fromMillisecondsSinceEpoch(
                    int.parse(paper.updatedAt),
                  ),
                ),
              ),
              trailing: Visibility(
                visible: isHover,
                maintainState: true,
                maintainSize: true,
                maintainAnimation: true,
                maintainInteractivity: true,
                child: Container(
                  width: 40,
                  height: 40,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: Material(
                      color: Colors.transparent,
                      child: PopupMenuButton(
                        tooltip: 'More Actions',
                        padding: EdgeInsets.zero,
                        icon: Icon(Icons.more_horiz),
                        itemBuilder: (context) {
                          return <PopupMenuEntry<String>>[
                            PopupMenuItem(
                              value: 'delete',
                              child: Row(
                                children: [
                                  Padding(
                                    padding: EdgeInsets.only(right: 8),
                                    child: Icon(Icons.delete_outline),
                                  ),
                                  Text('Delete'),
                                ],
                              ),
                            ),
                          ];
                        },
                        onSelected: (value) {
                          switch (value) {
                            case 'delete':
                              context.read<PaperMutationBloc>().add(PaperDelete(
                                    userId: paper.user.id,
                                    paperId: paper.id,
                                  ));
                              break;
                          }
                        },
                      ),
                    ),
                  ),
                ),
              ),
              onTap: () {
                context
                    .read<MyRouterDelegate>()
                    .push(MyRouteConfiguration.paper(
                      userId: paper.user.id,
                      paperId: paper.id,
                    ));
              },
            ),
          );
        },
      ),
    );
  }
}
