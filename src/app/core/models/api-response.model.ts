/**
 * Standard response envelope returned by the MalakaBooks .NET API.
 * Mirrors `ApiResponse<T>` in `MalakaBooks.API/Controllers/Base/ApiControllerBase.cs`
 * (Newtonsoft camelCase, null values omitted).
 */
export interface ApiResponse<T> {
  statusCode: number;
  statusMessage: string | null;
  data: T;
  /** Validation/error detail, keyed "1","2",... on failure (e.g. errorType "ValidationError"). */
  errors?: Record<string, string> | null;
  errorType?: string | null;
  isSuccess: boolean;
}
