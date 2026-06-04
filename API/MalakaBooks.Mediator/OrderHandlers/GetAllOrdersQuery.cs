using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record GetAllOrdersQuery : IRequest<IReadOnlyCollection<OrderResponse>>;
