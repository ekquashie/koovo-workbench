import type { TransformFnParams } from 'class-transformer';

export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : (value as unknown);

export const trimLower = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown);

/** Trims; an empty string becomes undefined so `?clientId=` means "no filter". */
export const trimToUndefined = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() || undefined : (value as unknown);

/** Like trimToUndefined, upper-cased: lets `?status=valid` match `VALID`. */
export const trimUpperToUndefined = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string'
    ? value.trim().toUpperCase() || undefined
    : (value as unknown);
