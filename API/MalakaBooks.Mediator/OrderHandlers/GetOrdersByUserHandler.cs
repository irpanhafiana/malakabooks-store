using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrdersByUserHandler(IOrderRepository orderRepository) : IRequestHandler<GetOrdersByUserQuery, IReadOnlyCollection<OrderResponse>>
{
    public async Task<IReadOnlyCollection<OrderResponse>> Handle(GetOrdersByUserQuery request, CancellationToken cancellationToken) =>
        (await orderRepository.GetByUserIdAsync(request.UserId, cancellationToken)).Select(orderEntity => orderEntity.ToResponse()).ToArray();
}
