using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Helper;

/// <summary>
/// Provides a global exception handler that logs unhandled exceptions and returns a standardized error response to the
/// client.
/// </summary>
/// <remarks>This handler is intended to be used as a centralized mechanism for handling unhandled exceptions in
/// ASP.NET Core applications. It logs exception details and returns a ProblemDetails response with HTTP status code
/// 500. The response includes a trace identifier to assist with troubleshooting. This handler is thread-safe and can be
/// registered as a singleton.</remarks>
/// <param name="logger">The logger used to record exception details and error information.</param>
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
  /// <summary>
  /// Attempts to handle an unhandled exception by generating a standardized error response for the HTTP request.
  /// </summary>
  /// <remarks>The response is written in the Problem Details format with a 500 Internal Server Error status
  /// code. The response includes a trace identifier for correlation. This method always returns <see
  /// langword="true"/>.</remarks>
  /// <param name="httpContext">The HTTP context for the current request. Must not be null.</param>
  /// <param name="exception">The exception that occurred during request processing. Must not be null.</param>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the asynchronous operation.</param>
  /// <returns>A value task that represents the asynchronous operation. The result is <see langword="true"/> if the exception was
  /// handled and a response was written; otherwise, <see langword="false"/>.</returns>
  public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
  {
    logger.LogError(exception, "Unhandled exception while processing request.");

    var problemDetails = new ProblemDetails
    {
      Status = StatusCodes.Status500InternalServerError,
      Title = "An unexpected error occurred.",
      Detail = "Please contact the administrator if the problem persists."
    };

    problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

    httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
    return true;
  }
}
