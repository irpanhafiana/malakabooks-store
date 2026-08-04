using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Controller for admin dashboard related operations.
/// </summary>
/// <param name="mediator">The mediator instance.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class DashboardController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Gets the global admin dashboard data.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Dashboard statistics including global revenue, orders, active customers, and top categories.</returns>
    [HttpGet]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetAdminDashboardQuery(), cancellationToken);
        return Success(result);
    }
}
