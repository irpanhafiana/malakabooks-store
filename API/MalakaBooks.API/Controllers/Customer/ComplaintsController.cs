using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ComplaintHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "CustomerPolicy")]
public class ComplaintsController(
    IMediator mediator,
    IValidator<CreateComplaintRequest> createValidator) : ApiControllerBase
{
    /// <summary>Get own complaints</summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyCollection<ComplaintResponse>>> GetByUser(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetComplaintsByUserQuery(userId), cancellationToken));

    /// <summary>Submit a complaint</summary>
    [HttpPost]
    public async Task<ActionResult<ComplaintResponse>> Create([FromBody] CreateComplaintRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var complaint = await mediator.Send(new CreateComplaintCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByUser), new { userId = complaint.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, complaint);
    }
}
