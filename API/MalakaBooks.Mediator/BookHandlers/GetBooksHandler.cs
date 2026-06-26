using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBooksHandler(IBookRepository bookRepository, IAuthorRepository authorRepository) : IRequestHandler<GetBooksQuery, IReadOnlyCollection<BookResponse>>
{
    public async Task<IReadOnlyCollection<BookResponse>> Handle(GetBooksQuery request, CancellationToken cancellationToken)
    {
        var books = await bookRepository.GetAllAsync(cancellationToken);
        var authors = await authorRepository.GetAllAsync(cancellationToken);
        var authorsById = authors.ToDictionary(author => author.Id ?? string.Empty, StringComparer.OrdinalIgnoreCase);

        return books
            .Select(bookEntity => bookEntity.ToResponse(authorsById.TryGetValue(bookEntity.AuthorId, out var author) ? author : null))
            .ToArray();
    }
}
