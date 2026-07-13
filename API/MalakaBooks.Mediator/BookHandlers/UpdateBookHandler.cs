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

        entity.UpdateFrom(request.Request);
        var item = await itemRepository.GetByIdAsync(entity.ItemId, cancellationToken);
        if (item is null)
        {
            return false;
        }

        item.UpdateItemFrom(request.Request);
        var isItemUpdated = await itemRepository.UpdateAsync(item.Id!, item, cancellationToken);
        if (!isItemUpdated)
        {
            return false;
        }

        var isUpdated = await bookRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return isUpdated;
    }
}
