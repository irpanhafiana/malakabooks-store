using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<CategoryResponse>;
