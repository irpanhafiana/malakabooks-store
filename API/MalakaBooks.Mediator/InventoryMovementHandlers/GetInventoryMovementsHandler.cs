using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.InventoryMovementHandlers;

public class GetInventoryMovementsHandler(IInventoryMovementRepository inventoryMovementRepository) : IRequestHandler<GetInventoryMovementsQuery, IReadOnlyCollection<InventoryMovementResponse>>
{
    public async Task<IReadOnlyCollection<InventoryMovementResponse>> Handle(GetInventoryMovementsQuery request, CancellationToken cancellationToken)
    {
        var movements = string.IsNullOrWhiteSpace(request.BookId)
            ? await inventoryMovementRepository.GetAllAsync(cancellationToken)
            : await inventoryMovementRepository.GetByBookIdAsync(request.BookId.Trim(), cancellationToken);

        return movements.Select(movement => movement.ToResponse()).ToArray();
    }
}
