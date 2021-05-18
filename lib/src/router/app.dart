import 'package:flutter/material.dart';
import 'package:paper/src/screens/auth/auth_screen.dart';
import 'package:paper/src/screens/home/home_screen.dart';
import 'package:paper/src/screens/error/error_screen.dart';
import 'package:paper/src/screens/paper/paper_screen.dart';
import 'package:provider/provider.dart';

class MyRouterDelegate extends RouterDelegate<MyRouteConfiguration>
    with ChangeNotifier, PopNavigatorRouterDelegateMixin<MyRouteConfiguration> {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey();

  List<MyRouteConfiguration> _stack = [];

  @override
  MyRouteConfiguration? get currentConfiguration => _stack.last;

  @override
  Future<void> setInitialRoutePath(MyRouteConfiguration configuration) async {
    push(configuration);
  }

  @override
  Future<void> setNewRoutePath(MyRouteConfiguration configuration) async {
    push(configuration);
  }

  List<Page> get _pages {
    if (_stack.isEmpty) {
      _stack.add(MyRouteConfiguration.home());
    }
    return _stack
        .map((configuration) => MaterialPage(child: configuration.screen()))
        .toList();
  }

  void push(MyRouteConfiguration configuration) {
    if (configuration.isSingleton) {
      final index = _stack.indexWhere(
        (element) => element.runtimeType == configuration.runtimeType,
      );
      if (index >= 0) {
        _stack.removeRange(index, _stack.length);
      }
    }
    _stack.add(configuration);
    notifyListeners();
  }

  void redirect(MyRouteConfiguration configuration) {
    pop();
    push(configuration);
  }

  bool pop() {
    if (_stack.length > 1) {
      _stack.removeLast();
      notifyListeners();
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableProvider(
      create: (_) => this,
      child: Navigator(
        key: navigatorKey,
        pages: _pages,
        onPopPage: (route, result) {
          if (!route.didPop(result)) {
            return false;
          }
          return pop();
        },
      ),
    );
  }
}

abstract class MyRouteConfiguration {
  bool get isSingleton => true;

  RouteInformation restoreRouteInformation();

  Widget screen();

  static Future<MyRouteConfiguration> parseRouteInformation(
    RouteInformation route,
  ) async {
    final uri = Uri.parse(route.location ?? '/');
    return await MyRouteConfigurationHome.tryParse(route, uri) ??
        await MyRouteConfigurationAuth.tryParse(route, uri) ??
        await MyRouteConfigurationPaper.tryParse(route, uri) ??
        MyRouteConfigurationError(
          error: uri.queryParameters['error'] ?? 'Unknown error...',
          location: route.location,
        );
  }

  static MyRouteConfiguration home() => MyRouteConfigurationHome();

  static MyRouteConfiguration error(dynamic error, String? location) =>
      MyRouteConfigurationError(error: error, location: location);

  static MyRouteConfiguration auth() => MyRouteConfigurationAuth();

  static MyRouteConfiguration paper({
    required String userId,
    required String paperId,
  }) =>
      MyRouteConfigurationPaper(
        userId: userId,
        paperId: paperId,
      );
}

class MyRouteConfigurationHome extends MyRouteConfiguration {
  static Future<MyRouteConfigurationHome?> tryParse(
    RouteInformation route,
    Uri uri,
  ) async {
    if (uri.path == '/') {
      return MyRouteConfigurationHome();
    }
  }

  @override
  Widget screen() => HomeScreen();

  @override
  RouteInformation restoreRouteInformation() => RouteInformation(location: '/');
}

class MyRouteConfigurationError extends MyRouteConfiguration {
  final String? error;
  final String? location;

  MyRouteConfigurationError({this.error, this.location});

  @override
  Widget screen() => ErrorScreen(error: error);

  @override
  RouteInformation restoreRouteInformation() =>
      RouteInformation(location: location);
}

class MyRouteConfigurationAuth extends MyRouteConfiguration {
  static Future<MyRouteConfigurationAuth?> tryParse(
    RouteInformation route,
    Uri uri,
  ) async {
    if (uri.pathSegments.length == 1 && uri.pathSegments.first == 'auth') {
      return MyRouteConfigurationAuth();
    }
  }

  @override
  Widget screen() => AuthScreen();

  @override
  RouteInformation restoreRouteInformation() =>
      RouteInformation(location: '/auth');
}

class MyRouteConfigurationPaper extends MyRouteConfiguration {
  final String userId;
  final String paperId;

  MyRouteConfigurationPaper({
    required this.userId,
    required this.paperId,
  });

  static Future<MyRouteConfigurationPaper?> tryParse(
    RouteInformation route,
    Uri uri,
  ) async {
    if (uri.pathSegments.length == 4 &&
        uri.pathSegments[0] == 'u' &&
        uri.pathSegments[2] == 'p') {
      return MyRouteConfigurationPaper(
        userId: uri.pathSegments[1],
        paperId: uri.pathSegments[3],
      );
    }
  }

  @override
  Widget screen() => PaperScreen(
        userId: userId,
        paperId: paperId,
      );

  @override
  RouteInformation restoreRouteInformation() =>
      RouteInformation(location: '/u/$userId/p/$paperId');
}

class MyRouteInformationParser
    extends RouteInformationParser<MyRouteConfiguration> {
  @override
  Future<MyRouteConfiguration> parseRouteInformation(
    RouteInformation route,
  ) {
    return MyRouteConfiguration.parseRouteInformation(route);
  }

  RouteInformation restoreRouteInformation(MyRouteConfiguration configuration) {
    return configuration.restoreRouteInformation();
  }
}
