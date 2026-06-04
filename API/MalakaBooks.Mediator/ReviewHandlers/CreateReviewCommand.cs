using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public record CreateReviewCommand(CreateReviewRequest Request) : IRequest<ReviewResponse>;
