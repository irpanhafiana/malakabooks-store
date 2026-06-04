using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record GetUserProfileQuery(string Id) : IRequest<UserResponse?>;
