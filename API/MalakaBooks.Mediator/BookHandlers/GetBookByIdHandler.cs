using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBookByIdHandler(IBookRepository bookRepository, IAuthorRepository authorRepository) : IRequestHandler<GetBookByIdQuery, BookResponse?>
{
    public async Task<BookResponse?> Handle(GetBookByIdQuery request, CancellationToken cancellationToken)
    {
        var book = await bookRepository.GetByIdAsync(request.Id, cancellationToken);
        if (book is null)
        {
            return null;
        }

        var author = string.IsNullOrWhiteSpace(book.AuthorId)
            ? null
            : await authorRepository.GetByIdAsync(book.AuthorId, cancellationToken);

        return book.ToResponse(author);
    }
}
