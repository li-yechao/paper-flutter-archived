import 'dart:async';

import 'package:flutter/widgets.dart';

const _DISTANCE = 100;

final _reachBottomDebouncer = _Debouncer(milliseconds: 300);

class ScrollLoadListener extends StatelessWidget {
  final Widget child;

  final Function? onReachBottom;

  const ScrollLoadListener({
    Key? key,
    required this.child,
    this.onReachBottom,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (info) {
        _reachBottomDebouncer.run(() {
          if (info.metrics.pixels >= info.metrics.maxScrollExtent - _DISTANCE) {
            onReachBottom?.call();
          }
        });
        return false;
      },
      child: child,
    );
  }
}

class _Debouncer {
  final int milliseconds;
  VoidCallback? action;
  Timer? _timer;

  _Debouncer({required this.milliseconds});

  run(VoidCallback action) {
    _timer?.cancel();

    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }
}
