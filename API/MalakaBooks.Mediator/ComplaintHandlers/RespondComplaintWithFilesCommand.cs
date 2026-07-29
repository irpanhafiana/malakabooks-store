using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record RespondComplaintWithFilesCommand(string Id, RespondComplaintWithFilesRequest Request) : IRequest<ValidationResult?>;
