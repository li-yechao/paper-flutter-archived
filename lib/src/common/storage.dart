import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class Storage {
  static const _TOKEN_KEY = "PAPER_TOKEN";
  static Token? _token;
  static Future<Token?> get token async {
    if (_token == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(_TOKEN_KEY);
        if (token != null) {
          _token = Token.fromJson(jsonDecode(token));
        }
      } catch (e) {
        print(e);
      }
    }
    return _token;
  }

  static setToken(Token? token) async {
    _token = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (token != null) {
        await prefs.setString(_TOKEN_KEY, jsonEncode(token.toJson()));
      } else {
        await prefs.remove(_TOKEN_KEY);
      }
    } catch (e) {
      print(e);
    }
  }
}

class Token {
  final String accessToken;
  final String tokenType;
  final String expiresIn;
  final String refreshToken;

  Token({
    required this.accessToken,
    required this.tokenType,
    required this.expiresIn,
    required this.refreshToken,
  });

  factory Token.fromJson(Map<String, dynamic> json) {
    return Token(
      accessToken: json['accessToken'],
      tokenType: json['tokenType'],
      expiresIn: json['expiresIn'],
      refreshToken: json['refreshToken'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "accessToken": accessToken,
      "tokenType": tokenType,
      "expiresIn": expiresIn,
      "refreshToken": refreshToken,
    };
  }
}
