using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IPromotionBannerRepository
{
    Task<PromotionBannerEntity> CreateAsync(PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default);
}
