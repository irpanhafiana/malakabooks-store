using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record RecheckOrderShipmentCommand(string OrderId) : IRequest<RecheckOrderShipmentResponse>;
