using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.BookHandlers;

public class CreateBookHandler(IBookRepository bookRepository, IItemRepository itemRepository, IBookEntityValidator validator) : IRequestHandler<CreateBookCommand, ValidationResult?>
{
    private readonly IBookEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        var item = request.Request.ToItemEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            var createdItem = await itemRepository.CreateAsync(item, cancellationToken);
            entity.ItemId = createdItem.Id ?? string.Empty;
            await bookRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
