using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public record GetReviewsByBookQuery(string BookId) : IRequest<IReadOnlyCollection<ReviewResponse>>;
