using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class UpdateHomeAddressHandler(IHomeAddressRepository homeAddressRepository, IHomeAddressEntityValidator validator) : IRequestHandler<UpdateHomeAddressCommand, bool>
{
    private readonly IHomeAddressEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateHomeAddressCommand request, CancellationToken cancellationToken)
    {
        var entity = await homeAddressRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        return await homeAddressRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
