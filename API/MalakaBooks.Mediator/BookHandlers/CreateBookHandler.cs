using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class CreateBookHandler(IBookRepository bookRepository) : IRequestHandler<CreateBookCommand, BookResponse>
{
    public async Task<BookResponse> Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        await bookRepository.CreateAsync(entity, cancellationToken);
        return entity.ToResponse();
    }
}
