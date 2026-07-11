using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides anonymous third-party item synchronization endpoints backed by internal item and UoM group upsert logic.
/// </summary>
[Route("api/v{version:apiVersion}/public/item-sync")]
[AllowAnonymous]
public class ItemSyncController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Creates or updates an item by external SAP code using a payload that embeds its UoM group definition.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Sync([FromBody] SyncItemRequest request, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new SyncItemCommand(request), cancellationToken));
}
