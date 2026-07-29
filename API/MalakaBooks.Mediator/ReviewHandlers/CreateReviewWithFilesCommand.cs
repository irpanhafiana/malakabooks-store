using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ReviewHandlers;

public record CreateReviewWithFilesCommand(CreateReviewWithFilesRequest Request) : IRequest<ValidationResult?>;
