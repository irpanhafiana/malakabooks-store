using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.InventoryMovementHandlers;

public record ReceiveGoodsCommand(GoodsReceiveRequest Request) : IRequest<bool>;

public class ReceiveGoodsHandler(IItemRepository itemRepository, IInventoryMovementRepository inventoryMovementRepository) : IRequestHandler<ReceiveGoodsCommand, bool>
{
    public async Task<bool> Handle(ReceiveGoodsCommand request, CancellationToken cancellationToken)
    {
        var itemId = request.Request.ItemId.Trim();
        if (string.IsNullOrWhiteSpace(itemId) || request.Request.Quantity <= 0)
        {
            return false;
        }

        var item = await itemRepository.GetByIdAsync(itemId, cancellationToken);
        if (item is null)
        {
            return false;
        }

        var stockBefore = item.Stock;
        var updatedItem = await itemRepository.AdjustStockAsync(itemId, request.Request.Quantity, cancellationToken);
        if (updatedItem is null)
        {
            return false;
        }

        await inventoryMovementRepository.CreateAsync(new InventoryMovementEntity
        {
            ItemId = itemId,
            ItemName = item.Name,
            MovementType = "goods_receive",
            QuantityDelta = request.Request.Quantity,
            StockBefore = stockBefore,
            StockAfter = updatedItem.Stock,
            ReferenceId = request.Request.ReferenceId.Trim(),
            Note = request.Request.Note.Trim(),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return true;
    }
}
