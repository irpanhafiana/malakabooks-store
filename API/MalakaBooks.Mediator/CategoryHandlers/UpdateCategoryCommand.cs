using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record UpdateCategoryCommand(string Id, UpdateCategoryRequest Request) : IRequest<bool>;
