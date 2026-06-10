using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record CreateComplaintCommand(CreateComplaintRequest Request) : IRequest<ValidationResult?>;
