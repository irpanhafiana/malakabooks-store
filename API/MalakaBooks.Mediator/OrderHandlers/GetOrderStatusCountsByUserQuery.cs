using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record GetOrderStatusCountsByUserQuery(string UserId) : IRequest<OrderStatusCountsResponse>;
