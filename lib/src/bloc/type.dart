enum RequestStatus {
  initial,
  success,
  failure,
}

class Edge<T> {
  final String cursor;
  final T node;

  Edge({
    required this.cursor,
    required this.node,
  });
}

enum OrderDirection { ASC, DESC }

class OrderBy<T> {
  final T field;
  final OrderDirection direction;

  const OrderBy({
    required this.field,
    required this.direction,
  });

  Map<String, dynamic> toJson() {
    return {
      'field': field.toString().split('.').last,
      'direction': direction.toString().split('.').last,
    };
  }
}
