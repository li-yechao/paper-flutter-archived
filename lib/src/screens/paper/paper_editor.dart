import 'package:flutter/widgets.dart';

import './paper_editor_native.dart'
    if (dart.library.html) './paper_editor_web.dart';

class PaperEditor extends PaperEditorPlatform {
  PaperEditor({
    Key? key,
    required String accessToken,
    required String userId,
    required String paperId,
    bool readOnly = true,
    bool todoItemReadOnly = true,
  }) : super(
          key: key,
          accessToken: accessToken,
          userId: userId,
          paperId: paperId,
          readOnly: readOnly,
          todoItemReadOnly: todoItemReadOnly,
        );
}
