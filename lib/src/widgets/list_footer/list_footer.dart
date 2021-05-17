import 'package:flutter/material.dart';
import 'package:paper/src/bloc/type.dart';

class ListFooter extends StatelessWidget {
  final RequestStatus? status;
  final bool noMore;

  const ListFooter({
    Key? key,
    this.status,
    this.noMore = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Text(
            status == RequestStatus.initial
                ? 'Loading...'
                : noMore
                    ? 'No More'
                    : 'Load More',
            style: Theme.of(context).textTheme.caption,
          ),
        ),
      ),
    );
  }
}
