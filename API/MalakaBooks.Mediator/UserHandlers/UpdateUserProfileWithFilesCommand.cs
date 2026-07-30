using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record UpdateUserProfileWithFilesCommand(string Id, UpdateUserWithFilesRequest Request) : IRequest<bool>;
