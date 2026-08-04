using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Controller for customer dashboard related operations.
/// </summary>
/// <param name="mediator">The mediator instance.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class DashboardController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Gets the customer dashboard data for a specific user.
    /// </summary>
    /// <param name="userId">The ID of the user to get dashboard data for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Dashboard statistics including spending, orders, and favorite categories.</returns>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetDashboard(string userId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetCustomerDashboardQuery(userId), cancellationToken);
        return Success(result);
    }
}
