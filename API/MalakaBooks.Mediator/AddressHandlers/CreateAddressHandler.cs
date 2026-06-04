using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class CreateAddressHandler(IAddressRepository addressRepository) : IRequestHandler<CreateAddressCommand, AddressResponse>
{
    public async Task<AddressResponse> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        await addressRepository.CreateAsync(entity, cancellationToken);
        return entity.ToResponse();
    }
}
