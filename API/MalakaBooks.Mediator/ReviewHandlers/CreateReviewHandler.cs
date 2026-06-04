using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ReviewHandlers;

public class CreateReviewHandler(IReviewRepository reviewRepository) : IRequestHandler<CreateReviewCommand, ReviewResponse>
{
    public async Task<ReviewResponse> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        await reviewRepository.CreateAsync(entity, cancellationToken);
        return entity.ToResponse();
    }
}
