using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBookByIdHandler(IBookRepository bookRepository) : IRequestHandler<GetBookByIdQuery, BookResponse?>
{
    public async Task<BookResponse?> Handle(GetBookByIdQuery request, CancellationToken cancellationToken) =>
        (await bookRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}
