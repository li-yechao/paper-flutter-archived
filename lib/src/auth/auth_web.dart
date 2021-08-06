import 'dart:async';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html';

import 'package:flutter/material.dart';

class AuthPlatform {
  static Future<String?> githubSignIn({
    required BuildContext context,
    required String clientId,
    required Uri redirectUri,
  }) async {
    final completer = Completer<String>();

    final origin = redirectUri.toString();
    final uri = Uri.https('github.com', '/login/oauth/authorize', {
      'client_id': clientId,
      'redirect_uri': '$origin/assets/auth/github/index.html',
      'scope': 'user',
      'state': '',
    });

    final width = 600;
    final height = 600;
    final left = (window.screen!.width! - width) / 2;
    final top = (window.screen!.height! - height) / 2;

    final w = window.open(
      uri.toString(),
      '_blank',
      'toolbar=no,location=no,menubar=no,width=$width,height=$height,left=$left,top=$top',
    );

    final timer = Timer.periodic(Duration(milliseconds: 500), (timer) {
      if (w.closed == true) {
        timer.cancel();
        completer.completeError('Auth window closed');
      }
    });

    final _messageHandler = (Event event) {
      try {
        event as StorageEvent;
        final value = event.newValue;

        if (event.key == "githubAuthResult" && value != null) {
          timer.cancel();
          w.close();
          final uri = Uri.parse(value);
          final code = uri.queryParameters['code'] as String;
          completer.complete(code);
          window.localStorage.remove(event.key);
        }
      } catch (error) {
        completer.completeError(error);
      }
    };

    window.addEventListener('storage', _messageHandler);

    completer.future.whenComplete(() {
      window.removeEventListener('storage', _messageHandler);
    });

    return completer.future;
  }
}
