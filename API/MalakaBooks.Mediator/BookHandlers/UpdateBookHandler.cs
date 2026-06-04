using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class UpdateBookHandler(IBookRepository bookRepository) : IRequestHandler<UpdateBookCommand, BookResponse?>
{
    public async Task<BookResponse?> Handle(UpdateBookCommand request, CancellationToken cancellationToken)
    {
        var entity = await bookRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.UpdateFrom(request.Request);
        await bookRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
