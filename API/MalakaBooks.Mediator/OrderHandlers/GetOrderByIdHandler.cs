using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrderByIdHandler(IOrderRepository orderRepository) : IRequestHandler<GetOrderByIdQuery, OrderResponse?>
{
    public async Task<OrderResponse?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return null;

        return new OrderResponse
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
        };
    }
}
