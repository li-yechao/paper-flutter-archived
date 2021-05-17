import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:paper/src/bloc/paper_mutation/paper_mutation_bloc.dart';
import 'package:paper/src/bloc/viewer/viewer_bloc.dart';
import 'package:paper/src/graphql/client.dart';
import 'package:paper/src/router/app.dart';

void startApp() async {
  runApp(
    GraphQLProvider(
      client: ValueNotifier(GraphQLInstance.client),
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (_) => ViewerBloc(graphql: GraphQLInstance.client)
              ..add(ViewerRequest()),
          ),
          BlocProvider(
            create: (_) => PaperMutationBloc(graphql: GraphQLInstance.client),
          ),
        ],
        child: PaperApp(),
      ),
    ),
  );
}

class PaperApp extends StatefulWidget {
  @override
  _PaperAppState createState() => _PaperAppState();
}

class _PaperAppState extends State<PaperApp> {
  final routerDelegate = MyRouterDelegate();
  final routeInformationParser = MyRouteInformationParser();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      theme: ThemeData(
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
      ),
      routerDelegate: routerDelegate,
      routeInformationParser: routeInformationParser,
    );
  }
}
