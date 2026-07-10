using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public class GetBookByIdHandler(
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository) : IRequestHandler<GetBookByIdQuery, BookResponse?>
{
    public async Task<BookResponse?> Handle(GetBookByIdQuery request, CancellationToken cancellationToken)
    {
        var book = await bookRepository.GetByIdAsync(request.Id, cancellationToken);
        if (book is null)
        {
            return null;
        }

        var authors = new List<MalakaBooks.Entity.AuthorEntity>();
        foreach (var authorId in book.AuthorIds)
        {
            var author = await authorRepository.GetByIdAsync(authorId, cancellationToken);
            if (author is not null)
            {
                authors.Add(author);
            }
        }

        var response = book.ToResponse(authors);
        var orders = await orderRepository.GetAllAsync(cancellationToken);
        var reviews = await reviewRepository.GetByBookIdAsync(book.Id ?? string.Empty, cancellationToken);

        response.QuantitySold = orders
            .Where(order => string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            .SelectMany(order => order.Items)
            .Where(item => string.Equals(item.BookId, book.Id, StringComparison.OrdinalIgnoreCase))
            .Sum(item => item.Quantity);

        if (reviews.Count > 0)
        {
            response.Rating = reviews.Average(review => (double)review.Rating);
            response.AverageRating = response.Rating;
            response.TotalReviews = reviews.Count;
        }

        return response;
    }
}
