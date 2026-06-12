using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;
using Subur.Extension;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetAllOrdersHandler(IOrderRepository orderRepository) : IRequestHandler<GetAllOrdersQuery, PagedResult<OrderResponse>>
{
    public async Task<PagedResult<OrderResponse>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetAllOrdersPaged(request.PageNumber, request.PageSize);

        return orders.Results.Select(entity => new OrderResponse
        {
            Id = entity.Id ?? string.Empty,
            UserId = entity.UserId,
            AddressId = entity.AddressId,
            Status = entity.Status,
            TotalPrice = entity.TotalPrice,
            Note = entity.Note,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            Items = [.. entity.Items.Select(i => new OrderItemResponse
      {
        BookId = i.BookId,
        Title = i.Title,
        Price = i.Price,
        Quantity = i.Quantity
      })]
        }).ToPagedList(orders.RowCount, orders.CurrentPage, orders.PageSize);
    }
}
