using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetItemsQuery() : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemByIdQuery(string Id) : IRequest<ItemResponse?>;
public record CreateItemCommand(CreateItemRequest Request) : IRequest<bool>;
public record UpdateItemCommand(string Id, UpdateItemRequest Request) : IRequest<bool>;
public record DeleteItemCommand(string Id) : IRequest<bool>;

public class GetItemsHandler(IItemRepository itemRepository) : IRequestHandler<GetItemsQuery, IReadOnlyCollection<ItemResponse>>
{
    public async Task<IReadOnlyCollection<ItemResponse>> Handle(GetItemsQuery request, CancellationToken cancellationToken) =>
        (await itemRepository.GetAllAsync(cancellationToken)).Select(entity => entity.ToResponse()).ToArray();
}

public class GetItemByIdHandler(IItemRepository itemRepository) : IRequestHandler<GetItemByIdQuery, ItemResponse?>
{
    public async Task<ItemResponse?> Handle(GetItemByIdQuery request, CancellationToken cancellationToken) =>
        (await itemRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}

public class CreateItemHandler(IItemRepository itemRepository) : IRequestHandler<CreateItemCommand, bool>
{
    public async Task<bool> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        await itemRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}

public class UpdateItemHandler(IItemRepository itemRepository) : IRequestHandler<UpdateItemCommand, bool>
{
    public async Task<bool> Handle(UpdateItemCommand request, CancellationToken cancellationToken)
    {
        var entity = await itemRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await itemRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}

public class DeleteItemHandler(IItemRepository itemRepository) : IRequestHandler<DeleteItemCommand, bool>
{
    public async Task<bool> Handle(DeleteItemCommand request, CancellationToken cancellationToken) =>
        await itemRepository.DeleteAsync(request.Id, cancellationToken);
}
