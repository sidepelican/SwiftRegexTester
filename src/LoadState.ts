export type LoadState<T> = {
  loading: true;
  value?: never;
  error?: never;
} | {
  loading: false;
  value?: never;
  error: string;
} | {
  loading: false;
  value: T;
  error?: never;
}
