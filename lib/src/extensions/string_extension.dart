part of 'extensions.dart';

extension Blank on String? {
  bool get isNullOrBlank => this == null || this!.trim().isEmpty;
  String blankOr(String d) => this.isNullOrBlank ? d : this!;
}
