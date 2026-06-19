using MalakaBooks.ConfigSetting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace MalakaBooks.API.Helper
{
    /// <summary>
    /// Validates Doku payment notification signatures on incoming HTTP requests by computing a SHA-256 digest of the
    /// request body and an HMACSHA256 signature using configured settings, and rejects requests with missing or
    /// mismatched signature headers.
    /// </summary>
    /// <remarks>Verifies the presence of the Client-Id, Request-Id, Request-Timestamp and Signature headers.
    /// Enables request buffering, computes a base64-encoded SHA-256 digest of the request body, and builds a canonical
    /// string from Client-Id, Request-Id, Request-Timestamp, Request-Target and Digest. Computes HMACSHA256 using the
    /// configured secret key and compares it to the Signature header. Sets BadRequestObjectResult for missing headers
    /// or UnauthorizedObjectResult for invalid signatures; proceeds to the action when validation succeeds.</remarks>
    public class ValidatePaymentSignatureFilter : IAsyncActionFilter
    {
        private readonly DokuSetting _dokuSetting;
        private readonly ILogger<ValidatePaymentSignatureFilter> _logger;

        /// <summary>
        /// Initializes a new instance of ValidatePaymentSignatureFilter with logging and DOKU configuration.
        /// </summary>
        /// <remarks>Assigns the provided logger and extracts DokuSetting from dokuOptions.Value for later use in
        /// signature validation.</remarks>
        /// <param name="logger">Logger for recording diagnostic and operational information.</param>
        /// <param name="dokuOptions">DOKU configuration options; the DokuSetting value is extracted for signature validation.</param>
        public ValidatePaymentSignatureFilter(ILogger<ValidatePaymentSignatureFilter> logger, IOptions<DokuSetting> dokuOptions)
        {
            _logger = logger;
            _dokuSetting = dokuOptions.Value;
        }

        /// <summary>
        /// Validate required DOKU request headers and the computed signature, short-circuiting with BadRequest or
        /// Unauthorized when validation fails; otherwise invoke the next action in the pipeline.
        /// </summary>
        /// <remarks>Computes a request digest, derives a signature using the configured secret and
        /// request metadata, compares it to the Signature header, and logs a warning on mismatch.</remarks>
        /// <param name="context">The action executing context that provides access to the HTTP request and allows setting the action result.</param>
        /// <param name="next">The delegate that executes the next action or middleware in the pipeline.</param>
        /// <returns>A Task representing the asynchronous operation.</returns>
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var request = context.HttpContext.Request;

            if (!request.Headers.TryGetValue("Client-Id", out var clientId) ||
                !request.Headers.TryGetValue("Request-Id", out var requestId) ||
                !request.Headers.TryGetValue("Request-Timestamp", out var requestTimestamp) ||
                !request.Headers.TryGetValue("Signature", out var signature))
            {
                context.Result = new BadRequestObjectResult("Missing required headers.");
                return;
            }

            string digest = await GenerateDigestAsync(request);
            string computedSignature = ComputeSignature(
                _dokuSetting.SecretKey,
                clientId!,
                requestId!,
                requestTimestamp!,
                _dokuSetting.RequestPath,
                digest);

            if ($"{computedSignature}" != signature)
            {
                _logger.LogWarning("Invalid signature: expected {Expected}, got {Actual}", computedSignature, signature);
                context.Result = new UnauthorizedObjectResult("Invalid signature.");
                return;
            }

            await next(); // Proceed to the action
        }

        // Generate Digest
        private static async Task<string> GenerateDigestAsync(HttpRequest request)
        {
            // Enable buffering to allow reading the request body multiple times
            request.EnableBuffering();
            request.Body.Position = 0;

            string body = string.Empty;
            using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
                body = await reader.ReadToEndAsync();

            request.Body.Position = 0; // Reset for later use

            // Generate Digest
            string digest;
            using (var sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(body));
                digest = Convert.ToBase64String(hashBytes);
            }

            //using var memoryStream = new MemoryStream();
            //await request.Body.CopyToAsync(memoryStream);
            //memoryStream.Seek(0, SeekOrigin.Begin);
            //request.Body.Position = 0; // Reset body for future middleware/controller use

            //using var sha256 = SHA256.Create();
            //byte[] hash = sha256.ComputeHash(memoryStream);

            return digest;
        }


        private static string ComputeSignature(
            string secretKey,
            string clientId,
            string requestId,
            string requestTimestamp,
            string requestTarget,
            string digest)
        {
            var compoonents = new[]
            {
                $"Client-Id:{clientId}",
                $"Request-Id:{requestId}",
                $"Request-Timestamp:{requestTimestamp}",
                $"Request-Target:{requestTarget}",
                $"Digest:{digest}"
            };
            string data = string.Join("\n", compoonents);

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            string retVal = $"HMACSHA256={Convert.ToBase64String(hash)}";

            return retVal;
        }
    }
}
