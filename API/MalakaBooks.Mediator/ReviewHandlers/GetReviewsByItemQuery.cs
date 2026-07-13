using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public record GetReviewsByItemQuery(string ItemId) : IRequest<IReadOnlyCollection<ReviewResponse>>;
