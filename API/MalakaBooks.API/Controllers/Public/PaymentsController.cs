using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.PaymentHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

#pragma warning disable CS1591

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Represents an API controller that provides public endpoints for retrieving payment information.
/// </summary>
/// <remarks>This controller exposes read-only endpoints for payment master data.</remarks>
/// <param name="mediator">The mediator used to send queries for retrieving payment data.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class PaymentsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all payments (public)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetPaymentsQuery(), cancellationToken));

    /// <summary>Get payment by id (public)</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var payment = await mediator.Send(new GetPaymentByIdQuery(id), cancellationToken);
        return payment is null ? NotFound() : Success(payment);
    }
}

#pragma warning restore CS1591
