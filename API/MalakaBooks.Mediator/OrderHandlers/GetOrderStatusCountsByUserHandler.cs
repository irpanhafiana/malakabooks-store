using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrderStatusCountsByUserHandler(IOrderRepository orderRepository) : IRequestHandler<GetOrderStatusCountsByUserQuery, OrderStatusCountsResponse>
{
    public async Task<OrderStatusCountsResponse> Handle(GetOrderStatusCountsByUserQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        
        return new OrderStatusCountsResponse
        {
            WaitingForPaymentCount = orders.Count(o => o.Status.Equals("pending_payment", StringComparison.OrdinalIgnoreCase)),
            ProcessCount = orders.Count(o => o.Status.Equals("ready_to_ship", StringComparison.OrdinalIgnoreCase)),
            DeliveryCount = orders.Count(o => o.Status.Equals("shipped", StringComparison.OrdinalIgnoreCase)),
            FinishedCount = orders.Count(o => o.Status.Equals("delivered", StringComparison.OrdinalIgnoreCase))
        };
    }
}
