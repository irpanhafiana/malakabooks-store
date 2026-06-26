using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrderByIdHandler(IOrderRepository orderRepository, IBookRepository bookRepository) : IRequestHandler<GetOrderByIdQuery, OrderResponse?>
{
    public async Task<OrderResponse?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        var bookIds = entity.Items.Select(item => item.BookId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToArray();
        var coverImagesByBookId = await LoadCoverImagesByBookIdAsync(bookRepository, bookIds, cancellationToken);

        return entity.ToResponse(coverImagesByBookId);
    }

    private static async Task<IReadOnlyDictionary<string, string>> LoadCoverImagesByBookIdAsync(IBookRepository bookRepository, IEnumerable<string> bookIds, CancellationToken cancellationToken)
    {
        var coverImagesByBookId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var bookId in bookIds)
        {
            var book = await bookRepository.GetByIdAsync(bookId, cancellationToken);
            if (book is not null)
            {
                coverImagesByBookId[bookId] = book.CoverImage;
            }
        }

        return coverImagesByBookId;
    }
}
