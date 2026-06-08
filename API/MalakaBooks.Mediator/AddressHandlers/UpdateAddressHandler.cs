using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class UpdateAddressHandler(IAddressRepository addressRepository) : IRequestHandler<UpdateAddressCommand, AddressResponse?>
{
    public async Task<AddressResponse?> Handle(UpdateAddressCommand request, CancellationToken cancellationToken)
    {
        var entity = await addressRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.UpdateFrom(request.Request);
        await addressRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
