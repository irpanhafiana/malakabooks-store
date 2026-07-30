using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBooksHandler(
    IBookRepository bookRepository,
    IItemRepository itemRepository,
    IAuthorRepository authorRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository) : IRequestHandler<GetBooksQuery, IReadOnlyCollection<BookResponse>>
{
    public async Task<IReadOnlyCollection<BookResponse>> Handle(GetBooksQuery request, CancellationToken cancellationToken)
    {
        var books = await bookRepository.GetAllAsync(cancellationToken);
        
        var itemIds = books.Select(x => x.ItemId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var items = itemIds.Count > 0 ? await itemRepository.GetByIdsAsync(itemIds, cancellationToken) : [];
        
        var authorIds = books.SelectMany(x => x.AuthorIds ?? []).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var authors = authorIds.Count > 0 ? await authorRepository.GetByIdsAsync(authorIds, cancellationToken) : [];
        
        var orders = itemIds.Count > 0 ? await orderRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];
        var reviews = itemIds.Count > 0 ? await reviewRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];
        
        var authorsById = authors.ToDictionary(author => author.Id ?? string.Empty, StringComparer.OrdinalIgnoreCase);
        var itemsById = items.Where(item => !string.IsNullOrWhiteSpace(item.Id)).ToDictionary(item => item.Id!, StringComparer.OrdinalIgnoreCase);

        var quantitySoldByItemId = orders
            .Where(order => string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            .SelectMany(order => order.Items)
            .Where(item => !string.IsNullOrWhiteSpace(item.ItemId))
            .GroupBy(item => item.ItemId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity), StringComparer.OrdinalIgnoreCase);

        var ratingByItemId = reviews
            .Where(review => !string.IsNullOrWhiteSpace(review.ItemId))
            .GroupBy(review => review.ItemId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Rating = group.Average(review => (double)review.Rating),
                    TotalReviews = group.Count()
                },
                StringComparer.OrdinalIgnoreCase);

        return books
            .Select(bookEntity =>
            {
                var bookAuthors = bookEntity.AuthorIds
                    .Where(authorId => !string.IsNullOrWhiteSpace(authorId))
                    .Select(authorId => authorsById.TryGetValue(authorId, out var foundAuthor) ? foundAuthor : null)
                    .Where(author => author is not null)
                    .Cast<AuthorEntity>()
                    .ToList();

                itemsById.TryGetValue(bookEntity.ItemId, out var itemEntity);
                var response = bookEntity.ToResponse(itemEntity, bookAuthors);

                if (!string.IsNullOrWhiteSpace(bookEntity.ItemId) && quantitySoldByItemId.TryGetValue(bookEntity.ItemId, out var quantitySold))
                {
                    response.QuantitySold = quantitySold;
                }

                if (!string.IsNullOrWhiteSpace(bookEntity.ItemId) && ratingByItemId.TryGetValue(bookEntity.ItemId, out var rating))
                {
                    response.Rating = rating.Rating;
                    response.AverageRating = rating.Rating;
                    response.TotalReviews = rating.TotalReviews;
                }

                return response;
            })
            .ToArray();
    }
}
