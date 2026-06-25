using MalakaBooks.IRepository;
using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
    public record GetSimasrimTrackAwbQuery(string OrderId, string UserId) : IRequest<TrackAwbResponse?>;

    public class GetSimasrimTrackAwbQueryHandler : IRequestHandler<GetSimasrimTrackAwbQuery, TrackAwbResponse?>
    {
        private readonly IOrderRepository orderRepository;
        private readonly SimasrimApiClient simasrimApiClient;

        public GetSimasrimTrackAwbQueryHandler(IOrderRepository orderRepository, SimasrimApiClient simasrimApiClient)
        {
            this.orderRepository = orderRepository;
            this.simasrimApiClient = simasrimApiClient;
        }

        public async Task<TrackAwbResponse?> Handle(GetSimasrimTrackAwbQuery request, CancellationToken cancellationToken)
        {
            var orderId = request.OrderId?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(orderId))
            {
                return CreateFailureResponse("400", "Order id is required.");
            }

            var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
            if (order is null)
            {
                return CreateFailureResponse("404", "Order not found.");
            }

            var userId = request.UserId?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(userId) && !string.Equals(order.User.UserId, userId, StringComparison.OrdinalIgnoreCase))
            {
                return CreateFailureResponse("403", "You are not authorized to track this order.");
            }

            if (string.IsNullOrWhiteSpace(order.AWBNo))
            {
                return CreateFailureResponse("400", "AWB number is not available for this order.");
            }

            if (string.IsNullOrWhiteSpace(order.ShippingCourier))
            {
                return CreateFailureResponse("400", "Courier is not available for this order.");
            }

            return await simasrimApiClient.PostAsync<TrackAwbResponse>(
                "api/b2b/pengiriman/ekspedisi/track-resi",
                new TrackAwbModel
                {
                    Awb = order.AWBNo,
                    Ekspedisi = order.ShippingCourier
                },
                cancellationToken) ?? CreateFailureResponse("502", "No response returned from Simasrim.");
        }

        private static TrackAwbResponse CreateFailureResponse(string code, string message)
        {
            return new TrackAwbResponse
            {
                Code = code,
                Status = "Failed",
                Data = new TrackAwbData
                {
                    Description = message,
                    DeliveryHistory = []
                }
            };
        }
    }
}
