using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.AddressHandlers
{

    public class CreateHomeAddressHandler(IHomeAddressRepository addressRepository, IHomeAddressEntityValidator validator) : IRequestHandler<CreateHomeAddressCommand, ValidationResult?>
    {
        private readonly IHomeAddressEntityValidator _validator = validator;

        public async Task<ValidationResult?> Handle(CreateHomeAddressCommand request, CancellationToken cancellationToken)
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
}
