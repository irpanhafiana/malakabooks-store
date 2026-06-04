using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record UpdateAddressCommand(string Id, UpdateAddressRequest Request) : IRequest<AddressResponse?>;
