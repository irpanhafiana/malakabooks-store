using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBooksHandler(IBookRepository bookRepository) : IRequestHandler<GetBooksQuery, IReadOnlyCollection<BookResponse>>
{
    public async Task<IReadOnlyCollection<BookResponse>> Handle(GetBooksQuery request, CancellationToken cancellationToken) =>
        (await bookRepository.GetAllAsync(cancellationToken)).Select(bookEntity => bookEntity.ToResponse()).ToArray();
}
