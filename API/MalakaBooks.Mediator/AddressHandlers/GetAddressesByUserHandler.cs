using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class GetAddressesByUserHandler(IAddressRepository addressRepository) : IRequestHandler<GetAddressesByUserQuery, IReadOnlyCollection<AddressResponse>>
{
    public async Task<IReadOnlyCollection<AddressResponse>> Handle(GetAddressesByUserQuery request, CancellationToken cancellationToken)
    {
        var addresses = await addressRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        return [.. addresses.Select(addressEntity => addressEntity.ToResponse())];
    }
}
