using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record GetCategoriesQuery(string? ItemType = null) : IRequest<IReadOnlyCollection<CategoryResponse>>;
