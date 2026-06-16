using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.IncomingPaymentHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Receives external gateway callbacks and forwards them into the internal payment-posting flow.
/// </summary>
/// <remarks>This controller is intentionally anonymous so payment gateways such as DOKU can post notifications without customer or admin authentication.</remarks>
[Route("api/v{version:apiVersion}/[controller]")]
[AllowAnonymous]
public class ExternalMessageController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Processes a DOKU payment notification for a customer order.
    /// </summary>
    /// <param name="request">The normalized notification payload containing the order reference and payment status details.</param>
    /// <param name="cancellationToken">A token that can be used to cancel the notification processing request.</param>
    /// <returns>An <see cref="IActionResult"/> containing the payment processing result.</returns>
    [HttpPost("DOKU/Notify")]
    public async Task<IActionResult> DokuNotify([FromBody] DokuPaymentNotificationRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ProcessDokuPaymentNotificationCommand(request), cancellationToken);
        return Success(result);
    }
}
