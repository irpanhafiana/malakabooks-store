using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class GetActivePromotionBannersHandler(IPromotionBannerRepository promotionBannerRepository, TimeProvider timeProvider) : IRequestHandler<GetActivePromotionBannersQuery, IReadOnlyCollection<PromotionBannerResponse>>
{
    public async Task<IReadOnlyCollection<PromotionBannerResponse>> Handle(GetActivePromotionBannersQuery request, CancellationToken cancellationToken) =>
        (await promotionBannerRepository.GetActiveAsync(timeProvider.GetUtcNow().UtcDateTime, cancellationToken))
            .Select(entity => entity.ToResponse())
            .ToArray();
}
