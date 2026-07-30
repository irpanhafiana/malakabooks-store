using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record CreateComplaintWithFilesCommand(CreateComplaintWithFilesRequest Request) : IRequest<ValidationResult?>;
