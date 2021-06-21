import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
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
  InAppWebViewController? _controller;

  @override
  void initState() {
    super.initState();
    widget.controller.messager = this;
  }

  @override
  postMessage(e) {
    final str = jsonEncode(e);
    _controller?.evaluateJavascript(
      source: 'window.postMessage($str, "*")',
    );
  }

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialOptions: InAppWebViewGroupOptions(
        crossPlatform: InAppWebViewOptions(
          transparentBackground: true,
          disableContextMenu: true,
        ),
        ios: IOSInAppWebViewOptions(allowsInlineMediaPlayback: true),
      ),
      initialUrlRequest:
          URLRequest(url: Uri.parse(widget.controller.editorUri)),
      onConsoleMessage: kDebugMode
          ? (controller, message) {
              print(message.message);
            }
          : null,
      onWebViewCreated: (controller) {
        _controller = controller;
        controller.addJavaScriptHandler(
          handlerName: 'postMessage',
          callback: (e) {
            widget.controller.onMessage(e);
          },
        );
      },
    );
  }
}
