using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public class CreatePaymentHandler(IPaymentRepository paymentRepository) : IRequestHandler<CreatePaymentCommand, bool>
{
    public async Task<bool> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        await paymentRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}
