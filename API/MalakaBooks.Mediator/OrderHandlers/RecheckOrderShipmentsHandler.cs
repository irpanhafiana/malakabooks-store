using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class RecheckOrderShipmentsHandler(ISender sender)
    : IRequestHandler<RecheckOrderShipmentsCommand, BatchOrderShipmentResponse<RecheckOrderShipmentResponse>>
{
    public async Task<BatchOrderShipmentResponse<RecheckOrderShipmentResponse>> Handle(RecheckOrderShipmentsCommand request, CancellationToken cancellationToken)
    {
        var orderIds = request.OrderIds?
            .Where(orderId => !string.IsNullOrWhiteSpace(orderId))
            .Select(orderId => orderId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? [];

        var results = new List<RecheckOrderShipmentResponse>();

        foreach (var orderId in orderIds)
        {
            var result = await sender.Send(new RecheckOrderShipmentCommand(orderId), cancellationToken);
            results.Add(result);
        }

        return new BatchOrderShipmentResponse<RecheckOrderShipmentResponse>
        {
            TotalOrders = orderIds.Count,
            SuccessCount = results.Count(result => result.IsSuccess),
            FailureCount = results.Count(result => !result.IsSuccess),
            Results = results
        };
    }
}
