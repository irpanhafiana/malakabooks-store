using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record GetAllUsersQuery : IRequest<IReadOnlyCollection<UserResponse>>;
