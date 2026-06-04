using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IAddressRepository
{
    Task<AddressEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AddressEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<AddressEntity> CreateAsync(AddressEntity address, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, AddressEntity address, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
