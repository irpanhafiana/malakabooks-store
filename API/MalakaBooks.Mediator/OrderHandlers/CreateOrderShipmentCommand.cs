using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record CreateOrderShipmentCommand(string OrderId) : IRequest<CreateOrderShipmentResponse>;
