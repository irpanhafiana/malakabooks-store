using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;
using Subur.Extension;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetAllOrdersHandler(IOrderRepository orderRepository) : IRequestHandler<GetAllOrdersQuery, PagedResult<AdminOrderResponse>>
{
    public async Task<PagedResult<AdminOrderResponse>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetAllOrdersPaged(request.PageNumber, request.PageSize);

        return orders.Results.Select(entity => entity.ToAdminResponse()).ToPagedList(orders.RowCount, orders.CurrentPage, orders.PageSize);
    }
}
