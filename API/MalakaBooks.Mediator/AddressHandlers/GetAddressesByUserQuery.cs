using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AddressHandlers;

public record GetAddressesByUserQuery(string UserId) : IRequest<IReadOnlyCollection<AddressResponse>>;
