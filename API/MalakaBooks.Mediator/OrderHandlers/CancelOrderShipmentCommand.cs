using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record CancelOrderShipmentCommand(string OrderId) : IRequest<CancelOrderShipmentResponse>;
