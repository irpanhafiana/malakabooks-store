using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record DeleteAddressCommand(string Id) : IRequest<bool>;
