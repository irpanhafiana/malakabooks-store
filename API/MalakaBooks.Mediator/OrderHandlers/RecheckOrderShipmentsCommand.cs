using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record RecheckOrderShipmentsCommand(IReadOnlyCollection<string> OrderIds) : IRequest<BatchOrderShipmentResponse<RecheckOrderShipmentResponse>>;
