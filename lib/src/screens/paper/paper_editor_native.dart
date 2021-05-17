import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:rxdart/rxdart.dart';
import 'package:paper/src/extensions/extensions.dart';

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
  InAppWebViewController? _controller;
  StreamController<void>? _autoSaveStreamController;
  StreamSubscription? _autoSaveStreamSubscription;

  @override
  void initState() {
    super.initState();

    _autoSaveStreamController = StreamController<void>();
    _autoSaveStreamSubscription = _autoSaveStreamController?.stream
        .debounceTime(Duration(seconds: 3))
        .listen((_) => _postSaveState());
  }

  @override
  void dispose() {
    _autoSaveStreamSubscription?.cancel();
    _autoSaveStreamController?.close();

    super.dispose();
  }

  void _postSaveState() {
    _postMessage({
      'type': 'saveState',
    });
  }

  void _postSetState() async {
    await _postMessage({
      'type': 'setState',
      'data': {
        'title': widget.title,
        'content': widget.content,
        'config': {
          'readOnly': widget.readOnly,
          'todoItemReadOnly': widget.todoItemReadOnly,
        }
      },
    });
  }

  Future<void> _postMessage(dynamic msg) async {
    final str = jsonEncode(msg);
    await _controller?.evaluateJavascript(
      source: 'window.postMessage($str, "*")',
    );
  }

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialOptions: InAppWebViewGroupOptions(
        crossPlatform: InAppWebViewOptions(transparentBackground: true),
      ),
      initialFile: 'editor/index.html',
      onConsoleMessage: (controller, message) {
        if (kDebugMode) {
          print(message.message);
        }
      },
      onWebViewCreated: (controller) {
        _controller = controller;
        controller.addJavaScriptHandler(
          handlerName: 'postMessage',
          callback: (args) {
            final data = args.firstOrNull;
            switch (data?['type']) {
              case 'editorReady':
                _postSetState();
                break;
              case 'saveState':
                final title = data?['data']['title'];
                final content = data?['data']['content'];
                widget.save?.call(title: title, content: content);
                break;
              case 'stateChange':
                _autoSaveStreamController?.add(null);
                break;
            }
          },
        );
      },
    );
  }
}
