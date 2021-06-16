// ignore: avoid_web_libraries_in_flutter
import 'dart:html';

import 'package:flutter/material.dart';

class SaveEventListenerPlatform extends StatefulWidget {
  final Widget child;
  final Function() onSave;

  const SaveEventListenerPlatform({
    Key? key,
    required this.child,
    required this.onSave,
  }) : super(key: key);

  @override
  _SaveEventListenerPlatformState createState() =>
      _SaveEventListenerPlatformState();
}

class _SaveEventListenerPlatformState extends State<SaveEventListenerPlatform> {
  late final Function(Event) _onKeydown;

  @override
  void initState() {
    super.initState();

    _onKeydown = (Event event) {
      event as KeyboardEvent;
      if (event.metaKey) {
        if (event.key == 's') {
          event.preventDefault();
          widget.onSave();
        }
      }
    };
    window.addEventListener('keydown', _onKeydown);
  }

  @override
  void dispose() {
    window.removeEventListener('keydown', _onKeydown);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
