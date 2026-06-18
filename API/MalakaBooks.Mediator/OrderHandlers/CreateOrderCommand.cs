using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<CreateOrderResponse>;
