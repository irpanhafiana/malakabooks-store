using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IComplaintRepository
{
    Task<ComplaintEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ComplaintEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ComplaintEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<ComplaintEntity> CreateAsync(ComplaintEntity complaint, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, ComplaintEntity complaint, CancellationToken cancellationToken = default);
}
