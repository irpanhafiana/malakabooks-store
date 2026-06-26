using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
    public record GetSimasrimInsuranceQuery(SimasrimInsuranceRequest Model) : IRequest<SimasrimInsuranceResponse?>;

    public class GetSimasrimInsuranceQueryHandler : IRequestHandler<GetSimasrimInsuranceQuery, SimasrimInsuranceResponse?>
    {
        private readonly SimasrimApiClient simasrimApiClient;

        public GetSimasrimInsuranceQueryHandler(SimasrimApiClient simasrimApiClient)
        {
            this.simasrimApiClient = simasrimApiClient;
        }

        public async Task<SimasrimInsuranceResponse?> Handle(GetSimasrimInsuranceQuery request, CancellationToken cancellationToken)
        {
            return await simasrimApiClient.PostAsync<SimasrimInsuranceResponse>(
                "api/b2b/pengiriman/ekspedisi/cek-asuransi",
                request.Model,
                cancellationToken);
        }
    }
}
