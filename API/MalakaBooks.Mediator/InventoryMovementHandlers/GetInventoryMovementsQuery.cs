using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.InventoryMovementHandlers;

public record GetInventoryMovementsQuery(string? BookId) : IRequest<IReadOnlyCollection<InventoryMovementResponse>>;
