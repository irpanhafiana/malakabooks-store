using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public record DeleteCategoryCommand(string Id) : IRequest<bool>;
