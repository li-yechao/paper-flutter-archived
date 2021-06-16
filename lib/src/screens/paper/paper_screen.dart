import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:paper/src/bloc/paper/paper_bloc.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/common/config.dart';
import 'package:paper/src/common/storage.dart';
import 'package:paper/src/extensions/extensions.dart';
import 'package:paper/src/graphql/client.dart';
import 'package:paper/src/screens/paper/save_event_listener.dart';

import 'paper_editor.dart';

class PaperScreen extends StatelessWidget {
  final String userId;
  final String paperId;

  const PaperScreen({
    Key? key,
    required this.userId,
    required this.paperId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => PaperBloc(
        graphql: GraphQLInstance.client,
        userId: userId,
        paperId: paperId,
      )..add(PaperRequest()),
      child: _PaperScreen(),
    );
  }
}

class _PaperScreen extends StatefulWidget {
  const _PaperScreen({Key? key}) : super(key: key);

  @override
  __PaperScreenState createState() => __PaperScreenState();
}

class __PaperScreenState extends State<_PaperScreen> {
  final _controller = PaperEditorController();
  bool _changed = false;
  PaperMutationBloc? _paperMutationBloc;

  @override
  void initState() {
    super.initState();

    _paperMutationBloc = context.read<PaperMutationBloc>();
    final paperBloc = context.read<PaperBloc>();

    Storage.token.then((token) {
      if (token != null) {
        _controller.config = PaperEditorConfig(
          accessToken: token.accessToken,
          userId: paperBloc.userId,
          paperId: paperBloc.paperId,
          ipfsApi: Config.ipfsApi,
          ipfsGateway: Config.ipfsGateway,
          collabSocketIoUri: Config.collabSocketIoUri,
        );
      }
    });

    _controller.addListener(() {
      _changed = true;
    });
  }

  @override
  void dispose() {
    super.dispose();

    if (_changed) {
      final config = _controller.config;
      if (config != null) {
        _paperMutationBloc?.updatedSubject.add(PaperUpdate(
          userId: config.userId,
          paperId: config.paperId,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SaveEventListener(
      onSave: () {
        _controller.save();
      },
      child: Scaffold(
        appBar: AppBar(
          centerTitle: false,
          title: ValueListenableBuilder<PaperEditorValue>(
            valueListenable: _controller,
            builder: (context, value, _) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(value.title.blankOr('Untitled')),
                  if (value.persistence != null)
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            DateFormat().format(
                              DateTime.fromMillisecondsSinceEpoch(
                                value.persistence!.updatedAt,
                              ),
                            ),
                            style: Theme.of(context).textTheme.caption,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _UpdatePaperIndicator(
                          waiting: value.isPersistentWaiting,
                        ),
                      ],
                    ),
                ],
              );
            },
          ),
        ),
        body: BlocConsumer<PaperBloc, PaperState>(
          listener: (context, state) {
            final paper = state.paper;
            if (paper != null) {
              _controller.value =
                  _controller.value.copyWith(title: paper.title);
            }
          },
          builder: (context, state) {
            return state.status == RequestStatus.success
                ? PaperEditor(
                    controller: _controller,
                  )
                : state.status == RequestStatus.failure
                    ? Center(
                        child: Text(state.error.toString()),
                      )
                    : Center(
                        child: CupertinoActivityIndicator(),
                      );
          },
        ),
      ),
    );
  }
}

class _UpdatePaperIndicator extends StatelessWidget {
  final bool waiting;

  const _UpdatePaperIndicator({
    Key? key,
    required this.waiting,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: Duration(milliseconds: 200),
      child: waiting
          ? Icon(
              Icons.hourglass_top,
              color: Theme.of(context).colorScheme.secondary,
              size: 14,
            )
          : Icon(
              Icons.check,
              color: Theme.of(context).colorScheme.secondary,
              size: 14,
            ),
    );
  }
}
