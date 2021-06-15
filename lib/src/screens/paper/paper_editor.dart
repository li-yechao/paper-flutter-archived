import 'package:flutter/widgets.dart';
import 'package:paper/src/extensions/extensions.dart';

import './paper_editor_native.dart'
    if (dart.library.html) './paper_editor_web.dart';

class PaperEditorValue {
  PaperEditorValue();

  PaperEditorValue copyWith() {
    return PaperEditorValue();
  }
}

class PaperEditorController extends ValueNotifier<PaperEditorValue> {
  final String editorUri = '/assets/editor/index.html';

  final String accessToken;
  final String userId;
  final String paperId;
  final String? ipfsApi;
  final String? ipfsGateway;
  final String? collabSocketIoUri;

  PaperEditorController({
    required this.accessToken,
    required this.userId,
    required this.paperId,
    this.ipfsApi,
    this.ipfsGateway,
    this.collabSocketIoUri,
  }) : super(PaperEditorValue());

  Messager? _messager;
  set messager(Messager messager) {
    _messager = messager;
  }

  _init() {
    _messager?.postMessage([
      'init',
      {
        'ipfsApi': ipfsApi,
        'ipfsGateway': ipfsGateway,
        'collab': {
          'socketIoUri': collabSocketIoUri,
          'userId': userId,
          'paperId': paperId,
          'accessToken': accessToken,
        },
      },
    ]);
  }

  onMessage(dynamic e) {
    if (e is List) {
      switch (e.firstOrNull) {
        case 'ready':
          _init();
          break;
      }
    }
  }
}

abstract class Messager {
  postMessage(dynamic e);
}

class PaperEditor extends PaperEditorPlatform {
  PaperEditor({
    Key? key,
    required PaperEditorController controller,
  }) : super(
          key: key,
          controller: controller,
        );
}
