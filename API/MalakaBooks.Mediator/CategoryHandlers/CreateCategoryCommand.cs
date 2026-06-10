using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<ValidationResult?>;
