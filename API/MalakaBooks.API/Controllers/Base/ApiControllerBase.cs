using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.API.Controllers.Base;
/// <summary>
/// Provides a base class for API controllers that includes standardized methods for generating consistent success and
/// failure responses in HTTP APIs.
/// </summary>
/// <remarks>This abstract class is intended to be inherited by API controllers to simplify the creation of
/// uniform API responses. It offers protected helper methods for returning success and error results, as well as for
/// processing validation results. These methods are not exposed as API endpoints and are designed to promote
/// consistency and reduce boilerplate in derived controllers.</remarks>
public abstract class ApiControllerBase : ControllerBase
{

    /// <summary>
    /// Creates an HTTP response indicating a successful operation with the specified data, message, and status code.
    /// </summary>
    /// <remarks>This method is intended for use in derived controller classes to standardize successful API
    /// responses. The response body includes the provided data and message, and sets the IsSuccess property to <see
    /// langword="true"/>.</remarks>
    /// <typeparam name="T">The type of the data to include in the response body.</typeparam>
    /// <param name="data">The data to include in the response body. Can be null if no data is required.</param>
    /// <param name="message">An optional status message to include in the response. The default is "OK".</param>
    /// <param name="statusCode">The HTTP status code to set for the response. The default is 200 (OK).</param>
    /// <returns>
    /// An <see cref="IActionResult"/> containing an
    /// <see cref="ApiResponse{T}"/> with the specified data,
    /// message, and status code, indicating success.
    /// </returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    protected IActionResult Success<T>(T data, string message = "OK", int statusCode = StatusCodes.Status200OK)
    {
        return StatusCode(statusCode, new ApiResponse<T>
        {
            StatusCode = statusCode,
            StatusMessage = message,
            Data = data,
            IsSuccess = true
        });
    }

    /// <summary>
    /// Creates an HTTP response indicating a successful operation with a customizable message and status code.
    /// </summary>
    /// <remarks>This method is intended for use in derived controllers to return a consistent success response
    /// format. The response body includes a status code, a status message, and indicates success. The data payload is set
    /// to null.</remarks>
    /// <param name="message">The message to include in the response. The default is "Data Successfully Processed!".</param>
    /// <param name="statusCode">The HTTP status code to set for the response. The default is 200 (OK).</param>
    /// <returns>An <see cref="IActionResult"/> containing a standardized success response with the specified message and status
    /// code.</returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    protected IActionResult Success(string message = "Data Successfully Processed!", int statusCode = StatusCodes.Status200OK)
    {
        return StatusCode(statusCode, new ApiResponse<object>
        {
            StatusCode = statusCode,
            StatusMessage = message,
            Data = null,
            IsSuccess = true
        });
    }

    /// <summary>
    /// Creates an error response with the specified message, optional error details, and HTTP status code.
    /// </summary>
    /// <remarks>This method is intended for use in derived controllers to standardize error responses. The
    /// response body includes a consistent structure for error handling in client applications.</remarks>
    /// <param name="message">The error message to include in the response. This value is required and should describe the reason for the
    /// failure.</param>
    /// <param name="errors">An optional object containing additional error details. Can be null if no further information is available.</param>
    /// <param name="errorType">An optional string specifying the type or category of the error. Can be null if not applicable.</param>
    /// <param name="statusCode">The HTTP status code to return with the response. Defaults to 400 (Bad Request).</param>
    /// <returns>An IActionResult containing a structured error response with the provided message, error details, error type, and
    /// status code.</returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    protected IActionResult Fail(
        string message,
        object? errors = null,
        string? errorType = null,
        int statusCode = StatusCodes.Status400BadRequest)
    {
        return StatusCode(statusCode, new ApiResponse<object>
        {
            StatusCode = statusCode,
            StatusMessage = message,
            Errors = errors,
            ErrorType = errorType,
            IsSuccess = false
        });
    }

    /// <summary>
    /// Processes the specified validation result and returns an appropriate HTTP response indicating success or
    /// validation failure.
    /// </summary>
    /// <param name="result">The validation result to process. If null, the operation is considered successful; otherwise, any validation
    /// errors are included in the response.</param>
    /// <returns>An <see cref="IActionResult"/> representing a successful response if <paramref name="result"/> is null, or a 400
    /// Bad Request response containing validation errors if validation failed.</returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    protected IActionResult ProcessResult(ValidationResult? result)
    {
        if (result == null)
        {
            return this.Success();
        }

        var errorDictionary = new Dictionary<string, string>();
        var errorsList = result.ErrorMessage?.Split("\r\n") ?? [];

        var lineNo = 1;
        foreach (var error in errorsList)
        {
            if (!string.IsNullOrWhiteSpace(error))
            {
                errorDictionary.Add(lineNo.ToString(), error);
                lineNo++;
            }
        }

        return Fail(
            "Validation failed",
            errorDictionary,
            "ValidationError",
            StatusCodes.Status400BadRequest);
    }

    /// <summary>
    /// Processes a FluentValidation validation result and returns an appropriate HTTP response based on the validation
    /// outcome.
    /// </summary>
    /// <remarks>This method is intended for internal use and is not exposed as part of the public API. It
    /// standardizes the handling of validation results by returning a consistent error format for failed
    /// validations.</remarks>
    /// <param name="result">The validation result to process. If null, the operation is considered successful.</param>
    /// <returns>An IActionResult representing a successful response if validation passed, or a 400 Bad Request response containing
    /// validation errors if validation failed.</returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    protected IActionResult ProcessResult(FluentValidation.Results.ValidationResult? result)
    {
        if (result == null)
        {
            return this.Success();
        }

        var errorDictionary = new Dictionary<string, string>();
        var errorsList = result.Errors;

        var lineNo = 1;
        foreach (var error in errorsList)
        {
            if (!string.IsNullOrWhiteSpace(error.ErrorMessage))
            {
                errorDictionary.Add(lineNo.ToString(), error.ErrorMessage);
                lineNo++;
            }
        }

        return Fail(
            "Validation failed",
            errorDictionary,
            "ValidationError",
            StatusCodes.Status400BadRequest);
    }

    /// <summary>
    /// Represents a standard response returned by an API, including status information, data, and error details.
    /// </summary>
    /// <remarks>Use this class to encapsulate the result of an API operation, including both successful and error
    /// responses. The generic parameter allows the response to carry strongly typed data relevant to the API call.
    /// Properties such as StatusCode, StatusMessage, and IsSuccess provide information about the outcome of the request,
    /// while Errors and ErrorType can be used to convey error details when the operation fails.</remarks>
    /// <typeparam name="T">The type of the data payload returned by the API.</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// Gets or sets the HTTP status code associated with the response.
        /// </summary>
        public int StatusCode { get; set; }

        /// <summary>
        /// Gets or sets the current status message associated with the operation or process.
        /// </summary>
        public string? StatusMessage { get; set; }

        /// <summary>
        /// Gets or sets the data value associated with the current instance.
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// Gets or sets the error information associated with the current operation.
        /// </summary>
        public object? Errors { get; set; }

        /// <summary>
        /// Gets or sets the type or category of the error that occurred.
        /// </summary>
        public string? ErrorType { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the operation completed successfully.
        /// </summary>
        public bool IsSuccess { get; set; }
    }
}
