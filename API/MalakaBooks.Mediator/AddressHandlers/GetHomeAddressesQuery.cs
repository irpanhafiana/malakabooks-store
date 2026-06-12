using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers

{
    public record GetHomeAddressesQuery() : IRequest<IReadOnlyCollection<HomeAddressResponse>>;
}
