using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetItemsQuery() : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemByIdQuery(string Id) : IRequest<ItemResponse?>;
public record CreateItemCommand(CreateItemRequest Request) : IRequest<bool>;
public record UpdateItemCommand(string Id, UpdateItemRequest Request) : IRequest<bool>;
public record SyncItemCommand(SyncItemRequest Request) : IRequest<bool>;
public record DeleteItemCommand(string Id) : IRequest<bool>;

public class GetItemsHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<GetItemsQuery, IReadOnlyCollection<ItemResponse>>
{
    public async Task<IReadOnlyCollection<ItemResponse>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        var items = await itemRepository.GetAllAsync(cancellationToken);
        var uomGroups = await uomGroupRepository.GetAllAsync(cancellationToken);
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);

        return items
            .Select(entity => entity.ToResponse(uomGroupsById.GetValueOrDefault(entity.UomGroupId ?? string.Empty)))
            .ToArray();
    }
}

public class GetItemByIdHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<GetItemByIdQuery, ItemResponse?>
{
    public async Task<ItemResponse?> Handle(GetItemByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await itemRepository.GetByIdAsync(request.Id, cancellationToken);
        if (item is null)
        {
            return null;
        }

        var uomGroup = string.IsNullOrWhiteSpace(item.UomGroupId)
            ? null
            : await uomGroupRepository.GetByIdAsync(item.UomGroupId, cancellationToken);

        return item.ToResponse(uomGroup);
    }
}

public class CreateItemHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<CreateItemCommand, bool>
{
    public async Task<bool> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        entity.UomGroupId = await ResolveUomGroupIdAsync(request.Request, cancellationToken);
        if (string.IsNullOrWhiteSpace(entity.BaseUomCode) && request.Request.UomGroup is not null)
        {
            entity.BaseUomCode = request.Request.UomGroup.ResolveBaseUomCode();
        }

        await itemRepository.CreateAsync(entity, cancellationToken);
        return true;
    }

    private async Task<string?> ResolveUomGroupIdAsync(CreateItemRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasEmbeddedUomGroup())
        {
            return string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim();
        }

        var uomGroup = await uomGroupRepository.UpsertByDefinitionAsync(request.UomGroup!.ToEntity(), cancellationToken);
        return uomGroup.Id;
    }
}

public class UpdateItemHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<UpdateItemCommand, bool>
{
    public async Task<bool> Handle(UpdateItemCommand request, CancellationToken cancellationToken)
    {
        var entity = await itemRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        entity.UomGroupId = await ResolveUomGroupIdAsync(request.Request, cancellationToken);
        if (string.IsNullOrWhiteSpace(entity.BaseUomCode) && request.Request.UomGroup is not null)
        {
            entity.BaseUomCode = request.Request.UomGroup.ResolveBaseUomCode();
        }

        return await itemRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }

    private async Task<string?> ResolveUomGroupIdAsync(UpdateItemRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasEmbeddedUomGroup())
        {
            return string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim();
        }

        var uomGroup = await uomGroupRepository.UpsertByDefinitionAsync(request.UomGroup!.ToEntity(), cancellationToken);
        return uomGroup.Id;
    }
}

public class SyncItemHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<SyncItemCommand, bool>
{
    public async Task<bool> Handle(SyncItemCommand request, CancellationToken cancellationToken)
    {
        var existingItem = await itemRepository.GetBySapCodeAsync(request.Request.SAPCode.Trim(), cancellationToken);
        if (existingItem is null)
        {
            var createRequest = request.Request.ToCreateItemRequest();
            var entity = createRequest.ToEntity();
            entity.UomGroupId = await ResolveUomGroupIdAsync(createRequest, cancellationToken);
            if (string.IsNullOrWhiteSpace(entity.BaseUomCode))
            {
                entity.BaseUomCode = createRequest.UomGroup.ResolveBaseUomCode();
            }

            await itemRepository.CreateAsync(entity, cancellationToken);
            return true;
        }

        var updateRequest = request.Request.ToUpdateItemRequest();
        existingItem.UpdateFrom(updateRequest);
        existingItem.UomGroupId = await ResolveUomGroupIdAsync(updateRequest, cancellationToken);
        if (string.IsNullOrWhiteSpace(existingItem.BaseUomCode))
        {
            existingItem.BaseUomCode = updateRequest.UomGroup.ResolveBaseUomCode();
        }

        return await itemRepository.UpdateAsync(existingItem.Id!, existingItem, cancellationToken);
    }

    private async Task<string?> ResolveUomGroupIdAsync(CreateItemRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasEmbeddedUomGroup())
        {
            return string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim();
        }

        var uomGroup = await uomGroupRepository.UpsertByDefinitionAsync(request.UomGroup!.ToEntity(), cancellationToken);
        return uomGroup.Id;
    }
}

public class DeleteItemHandler(IItemRepository itemRepository) : IRequestHandler<DeleteItemCommand, bool>
{
    public async Task<bool> Handle(DeleteItemCommand request, CancellationToken cancellationToken) =>
        await itemRepository.DeleteAsync(request.Id, cancellationToken);
}
