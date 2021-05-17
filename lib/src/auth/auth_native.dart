import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class AuthPlatform {
  static Future<String?> githubSignIn({
    required BuildContext context,
    required String clientId,
    required Uri redirectUri,
  }) async {
    return showDialog<String>(
      context: context,
      useSafeArea: false,
      builder: (context) {
        return _GithubAuth(
          clientId: clientId,
          redirectUri: redirectUri,
        );
      },
    );
  }
}

class _GithubAuth extends StatefulWidget {
  final String clientId;
  final Uri redirectUri;

  _GithubAuth({
    Key? key,
    required this.clientId,
    required this.redirectUri,
  }) : super(key: key);

  @override
  __GithubAuthState createState() => __GithubAuthState();
}

class __GithubAuthState extends State<_GithubAuth> {
  bool _isLoading = false;

  Uri get _githubAuthUri => Uri.https('github.com', '/login/oauth/authorize', {
        'client_id': widget.clientId,
        'redirect_uri': widget.redirectUri.toString(),
        'scope': 'user',
        'state': '',
      });

  void _onPageStarted(InAppWebViewController controller, Uri? url) {
    setState(() {
      _isLoading = true;
    });
  }

  void _onPageFinished(InAppWebViewController controller, Uri? url) {
    setState(() {
      _isLoading = false;
    });
  }

  void _cancel() {
    Navigator.of(context).pop();
  }

  Future<NavigationActionPolicy?> _shouldOverrideUrlLoading(
    InAppWebViewController controller,
    NavigationAction action,
  ) async {
    final uri = action.request.url;
    if (uri != null &&
        uri.origin == widget.redirectUri.origin &&
        uri.pathSegments == widget.redirectUri.pathSegments) {
      Navigator.of(context).pop(uri.queryParameters['code']);
      return NavigationActionPolicy.CANCEL;
    }
    return NavigationActionPolicy.ALLOW;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: EdgeInsets.only(top: 100),
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).dialogBackgroundColor,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(20),
            ),
          ),
          child: Column(
            children: [
              Container(
                height: 40,
                child: Row(
                  children: [
                    TextButton(
                      child: Text('取消'),
                      onPressed: _cancel,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Stack(
                  children: [
                    InAppWebView(
                      initialOptions: InAppWebViewGroupOptions(
                        crossPlatform: InAppWebViewOptions(
                          transparentBackground: true,
                          useShouldOverrideUrlLoading: true,
                        ),
                      ),
                      onLoadStart: _onPageStarted,
                      onLoadStop: _onPageFinished,
                      initialUrlRequest: URLRequest(url: _githubAuthUri),
                      shouldOverrideUrlLoading: _shouldOverrideUrlLoading,
                    ),
                    AnimatedSwitcher(
                      duration: Duration(milliseconds: 300),
                      child: _isLoading
                          ? Center(
                              child: CircularProgressIndicator(),
                            )
                          : null,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
