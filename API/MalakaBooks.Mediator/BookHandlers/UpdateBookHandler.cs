using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class UpdateBookHandler(
    IBookRepository bookRepository,
    IItemRepository itemRepository,
    IBookEntityValidator validator) : IRequestHandler<UpdateBookCommand, bool>
{
    private readonly IBookEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateBookCommand request, CancellationToken cancellationToken)
    {
        var entity = await bookRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        var item = await itemRepository.GetByIdAsync(entity.ItemId, cancellationToken);
        if (item is null)
        {
            return false;
        }

        entity.UpdateFrom(request.Request);
        if (!string.Equals(entity.ItemId, item.Id, StringComparison.OrdinalIgnoreCase))
        {
            var targetItem = await itemRepository.GetByIdAsync(entity.ItemId, cancellationToken);
            if (targetItem is null)
            {
                return false;
            }
        }

        var isUpdated = await bookRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return isUpdated;
    }
}
