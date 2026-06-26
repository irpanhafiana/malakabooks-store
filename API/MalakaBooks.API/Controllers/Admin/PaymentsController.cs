using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.PaymentHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

#pragma warning disable CS1591

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Represents an API controller that manages payment resources for administrative operations.
/// </summary>
/// <remarks>This controller provides endpoints for creating, retrieving, updating, and deleting payments.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to payment operations.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class PaymentsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all payments</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetPaymentsQuery(), cancellationToken));

    /// <summary>Get payment by id</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var payment = await mediator.Send(new GetPaymentByIdQuery(id), cancellationToken);
        return payment is null ? NotFound() : Success(payment);
    }

    /// <summary>Create payment</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new CreatePaymentCommand(request), cancellationToken));

    /// <summary>Update payment</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePaymentRequest request, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new UpdatePaymentCommand(id, request), cancellationToken));

    /// <summary>Delete payment</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeletePaymentCommand(id), cancellationToken));
}

#pragma warning restore CS1591
