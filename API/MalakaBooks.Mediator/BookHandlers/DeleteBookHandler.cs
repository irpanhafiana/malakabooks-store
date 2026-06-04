using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class DeleteBookHandler(IBookRepository bookRepository) : IRequestHandler<DeleteBookCommand, bool>
{
    public async Task<bool> Handle(DeleteBookCommand request, CancellationToken cancellationToken) =>
        await bookRepository.DeleteAsync(request.Id, cancellationToken);
}
