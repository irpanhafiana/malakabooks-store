using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record DeleteHomeAddressCommand(string Id) : IRequest<bool>;
