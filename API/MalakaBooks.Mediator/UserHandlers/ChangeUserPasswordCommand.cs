using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.UserHandlers;

public record ChangeUserPasswordCommand(string UserId, ChangePasswordRequest Request) : IRequest<ValidationResult?>;
