using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ComplaintHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "AdminPolicy")]
public class ComplaintsController(
    IMediator mediator,
    IValidator<RespondComplaintRequest> respondValidator) : ApiControllerBase
{
    /// <summary>Get all complaints</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ComplaintResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetAllComplaintsQuery(), cancellationToken));

    /// <summary>Respond to a complaint</summary>
    [HttpPut("{id}/respond")]
    public async Task<ActionResult<ComplaintResponse>> Respond(string id, [FromBody] RespondComplaintRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await respondValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var complaint = await mediator.Send(new RespondComplaintCommand(id, request), cancellationToken);
        return complaint is null ? NotFound() : Ok(complaint);
    }
}
