using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.IncomingPaymentHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Exposes customer-facing incoming payment operations related to DOKU reconciliation.
/// </summary>
/// <remarks>This controller allows authenticated customers to manually trigger a DOKU payment status recheck using their order reference.</remarks>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class IncomingPaymentsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Checks the current DOKU payment status for the specified order and reuses the standard notification processing flow.
    /// </summary>
    /// <param name="request">The order reference to query against DOKU.</param>
    /// <param name="cancellationToken">A token that can be used to cancel the recheck request.</param>
    /// <returns>An <see cref="IActionResult"/> describing whether the payment state was successfully rechecked and applied.</returns>
    [HttpPost("DOKU/CheckStatus")]
    public async Task<IActionResult> CheckDokuStatus([FromBody] CheckDokuPaymentStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CheckDokuPaymentStatusCommand(request), cancellationToken);

        if (result.IsSuccess)
        {
            return Success(result);
        }

        return Fail(result.Message, result, "PaymentCheckFailed", StatusCodes.Status400BadRequest);
    }
}
