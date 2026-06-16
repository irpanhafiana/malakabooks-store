using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IIncomingPaymentRepository
{
    Task<IncomingPaymentEntity?> GetByOrderIdAsync(string orderId, CancellationToken cancellationToken = default);
    Task<IncomingPaymentEntity> CreateAsync(IncomingPaymentEntity incomingPayment, CancellationToken cancellationToken = default);
}
