using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
    public record GetSimasrimProvinceQuery() : IRequest<BaseResponse?>;
    public class GetSimasrimProvinceQueryHandler : IRequestHandler<GetSimasrimProvinceQuery, BaseResponse?>
    {
        private readonly SimasrimApiClient simasrimApiClient;

        public GetSimasrimProvinceQueryHandler(SimasrimApiClient simasrimApiClient)
        {
            this.simasrimApiClient = simasrimApiClient;
        }

        public async Task<BaseResponse?> Handle(GetSimasrimProvinceQuery request, CancellationToken cancellationToken)
        {
            return await simasrimApiClient.GetAsync<BaseResponse>(
                "api/b2b/pengiriman/ekspedisi/wilayah/province",
                cancellationToken);
        }
    }
}
