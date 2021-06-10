import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:paper/src/bloc/paper/paper_bloc.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/common/storage.dart';
import 'package:paper/src/extensions/extensions.dart';
import 'package:paper/src/graphql/client.dart';

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
      child: Builder(
        builder: (context) {
          final paperState = context.watch<PaperBloc>().state;

          return Scaffold(
            appBar: AppBar(
              centerTitle: false,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text((paperState.paper?.title).blankOr('Untitled')),
                  if (paperState.paper != null)
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            DateFormat().format(
                              DateTime.fromMillisecondsSinceEpoch(
                                int.parse(paperState.paper!.updatedAt),
                              ),
                            ),
                            style: Theme.of(context).textTheme.caption,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _UpdatePaperIndicator(
                          status: RequestStatus.success,
                        ),
                      ],
                    ),
                ],
              ),
            ),
            body: FutureBuilder(
              future: Storage.token,
              builder: (context, AsyncSnapshot<Token?> snapshot) {
                if (snapshot.hasError) {
                  return Center(
                    child: Text(snapshot.error.toString()),
                  );
                } else if (snapshot.data == null) {
                  return Center(
                    child: Text('AccessToken is required'),
                  );
                }
                return paperState.status == RequestStatus.success
                    ? PaperEditor(
                        accessToken: snapshot.data!.accessToken,
                        userId: userId,
                        paperId: paperId,
                        readOnly:
                            !(paperState.paper?.canViewerWritePaper == true),
                        todoItemReadOnly:
                            !(paperState.paper?.canViewerWritePaper == true),
                      )
                    : paperState.status == RequestStatus.failure
                        ? Center(
                            child: Text(paperState.error.toString()),
                          )
                        : Center(
                            child: CupertinoActivityIndicator(),
                          );
              },
            ),
          );
        },
      ),
    );
  }
}

class _UpdatePaperIndicator extends StatelessWidget {
  final RequestStatus? status;

  const _UpdatePaperIndicator({
    Key? key,
    this.status,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: Duration(milliseconds: 200),
      child: status == RequestStatus.failure
          ? Icon(
              Icons.error,
              color: Theme.of(context).colorScheme.error,
              size: 14,
            )
          : status == RequestStatus.initial
              ? SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1,
                  ),
                )
              : Icon(
                  Icons.check,
                  color: Theme.of(context).colorScheme.secondary,
                  size: 14,
                ),
    );
  }
}
