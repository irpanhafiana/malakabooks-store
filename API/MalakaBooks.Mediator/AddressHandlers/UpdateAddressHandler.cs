using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class UpdateAddressHandler(IAddressRepository addressRepository, IAddressEntityValidator validator) : IRequestHandler<UpdateAddressCommand, bool>
{
  private readonly IAddressEntityValidator _validator = validator;

  public async Task<bool> Handle(UpdateAddressCommand request, CancellationToken cancellationToken)
  {
    var entity = await addressRepository.GetByIdAsync(request.Id, cancellationToken);
    if (entity is null) return false;

    var result = _validator.UpdateValidateAsync(entity);
    if (result is not null) return false;

    entity.UpdateFrom(request.Request);
    return await addressRepository.UpdateAsync(request.Id, entity, cancellationToken);
  }
}
