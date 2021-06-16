import 'package:flutter/material.dart';

class SaveEventListenerPlatform extends StatelessWidget {
  final Widget child;
  final Function() onSave;

  const SaveEventListenerPlatform({
    Key? key,
    required this.child,
    required this.onSave,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
