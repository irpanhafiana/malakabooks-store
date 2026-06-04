using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record GetCategoryByIdQuery(string Id) : IRequest<CategoryResponse?>;
