using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ReviewHandlers;

public record CreateReviewCommand(CreateReviewRequest Request) : IRequest<ValidationResult?>;
