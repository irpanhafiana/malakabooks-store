using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IPromotionBannerRepository
{
    Task<PromotionBannerEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PromotionBannerEntity>> GetActiveAsync(DateTime utcNow, CancellationToken cancellationToken = default);
    Task<PromotionBannerEntity> CreateAsync(PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
