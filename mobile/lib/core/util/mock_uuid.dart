import 'dart:math';

/// Deterministic RFC 4122 UUID v4–compatible value from a seed string.
/// Used for mock task/equipment ids so Postgres `uuid` columns accept them.
String mockUuidFromSeed(String seed) {
  final r = Random(seed.hashCode);
  final bytes = List<int>.generate(16, (_) => r.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  String h(int i) => bytes[i].toRadixString(16).padLeft(2, '0');
  return '${h(0)}${h(1)}${h(2)}${h(3)}-${h(4)}${h(5)}-${h(6)}${h(7)}-${h(8)}${h(9)}-${h(10)}${h(11)}${h(12)}${h(13)}${h(14)}${h(15)}';
}
