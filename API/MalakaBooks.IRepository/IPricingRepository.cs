using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IPricingRepository
{
    Task<IReadOnlyCollection<PricingEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PricingEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PricingEntity>> GetActiveByItemIdAsync(string itemId, DateTime asOfUtc, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PricingEntity>> GetActiveByItemIdsAsync(IReadOnlyCollection<string> itemIds, DateTime asOfUtc, CancellationToken cancellationToken = default);
    Task<PricingEntity> CreateAsync(PricingEntity pricing, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, PricingEntity pricing, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
