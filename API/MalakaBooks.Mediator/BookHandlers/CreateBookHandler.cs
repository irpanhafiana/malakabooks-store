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
        var item = await itemRepository.GetByIdAsync(request.Request.ItemId, cancellationToken);
        if (item is null)
        {
            return new ValidationResult("Selected item was not found.");
        }

        var entity = request.Request.ToEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await bookRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
