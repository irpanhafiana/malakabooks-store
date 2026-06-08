using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record CreateAddressCommand(CreateAddressRequest Request) : IRequest<AddressResponse>;
