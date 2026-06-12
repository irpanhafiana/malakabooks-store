using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
    public record GetSimasrimTariffQuery(TariffModel model) : IRequest<TariffResponse?>;
    public class GetSimasrimTariffQueryHandler : IRequestHandler<GetSimasrimTariffQuery, TariffResponse?>
    {
        private readonly SimasrimApiClient simasrimApiClient;

        public GetSimasrimTariffQueryHandler(SimasrimApiClient simasrimApiClient)
        {
            this.simasrimApiClient = simasrimApiClient;
        }

        public async Task<TariffResponse?> Handle(GetSimasrimTariffQuery request, CancellationToken cancellationToken)
        {
            return await simasrimApiClient.PostAsync<TariffResponse>(
                "api/b2b/pengiriman/ekspedisi/cek-tarif",
                request.model,
                cancellationToken);
        }
    }
}
