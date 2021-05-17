import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:paper/src/auth/auth.dart';
import 'package:paper/src/bloc/type.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/common/config.dart';
import 'package:paper/src/router/app.dart';

class AuthScreen extends StatefulWidget {
  @override
  _AuthScreenState createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLoading = false;

  void _githubSignIn() async {
    if (_isLoading) {
      return;
    }
    setState(() {
      _isLoading = true;
    });
    try {
      final code = await Auth.githubSignIn(
        context: context,
        clientId: Config.githubClientId,
        redirectUri: Config.githubRedirectUri,
      );
      if (code == null) {
        return;
      }
      context.read<ViewerBloc>().add(ViewerGithubCodeSignIn(
            clientId: Config.githubClientId,
            code: code,
          ));
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ViewerBloc, ViewerState>(
      listener: (context, state) {
        if (state.status == RequestStatus.success) {
          context.read<MyRouterDelegate>().pop();
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: Center(
            child: _isLoading || state.status == RequestStatus.initial
                ? CircularProgressIndicator()
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Center(
                        child: Text(
                          'Sign In with',
                          style: TextStyle(
                            fontSize: 20,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            TextButton(
                              child: Text('Github'),
                              onPressed: _githubSignIn,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ),
        );
      },
    );
  }
}
