using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record UpdateHomeAddressCommand(string Id, UpdateHomeAddressRequest Request) : IRequest<bool>;
