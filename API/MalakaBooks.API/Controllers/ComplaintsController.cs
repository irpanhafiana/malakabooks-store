using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ComplaintHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers;

public class ComplaintsController(
    IMediator mediator,
    IValidator<CreateComplaintRequest> createValidator,
    IValidator<RespondComplaintRequest> respondValidator) : ApiControllerBase
{
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyCollection<ComplaintResponse>>> GetByUser(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetComplaintsByUserQuery(userId), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ComplaintResponse>> Create([FromBody] CreateComplaintRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var complaint = await mediator.Send(new CreateComplaintCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByUser), new { userId = complaint.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, complaint);
    }

    [HttpPut("{id}/respond")]
    public async Task<ActionResult<ComplaintResponse>> Respond(string id, [FromBody] RespondComplaintRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await respondValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var complaint = await mediator.Send(new RespondComplaintCommand(id, request), cancellationToken);
        return complaint is null ? NotFound() : Ok(complaint);
    }
}
