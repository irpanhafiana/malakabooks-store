using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public class DeletePaymentHandler(IPaymentRepository paymentRepository) : IRequestHandler<DeletePaymentCommand, bool>
{
    public async Task<bool> Handle(DeletePaymentCommand request, CancellationToken cancellationToken) =>
        await paymentRepository.DeleteAsync(request.Id, cancellationToken);
}
