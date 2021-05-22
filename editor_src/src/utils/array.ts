export function notEmpty<TValue>(value: TValue | null | undefined | void): value is TValue {
  return value !== null && value !== undefined
}
