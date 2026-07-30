using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record UpdateItemWithFilesCommand(string Id, UpdateItemWithFilesRequest Request) : IRequest<ValidationResult?>;
