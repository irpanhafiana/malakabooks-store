using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.PaymentHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

#pragma warning disable CS1591

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class PaymentsController(IMediator mediator) : ApiControllerBase
{
    [HttpPost("calculate-fees")]
    public async Task<IActionResult> CalculateFees([FromBody] CalculatePaymentFeeRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CalculatePaymentFeesQuery(request), cancellationToken);
        return result is null ? NotFound() : Success(result);
    }
}

#pragma warning restore CS1591
