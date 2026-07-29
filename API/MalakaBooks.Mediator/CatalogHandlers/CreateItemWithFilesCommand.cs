using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record CreateItemWithFilesCommand(CreateItemWithFilesRequest Request) : IRequest<ValidationResult?>;
