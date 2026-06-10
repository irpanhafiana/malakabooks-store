using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.UserHandlers;

public record CreateUserProfileCommand(CreateUserProfileRequest Request) : IRequest<ValidationResult?>;
