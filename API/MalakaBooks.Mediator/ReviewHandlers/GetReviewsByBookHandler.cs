using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public class GetReviewsByBookHandler(IReviewRepository reviewRepository) : IRequestHandler<GetReviewsByBookQuery, IReadOnlyCollection<ReviewResponse>>
{
    public async Task<IReadOnlyCollection<ReviewResponse>> Handle(GetReviewsByBookQuery request, CancellationToken cancellationToken) =>
        (await reviewRepository.GetByBookIdAsync(request.BookId, cancellationToken)).Select(reviewEntity => reviewEntity.ToResponse()).ToArray();
}
