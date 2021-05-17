import 'dart:async';

import 'package:flutter/material.dart';

import './auth_native.dart' if (dart.library.html) './auth_web.dart';

class Auth {
  static Future<String?> githubSignIn({
    required BuildContext context,
    required String clientId,
    required Uri redirectUri,
  }) {
    return AuthPlatform.githubSignIn(
      context: context,
      clientId: clientId,
      redirectUri: redirectUri,
    );
  }
}
