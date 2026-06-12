using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.SimasrimHandlers
{
  public record GetSimasrimDistrictQuery(DistrictModel model) : IRequest<DistrictResponse?>;
  public class GetSimasrimDistrictQueryHandler : IRequestHandler<GetSimasrimDistrictQuery, DistrictResponse?>
  {
    private readonly SimasrimApiClient simasrimApiClient;

    public GetSimasrimDistrictQueryHandler(SimasrimApiClient simasrimApiClient)
    {
      this.simasrimApiClient = simasrimApiClient;
    }

    public async Task<DistrictResponse?> Handle(GetSimasrimDistrictQuery request, CancellationToken cancellationToken)
    {
      return await simasrimApiClient.PostAsync<DistrictResponse>(
          "api/b2b/pengiriman/ekspedisi/wilayah/district",
          request.model,
          cancellationToken);
    }
  }
}
