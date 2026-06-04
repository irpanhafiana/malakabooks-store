using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record GetCategoriesQuery() : IRequest<IReadOnlyCollection<CategoryResponse>>;
