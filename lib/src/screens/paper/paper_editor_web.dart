import 'dart:async';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:rxdart/rxdart.dart';

class PaperEditorPlatform extends StatefulWidget {
  final String? title;
  final String? content;
  final Function({String? title, String? content})? save;
  final bool readOnly;
  final bool todoItemReadOnly;

  PaperEditorPlatform({
    Key? key,
    this.title,
    this.content,
    this.save,
    required this.readOnly,
    required this.todoItemReadOnly,
  }) : super(key: key);

  @override
  _PaperEditorPlatformState createState() => _PaperEditorPlatformState();
}

class _PaperEditorPlatformState extends State<PaperEditorPlatform> {
  final _viewType = 'paper-editor';
  final _frame = IFrameElement();
  WindowBase? _window;
  StreamController<void>? _autoSaveStreamController;
  StreamSubscription? _autoSaveStreamSubscription;
  late final Function(Event) _messageHandler;

  @override
  void initState() {
    super.initState();

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(
      _viewType,
      (int viewId) => _frame
        ..src = '/assets/editor/index.html'
        ..style.border = 'none',
    );

    _autoSaveStreamController = StreamController<void>();
    _autoSaveStreamSubscription = _autoSaveStreamController?.stream
        .debounceTime(Duration(seconds: 3))
        .listen((_) => _postSaveState());

    _initMessage();
    _postSetState();
  }

  @override
  void dispose() {
    _autoSaveStreamSubscription?.cancel();
    _autoSaveStreamController?.close();

    _cleanMessage();
    super.dispose();
  }

  void _postSaveState() {
    _window?.postMessage({
      'type': 'saveState',
    }, '*');
  }

  void _postSetState() {
    _window?.postMessage({
      'type': 'setState',
      'data': {
        'title': widget.title,
        'content': widget.content,
        'config': {
          'readOnly': widget.readOnly,
          'todoItemReadOnly': widget.todoItemReadOnly,
        }
      },
    }, '*');
  }

  void _initMessage() {
    _messageHandler = (e) {
      e as MessageEvent;
      switch (e.data?['type']) {
        case 'editorReady':
          if (e.source != null) {
            _window = e.source as WindowBase;
            _postSetState();
          }
          break;
        case 'saveState':
          final title = e.data?['data']['title'];
          final content = e.data?['data']['content'];
          widget.save?.call(title: title, content: content);
          break;
        case 'stateChange':
          _autoSaveStreamController?.add(null);
          break;
      }
    };
    window.addEventListener('message', _messageHandler);
  }

  void _cleanMessage() {
    window.removeEventListener('message', _messageHandler);
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
