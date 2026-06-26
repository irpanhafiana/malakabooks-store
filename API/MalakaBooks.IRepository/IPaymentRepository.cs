using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IPaymentRepository
{
    Task<IReadOnlyCollection<PaymentEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PaymentEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<PaymentEntity> CreateAsync(PaymentEntity payment, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, PaymentEntity payment, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
