using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IUserRepository
{
    Task<UserEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<UserEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UserEntity> CreateAsync(UserEntity user, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, UserEntity user, CancellationToken cancellationToken = default);
}
