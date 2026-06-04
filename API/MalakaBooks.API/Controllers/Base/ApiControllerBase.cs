using Asp.Versioning;
using FluentValidation.Results;
using IdempotentAPI.Filters;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Base;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Consumes("application/json")]
[Produces("application/json")]
[Idempotent(ExpireHours = 1)]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult ProcessResult(ValidationResult? validationResult)
    {
        if (validationResult is null || validationResult.IsValid)
        {
            return Ok();
        }

        var errors = validationResult.Errors
            .GroupBy(validationError => validationError.PropertyName)
            .ToDictionary(propertyGroup => propertyGroup.Key, propertyGroup => propertyGroup.Select(validationError => validationError.ErrorMessage).ToArray());

        var details = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred."
        };

        return BadRequest(details);
    }
}
