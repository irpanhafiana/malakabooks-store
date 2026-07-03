using MalakaBooks.ConfigSetting;
using Mardika.Simasrim.Service.Model;
using MediatR;
using Microsoft.Extensions.Options;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
    public record GetSimasrimDetailResiQuery(DetailResiModel Model) : IRequest<DetailResiResponse?>;

    public class GetSimasrimDetailResiQueryHandler : IRequestHandler<GetSimasrimDetailResiQuery, DetailResiResponse?>
    {
        private readonly SimasrimApiClient simasrimApiClient;
        private readonly OrderSetting orderSetting;

        public GetSimasrimDetailResiQueryHandler(SimasrimApiClient simasrimApiClient, IOptions<AppSetting> appSettingOptions)
        {
            this.simasrimApiClient = simasrimApiClient;
            this.orderSetting = appSettingOptions.Value.OrderSetting ?? new OrderSetting();
        }

        public async Task<DetailResiResponse?> Handle(GetSimasrimDetailResiQuery request, CancellationToken cancellationToken)
        {
            if (request.Model is null)
            {
                return CreateFailureResponse("400", "Payload is required.");
            }

            var courier = request.Model.Ekspedisi?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(courier))
            {
                return CreateFailureResponse("400", "Ekspedisi is required.");
            }

            var awb = request.Model.Awb?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(awb))
            {
                return CreateFailureResponse("400", "AWB is required.");
            }

            if (!string.Equals(orderSetting.SimasrimDetailResiMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                return CreateFailureResponse("500", "Simasrim detail resi method configuration is invalid.");
            }

            var detailResiPath = orderSetting.SimasrimDetailResiPath?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(detailResiPath))
            {
                return CreateFailureResponse("500", "Simasrim detail resi path is not configured.");
            }

            return await simasrimApiClient.PostAsync<DetailResiResponse>(
                detailResiPath,
                new DetailResiModel
                {
                    Ekspedisi = courier,
                    Awb = awb
                },
                cancellationToken) ?? CreateFailureResponse("502", "No response returned from Simasrim.");
        }

        private static DetailResiResponse CreateFailureResponse(string code, string message)
        {
            return new DetailResiResponse
            {
                Code = code,
                Status = "Failed",
                Data = new DetailResiData
                {
                    Description = message
                }
            };
        }
    }
}
