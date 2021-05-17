import 'package:flutter/material.dart';

typedef HoverWidgetBuilder = Widget Function(
  BuildContext context,
  bool isHover,
);

class Hover extends StatefulWidget {
  final HoverWidgetBuilder builder;

  Hover({
    Key? key,
    required this.builder,
  }) : super(key: key);

  @override
  _HoverState createState() => _HoverState();
}

class _HoverState extends State<Hover> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: MouseRegion(
        onHover: (_) {
          setState(() {
            _isHover = true;
          });
        },
        onExit: (_) {
          setState(() {
            _isHover = false;
          });
        },
        child: widget.builder(context, _isHover),
      ),
    );
  }
}
