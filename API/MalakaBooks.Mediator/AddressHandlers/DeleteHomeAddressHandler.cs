using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public class DeleteHomeAddressHandler(IHomeAddressRepository homeAddressRepository) : IRequestHandler<DeleteHomeAddressCommand, bool>
{
    public async Task<bool> Handle(DeleteHomeAddressCommand request, CancellationToken cancellationToken) =>
        await homeAddressRepository.DeleteAsync(request.Id, cancellationToken);
}
