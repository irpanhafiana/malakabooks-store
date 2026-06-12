using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
  public record GetSimasrimCityQuery(CityModel model) : IRequest<BaseResponse?>;
  public class GetSimasrimCityQueryHandler : IRequestHandler<GetSimasrimCityQuery, BaseResponse?>
  {
    private readonly SimasrimApiClient simasrimApiClient;

    public GetSimasrimCityQueryHandler(SimasrimApiClient simasrimApiClient)
    {
      this.simasrimApiClient = simasrimApiClient;
    }

    public async Task<BaseResponse?> Handle(GetSimasrimCityQuery request, CancellationToken cancellationToken)
    {
      return await simasrimApiClient.PostAsync<BaseResponse>(
          "api/b2b/pengiriman/ekspedisi/wilayah/city",
          request.model,
          cancellationToken);
    }
  }
}
