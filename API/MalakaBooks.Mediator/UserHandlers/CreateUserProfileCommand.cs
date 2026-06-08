using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record CreateUserProfileCommand(CreateUserProfileRequest Request) : IRequest<UserResponse>;
