using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public class GetPaymentByIdHandler(IPaymentRepository paymentRepository) : IRequestHandler<GetPaymentByIdQuery, PaymentResponse?>
{
    public async Task<PaymentResponse?> Handle(GetPaymentByIdQuery request, CancellationToken cancellationToken) =>
        (await paymentRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}
