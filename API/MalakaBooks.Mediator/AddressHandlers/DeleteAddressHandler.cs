using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class DeleteAddressHandler(IAddressRepository addressRepository) : IRequestHandler<DeleteAddressCommand, bool>
{
    public async Task<bool> Handle(DeleteAddressCommand request, CancellationToken cancellationToken) =>
        await addressRepository.DeleteAsync(request.Id, cancellationToken);
}
