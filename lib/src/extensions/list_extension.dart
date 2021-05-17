part of 'extensions.dart';

extension OrNull<T> on List<T>? {
  T? get firstOrNull => this?.isNotEmpty == true ? this?.first : null;
  T? get lastOrNull => this?.isNotEmpty == true ? this?.last : null;
}
