using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record GetOrdersByUserQuery(string UserId) : IRequest<IReadOnlyCollection<OrderResponse>>;
