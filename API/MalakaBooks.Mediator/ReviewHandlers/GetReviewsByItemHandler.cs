using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public class GetReviewsByItemHandler(IReviewRepository reviewRepository) : IRequestHandler<GetReviewsByItemQuery, IReadOnlyCollection<ReviewResponse>>
{
    public async Task<IReadOnlyCollection<ReviewResponse>> Handle(GetReviewsByItemQuery request, CancellationToken cancellationToken) =>
        (await reviewRepository.GetByItemIdAsync(request.ItemId, cancellationToken)).Select(reviewEntity => reviewEntity.ToResponse()).ToArray();
}
