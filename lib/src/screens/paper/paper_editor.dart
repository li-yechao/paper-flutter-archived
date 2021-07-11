import 'package:flutter/widgets.dart';
import 'package:paper/src/common/config.dart';
import 'package:paper/src/extensions/extensions.dart';

import './paper_editor_native.dart'
    if (dart.library.html) './paper_editor_web.dart';

class PaperEditorValue {
  final String? title;
  final int? version;
  final Persistence? persistence;

  bool get isPersistentWaiting {
    return version != null &&
        persistence != null &&
        version! > persistence!.version;
  }

  PaperEditorValue({
    this.title,
    this.version,
    this.persistence,
  });

  PaperEditorValue copyWith({
    String? title,
    int? version,
    Persistence? persistence,
  }) {
    return PaperEditorValue(
      title: title ?? this.title,
      version: version ?? this.version,
      persistence: persistence ?? this.persistence,
    );
  }
}

class Persistence {
  final int version;
  final int updatedAt;

  Persistence({required this.version, required this.updatedAt});
}

class PaperEditorConfig {
  final String accessToken;
  final String userId;
  final String paperId;
  final String socketUri;

  PaperEditorConfig({
    required this.accessToken,
    required this.userId,
    required this.paperId,
    required this.socketUri,
  });
}

class PaperEditorController extends ValueNotifier<PaperEditorValue> {
  final String editorUri = Config.editorUri;

  PaperEditorConfig? _config;

  set config(PaperEditorConfig? config) {
    this._config = config;
    this._init();
  }

  PaperEditorConfig? get config => _config;

  bool _ready = false;

  set ready(bool ready) {
    this._ready = ready;
    this._init();
  }

  bool get ready => _ready;

  PaperEditorController({PaperEditorConfig? config})
      : _config = config,
        super(PaperEditorValue());

  Messager? _messager;
  set messager(Messager messager) {
    _messager = messager;
  }

  void save() {
    _messager?.postMessage(['save']);
  }

  _init() {
    final c = config;
    if (!ready || c == null) {
      return;
    }
    _messager?.postMessage([
      'init',
      {
        'socketUri': c.socketUri,
        'paperId': c.paperId,
        'accessToken': c.accessToken,
      },
    ]);
  }

  onMessage(dynamic e) {
    if (e is List) {
      switch (e.firstOrNull) {
        case 'ready':
          ready = true;
          break;
        case 'change':
          value = value.copyWith(version: e[1]['version']);
          break;
        case 'titleChange':
          value = value.copyWith(title: e[1]['title']);
          break;
        case 'persistence':
          value = value.copyWith(
            persistence: Persistence(
              version: e[1]['version'],
              updatedAt: e[1]['updatedAt'],
            ),
          );
          break;
      }
    }
  }
}

abstract class Messager {
  postMessage(dynamic e);
}

class PaperEditor extends PaperEditorPlatform {
  PaperEditor({Key? key, required PaperEditorController controller})
      : super(key: key, controller: controller);
}
