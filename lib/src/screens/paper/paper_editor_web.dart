// ignore: avoid_web_libraries_in_flutter
import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:paper/src/common/config.dart';

class PaperEditorPlatform extends StatefulWidget {
  final String accessToken;
  final String userId;
  final String paperId;
  final bool readOnly;
  final bool todoItemReadOnly;

  PaperEditorPlatform({
    Key? key,
    required this.accessToken,
    required this.userId,
    required this.paperId,
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

    _initMessage();
    _postSetState();
  }

  @override
  void dispose() {
    _cleanMessage();
    super.dispose();
  }

  void _postSetState() {
    _window?.postMessage({
      'type': 'setState',
      'config': {
        'readOnly': widget.readOnly,
        'todoItemReadOnly': widget.todoItemReadOnly,
        'ipfsApi': Config.ipfsApi,
        'ipfsGateway': Config.ipfsGateway,
      },
      'collab': {
        'webSocketUri': Config.collabWebSocketUri,
        'userId': widget.userId,
        'paperId': widget.paperId,
        'accessToken': widget.accessToken,
      },
    }, '*');
  }

  void _initMessage() {
    _messageHandler = (e) {
      e as MessageEvent;
      switch (e.data['type']) {
        case 'editorReady':
          if (e.source != null) {
            _window = e.source as WindowBase;
            _postSetState();
          }
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
