using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class UpdateOrderStatusHandler(IOrderRepository orderRepository) : IRequestHandler<UpdateOrderStatusCommand, OrderResponse?>
{
    public async Task<OrderResponse?> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.Status = request.Request.Status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;
        await orderRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
