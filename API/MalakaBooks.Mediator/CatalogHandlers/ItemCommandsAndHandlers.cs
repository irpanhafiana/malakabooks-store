using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MalakaBooks.ConfigSetting;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetItemsQuery() : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemsByTypeQuery(string ItemType) : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemByIdQuery(string Id) : IRequest<ItemResponse?>;
public record GetPublicPricedItemsQuery(string? ItemType = null) : IRequest<IReadOnlyCollection<PricedItemResponse>>;
public record GetCustomerPricedItemsQuery(string? ItemType = null) : IRequest<IReadOnlyCollection<PricedItemResponse>>;
public record CreateItemCommand(CreateItemRequest Request) : IRequest<ItemResponse>;
public record UpdateItemCommand(string Id, UpdateItemRequest Request) : IRequest<bool>;
public record SyncItemCommand(SyncItemRequest Request) : IRequest<bool>;
public record DeleteItemCommand(string Id) : IRequest<bool>;

internal static class ItemMetadataResolver
{
    internal static ItemMetadataResponse? Resolve(
        Entity.ItemEntity item,
        IReadOnlyDictionary<string, Entity.BookEntity> booksByItemId,
        IReadOnlyDictionary<string, Entity.AuthorEntity> authorsById)
    {
        if (string.IsNullOrWhiteSpace(item.Id) || !booksByItemId.TryGetValue(item.Id, out var book))
        {
            return null;
        }

        var authors = book.AuthorIds
            .Where(authorId => !string.IsNullOrWhiteSpace(authorId))
            .Select(authorId => authorsById.GetValueOrDefault(authorId))
            .Where(author => author is not null)
            .Cast<Entity.AuthorEntity>()
            .ToArray();

        return book.ToMetadataResponse(authors);
    }

    internal static async Task<IReadOnlyCollection<Entity.AuthorEntity>> ResolveAuthorsAsync(
        IEnumerable<string> authorIds,
        IAuthorRepository authorRepository,
        CancellationToken cancellationToken)
    {
        var authors = new List<Entity.AuthorEntity>();

        foreach (var authorId in authorIds.Where(authorId => !string.IsNullOrWhiteSpace(authorId)))
        {
            var author = await authorRepository.GetByIdAsync(authorId, cancellationToken);
            if (author is not null)
            {
                authors.Add(author);
            }
        }

        return authors;
    }
}

public class GetItemsHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository) : IRequestHandler<GetItemsQuery, IReadOnlyCollection<ItemResponse>>
{
    public async Task<IReadOnlyCollection<ItemResponse>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        var items = await itemRepository.GetAllAsync(cancellationToken);
        var uomGroups = await uomGroupRepository.GetAllAsync(cancellationToken);
        var books = await bookRepository.GetAllAsync(cancellationToken);
        var authors = await authorRepository.GetAllAsync(cancellationToken);
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);
        var booksByItemId = books
            .Where(book => !string.IsNullOrWhiteSpace(book.ItemId))
            .ToDictionary(book => book.ItemId, book => book, StringComparer.Ordinal);
        var authorsById = authors
            .Where(author => !string.IsNullOrWhiteSpace(author.Id))
            .ToDictionary(author => author.Id!, author => author, StringComparer.Ordinal);

        return items
            .Select(entity => entity.ToResponse(
                uomGroupsById.GetValueOrDefault(entity.UomGroupId ?? string.Empty),
                ItemMetadataResolver.Resolve(entity, booksByItemId, authorsById)))
            .ToArray();
    }
}

public class GetItemsByTypeHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository) : IRequestHandler<GetItemsByTypeQuery, IReadOnlyCollection<ItemResponse>>
{
    public async Task<IReadOnlyCollection<ItemResponse>> Handle(GetItemsByTypeQuery request, CancellationToken cancellationToken)
    {
        var items = await itemRepository.GetByItemTypeAsync(request.ItemType, cancellationToken);
        var uomGroups = await uomGroupRepository.GetAllAsync(cancellationToken);
        var books = await bookRepository.GetAllAsync(cancellationToken);
        var authors = await authorRepository.GetAllAsync(cancellationToken);
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);
        var booksByItemId = books
            .Where(book => !string.IsNullOrWhiteSpace(book.ItemId))
            .ToDictionary(book => book.ItemId, book => book, StringComparer.Ordinal);
        var authorsById = authors
            .Where(author => !string.IsNullOrWhiteSpace(author.Id))
            .ToDictionary(author => author.Id!, author => author, StringComparer.Ordinal);

        return items
            .Select(entity => entity.ToResponse(
                uomGroupsById.GetValueOrDefault(entity.UomGroupId ?? string.Empty),
                ItemMetadataResolver.Resolve(entity, booksByItemId, authorsById)))
            .ToArray();
    }
}

public class GetItemByIdHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository) : IRequestHandler<GetItemByIdQuery, ItemResponse?>
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
        var book = string.IsNullOrWhiteSpace(item.Id)
            ? null
            : await bookRepository.GetByItemIdAsync(item.Id, cancellationToken);

        ItemMetadataResponse? metadata = null;
        if (book is not null)
        {
            var authors = await ItemMetadataResolver.ResolveAuthorsAsync(book.AuthorIds, authorRepository, cancellationToken);
            metadata = book.ToMetadataResponse(authors);
        }

        return item.ToResponse(uomGroup, metadata);
    }
}

public class GetPublicPricedItemsHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IPricingRepository pricingRepository,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetPublicPricedItemsQuery, IReadOnlyCollection<PricedItemResponse>>
{
    private readonly string _defaultCustomerGroupCode = appOptions.Value.PricingSetting?.DefaultPublicCustomerGroupCode?.Trim() ?? string.Empty;

    public async Task<IReadOnlyCollection<PricedItemResponse>> Handle(GetPublicPricedItemsQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            request.ItemType,
            _defaultCustomerGroupCode,
            cancellationToken);
    }
}

public class GetCustomerPricedItemsHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IPricingRepository pricingRepository,
    IHttpContextAccessor httpContextAccessor) : IRequestHandler<GetCustomerPricedItemsQuery, IReadOnlyCollection<PricedItemResponse>>
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<IReadOnlyCollection<PricedItemResponse>> Handle(GetCustomerPricedItemsQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            request.ItemType,
            ResolveCustomerGroupCode(),
            cancellationToken);
    }

    private string ResolveCustomerGroupCode()
    {
        var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
        if (claimsPrincipal is null)
        {
            return string.Empty;
        }

        return claimsPrincipal.Claims
            .FirstOrDefault(claim => string.Equals(claim.Type, "customer_group", StringComparison.OrdinalIgnoreCase))
            ?.Value?.Trim() ?? string.Empty;
    }
}

internal static class PricedItemResolver
{
    internal static async Task<IReadOnlyCollection<PricedItemResponse>> ResolveAsync(
        IItemRepository itemRepository,
        IUomGroupRepository uomGroupRepository,
        IBookRepository bookRepository,
        IAuthorRepository authorRepository,
        IPricingRepository pricingRepository,
        string? itemType,
        string customerGroupCode,
        CancellationToken cancellationToken)
    {
        var items = string.IsNullOrWhiteSpace(itemType)
            ? await itemRepository.GetAllAsync(cancellationToken)
            : await itemRepository.GetByItemTypeAsync(itemType, cancellationToken);

        var itemList = items.ToArray();
        var uomGroups = await uomGroupRepository.GetAllAsync(cancellationToken);
        var books = await bookRepository.GetAllAsync(cancellationToken);
        var authors = await authorRepository.GetAllAsync(cancellationToken);
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);
        var booksByItemId = books
            .Where(book => !string.IsNullOrWhiteSpace(book.ItemId))
            .ToDictionary(book => book.ItemId, book => book, StringComparer.Ordinal);
        var authorsById = authors
            .Where(author => !string.IsNullOrWhiteSpace(author.Id))
            .ToDictionary(author => author.Id!, author => author, StringComparer.Ordinal);

        var itemIds = itemList
            .Where(item => !string.IsNullOrWhiteSpace(item.Id))
            .Select(item => item.Id!)
            .ToArray();

        var pricings = string.IsNullOrWhiteSpace(customerGroupCode)
            ? []
            : await pricingRepository.GetActiveByItemIdsAsync(itemIds, DateTime.UtcNow, cancellationToken);

        var pricingByItemId = pricings
            .GroupBy(pricing => pricing.ItemId)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.Ordinal);

        return itemList
            .Select(item => ToPricedResponse(
                item,
                uomGroupsById.GetValueOrDefault(item.UomGroupId ?? string.Empty),
                pricingByItemId,
                customerGroupCode,
                ItemMetadataResolver.Resolve(item, booksByItemId, authorsById)))
            .ToArray();
    }

    private static PricedItemResponse ToPricedResponse(
        Entity.ItemEntity item,
        Entity.UomGroupEntity? uomGroup,
        IReadOnlyDictionary<string, Entity.PricingEntity[]> pricingByItemId,
        string customerGroupCode,
        ItemMetadataResponse? metadata)
    {
        var baseResponse = item.ToResponse(uomGroup, metadata);
        var response = new PricedItemResponse
        {
            Id = baseResponse.Id,
            Name = baseResponse.Name,
            SAPCode = baseResponse.SAPCode,
            ItemType = baseResponse.ItemType,
            CategoryId = baseResponse.CategoryId,
            CoverImage = baseResponse.CoverImage,
            AdditionalImages = baseResponse.AdditionalImages,
            UomGroupId = baseResponse.UomGroupId,
            UomGroup = baseResponse.UomGroup,
            BaseUomCode = baseResponse.BaseUomCode,
            Description = baseResponse.Description,
            Weight = baseResponse.Weight,
            Stock = baseResponse.Stock,
            IsActive = baseResponse.IsActive,
            Metadata = baseResponse.Metadata,
            CreatedAt = baseResponse.CreatedAt,
            UpdatedAt = baseResponse.UpdatedAt,
            CustomerGroupCode = customerGroupCode
        };

        if (string.IsNullOrWhiteSpace(item.Id) || string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return response;
        }

        if (!pricingByItemId.TryGetValue(item.Id, out var itemPricings))
        {
            return response;
        }

        var pricedDetails = itemPricings
            .SelectMany(pricing => pricing.Details.Select(detail => new { Pricing = pricing, Detail = detail }))
            .Where(entry => string.Equals(entry.Detail.CustomerGroupCode, customerGroupCode, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        if (pricedDetails.Length == 0)
        {
            return response;
        }

        var defaultSalesDetail = uomGroup?.Details
            .FirstOrDefault(detail => detail.IsActive && detail.IsDefaultForSales);

        var selected = defaultSalesDetail is null
            ? null
            : pricedDetails.FirstOrDefault(entry => string.Equals(entry.Detail.UomCode, defaultSalesDetail.Code, StringComparison.OrdinalIgnoreCase));

        selected ??= pricedDetails.FirstOrDefault(entry =>
            uomGroup?.Details.Any(detail =>
                detail.IsActive
                && string.Equals(detail.Code, entry.Detail.UomCode, StringComparison.OrdinalIgnoreCase)) == true);

        selected ??= pricedDetails.First();

        response.SalesUomCode = selected.Detail.UomCode;
        response.Price = selected.Detail.Price;
        response.PriceStartDate = selected.Pricing.StartDate;
        response.PriceEndDate = selected.Pricing.EndDate;

        return response;
    }
}

public class CreateItemHandler(IItemRepository itemRepository, IUomGroupRepository uomGroupRepository) : IRequestHandler<CreateItemCommand, ItemResponse>
{
    public async Task<ItemResponse> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        var uomGroup = await ResolveUomGroupAsync(request.Request, cancellationToken);
        entity.UomGroupId = uomGroup?.Id;

        if (uomGroup is null && !string.IsNullOrWhiteSpace(request.Request.UomGroupId))
        {
            uomGroup = await uomGroupRepository.GetByIdAsync(request.Request.UomGroupId.Trim(), cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(entity.BaseUomCode) && request.Request.UomGroup is not null)
        {
            entity.BaseUomCode = request.Request.UomGroup.ResolveBaseUomCode();
        }

        var createdItem = await itemRepository.CreateAsync(entity, cancellationToken);
        return createdItem.ToResponse(uomGroup);
    }

    private async Task<Entity.UomGroupEntity?> ResolveUomGroupAsync(CreateItemRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasEmbeddedUomGroup())
        {
            return null;
        }

        return await uomGroupRepository.UpsertByDefinitionAsync(request.UomGroup!.ToEntity(), cancellationToken);
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
