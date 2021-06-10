import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:paper/src/common/config.dart';
import 'package:paper/src/extensions/extensions.dart';

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
  InAppWebViewController? _controller;

  void _postSetState() async {
    await _postMessage({
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
        ios: IOSInAppWebViewOptions(allowsInlineMediaPlayback: true),
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
            }
          },
        );
      },
    );
  }
}
