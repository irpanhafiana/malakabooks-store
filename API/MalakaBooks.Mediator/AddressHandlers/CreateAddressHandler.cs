using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.AddressHandlers;

public class CreateAddressHandler(IAddressRepository addressRepository, IAddressEntityValidator validator) : IRequestHandler<CreateAddressCommand, ValidationResult?>
{
    private readonly IAddressEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await addressRepository.CreateAsync(entity, cancellationToken);
        }
        return result;
    }
}
