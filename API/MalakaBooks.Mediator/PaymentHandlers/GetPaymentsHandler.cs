using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public class GetPaymentsHandler(IPaymentRepository paymentRepository) : IRequestHandler<GetPaymentsQuery, IReadOnlyCollection<PaymentResponse>>
{
    public async Task<IReadOnlyCollection<PaymentResponse>> Handle(GetPaymentsQuery request, CancellationToken cancellationToken) =>
        (await paymentRepository.GetAllAsync(cancellationToken)).Select(paymentEntity => paymentEntity.ToResponse()).ToArray();
}
