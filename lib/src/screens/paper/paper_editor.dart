import 'package:flutter/widgets.dart';

import './paper_editor_native.dart'
    if (dart.library.html) './paper_editor_web.dart';

class PaperEditor extends PaperEditorPlatform {
  PaperEditor({
    Key? key,
    title,
    content,
    save,
    readOnly = true,
    todoItemReadOnly = true,
  }) : super(
          key: key,
          title: title,
          content: content,
          save: save,
          readOnly: readOnly,
          todoItemReadOnly: todoItemReadOnly,
        );
}
