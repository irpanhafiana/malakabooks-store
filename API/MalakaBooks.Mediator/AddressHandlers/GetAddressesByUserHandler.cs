using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class GetAddressesByUserHandler(IAddressRepository addressRepository) : IRequestHandler<GetAddressesByUserQuery, IReadOnlyCollection<AddressResponse>>
{
    public async Task<IReadOnlyCollection<AddressResponse>> Handle(GetAddressesByUserQuery request, CancellationToken cancellationToken) =>
        (await addressRepository.GetByUserIdAsync(request.UserId, cancellationToken)).Select(addressEntity => addressEntity.ToResponse()).ToArray();
}
