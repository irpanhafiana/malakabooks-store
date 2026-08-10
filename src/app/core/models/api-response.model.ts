export interface ApiResponse<T> {
  statusCode: number;
  statusMessage: string | null;
  data: T;
  /** Validation/error detail, keyed "1","2",... on failure (e.g. errorType "ValidationError"). */
  errors?: Record<string, string> | null;
  errorType?: string | null;
  isSuccess: boolean;
}
