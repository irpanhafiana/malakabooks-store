using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class GetHomeAddressesHandler(IHomeAddressRepository homeAddressRepository) : IRequestHandler<GetHomeAddressesQuery, IReadOnlyCollection<HomeAddressResponse>>
{
    public async Task<IReadOnlyCollection<HomeAddressResponse>> Handle(GetHomeAddressesQuery request, CancellationToken cancellationToken) =>
        (await homeAddressRepository.GetAllAsync(cancellationToken))
            .Select(addressEntity => addressEntity.ToHomeResponse())
            .ToArray();
}
