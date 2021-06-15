// ignore: avoid_web_libraries_in_flutter
import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:paper/src/screens/paper/paper_editor.dart';

class PaperEditorPlatform extends StatefulWidget {
  final PaperEditorController controller;

  PaperEditorPlatform({
    Key? key,
    required this.controller,
  }) : super(key: key);

  @override
  _PaperEditorPlatformState createState() => _PaperEditorPlatformState();
}

class _PaperEditorPlatformState extends State<PaperEditorPlatform>
    implements Messager {
  final _viewType = 'paper-editor';
  final _frame = IFrameElement();
  late final Function(Event) _messageHandler;

  @override
  void initState() {
    super.initState();

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(
      _viewType,
      (int viewId) => _frame
        ..src = widget.controller.editorUri
        ..style.border = 'none',
    );

    widget.controller.messager = this;

    _messageHandler = (e) {
      e as MessageEvent;
      widget.controller.onMessage(e.data);
    };
    window.addEventListener('message', _messageHandler);
  }

  @override
  void dispose() {
    super.dispose();
    window.removeEventListener('message', _messageHandler);
  }

  @override
  postMessage(e) {
    _frame.contentWindow?.postMessage(e, '*');
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
