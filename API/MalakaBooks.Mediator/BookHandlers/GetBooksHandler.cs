using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBooksHandler(
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository) : IRequestHandler<GetBooksQuery, IReadOnlyCollection<BookResponse>>
{
    public async Task<IReadOnlyCollection<BookResponse>> Handle(GetBooksQuery request, CancellationToken cancellationToken)
    {
        var books = await bookRepository.GetAllAsync(cancellationToken);
        var authors = await authorRepository.GetAllAsync(cancellationToken);
        var orders = await orderRepository.GetAllAsync(cancellationToken);
        var reviews = await reviewRepository.GetAllAsync(cancellationToken);
        var authorsById = authors.ToDictionary(author => author.Id ?? string.Empty, StringComparer.OrdinalIgnoreCase);

        var quantitySoldByBookId = orders
            .Where(order => string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            .SelectMany(order => order.Items)
            .Where(item => !string.IsNullOrWhiteSpace(item.BookId))
            .GroupBy(item => item.BookId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity), StringComparer.OrdinalIgnoreCase);

        var ratingByBookId = reviews
            .Where(review => !string.IsNullOrWhiteSpace(review.BookId))
            .GroupBy(review => review.BookId, StringComparer.OrdinalIgnoreCase)
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

                var response = bookEntity.ToResponse(bookAuthors);

                if (!string.IsNullOrWhiteSpace(bookEntity.Id) && quantitySoldByBookId.TryGetValue(bookEntity.Id, out var quantitySold))
                {
                    response.QuantitySold = quantitySold;
                }

                if (!string.IsNullOrWhiteSpace(bookEntity.Id) && ratingByBookId.TryGetValue(bookEntity.Id, out var rating))
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
