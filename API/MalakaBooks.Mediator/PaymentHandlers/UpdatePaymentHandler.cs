using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public class UpdatePaymentHandler(IPaymentRepository paymentRepository) : IRequestHandler<UpdatePaymentCommand, bool>
{
    public async Task<bool> Handle(UpdatePaymentCommand request, CancellationToken cancellationToken)
    {
        var entity = await paymentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await paymentRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
