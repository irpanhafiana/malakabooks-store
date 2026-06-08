using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetAllOrdersHandler(IOrderRepository orderRepository) : IRequestHandler<GetAllOrdersQuery, IReadOnlyCollection<OrderResponse>>
{
    public async Task<IReadOnlyCollection<OrderResponse>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetAllAsync(cancellationToken);
        return orders.Select(entity => new OrderResponse
        {
            Id = entity.Id ?? string.Empty,
            UserId = entity.UserId,
            AddressId = entity.AddressId,
            Status = entity.Status,
            TotalPrice = entity.TotalPrice,
            Note = entity.Note,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            Items = entity.Items.Select(i => new OrderItemResponse
            {
                BookId = i.BookId,
                Title = i.Title,
                Price = i.Price,
                Quantity = i.Quantity
            }).ToList()
        }).ToList();
    }
}
