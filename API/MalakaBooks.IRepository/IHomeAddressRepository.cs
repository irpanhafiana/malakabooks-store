using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IHomeAddressRepository
{
    Task<IReadOnlyCollection<HomeAddressEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<HomeAddressEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<HomeAddressEntity> CreateAsync(HomeAddressEntity address, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, HomeAddressEntity address, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);


}
