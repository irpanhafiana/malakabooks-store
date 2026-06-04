using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record GetOrderByIdQuery(string Id) : IRequest<OrderResponse?>;
