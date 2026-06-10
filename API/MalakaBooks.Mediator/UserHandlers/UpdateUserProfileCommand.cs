using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record UpdateUserProfileCommand(string Id, UpdateUserRequest Request) : IRequest<bool>;
