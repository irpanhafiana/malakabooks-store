using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record CreateOrderShipmentsCommand(IReadOnlyCollection<string> OrderIds) : IRequest<BatchOrderShipmentResponse<CreateOrderShipmentResponse>>;
