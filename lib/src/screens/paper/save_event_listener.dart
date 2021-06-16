import 'package:flutter/material.dart';

import 'save_event_listener_native.dart'
    if (dart.library.html) 'save_event_listener_web.dart';

class SaveEventListener extends SaveEventListenerPlatform {
  const SaveEventListener({
    Key? key,
    required Widget child,
    required Function() onSave,
  }) : super(
          key: key,
          child: child,
          onSave: onSave,
        );
}
