using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.IncomingPaymentHandlers;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
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

    /// <summary>
    /// Processes a Simasrim shipment webhook notification for batched cetak-resi submissions.
    /// </summary>
    /// <param name="request">The Simasrim shipment response payload containing shipment status, AWB, and transaction reference information.</param>
    /// <param name="cancellationToken">A token that can be used to cancel the webhook processing request.</param>
    /// <returns>An <see cref="IActionResult"/> containing a minimal acknowledgment of webhook receipt.</returns>
    [HttpPost("SIMASRIM/Notify")]
    public async Task<IActionResult> SimasrimNotify([FromBody] CreateResiResponse request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ProcessSimasrimShipmentWebhookCommand(request), cancellationToken);
        return Success(result);
    }
}
