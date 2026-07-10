using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class UpdateBookHandler(
    IBookRepository bookRepository,
    IInventoryMovementRepository inventoryMovementRepository,
    IBookEntityValidator validator) : IRequestHandler<UpdateBookCommand, bool>
{
    private readonly IBookEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateBookCommand request, CancellationToken cancellationToken)
    {
        var entity = await bookRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        var stockBefore = entity.Stock;

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        entity.UpdateFrom(request.Request);
        var isUpdated = await bookRepository.UpdateAsync(request.Id, entity, cancellationToken);
        if (!isUpdated)
        {
            return false;
        }

        if (stockBefore != entity.Stock)
        {
            await inventoryMovementRepository.CreateAsync(new MalakaBooks.Entity.InventoryMovementEntity
            {
                BookId = entity.Id ?? request.Id,
                BookTitle = entity.Title,
                MovementType = "adjustment",
                QuantityDelta = entity.Stock - stockBefore,
                StockBefore = stockBefore,
                StockAfter = entity.Stock,
                ReferenceId = request.Id,
                Note = $"Stock adjusted manually from admin book update for book '{request.Id}'.",
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        return true;
    }
}
