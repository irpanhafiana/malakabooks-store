using MalakaBooks.ConfigSetting;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetItemsQuery() : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemsByTypeQuery(string ItemType) : IRequest<IReadOnlyCollection<ItemResponse>>;
public record GetItemByIdQuery(string Id) : IRequest<ItemResponse?>;
public record GetPublicPricedItemsQuery(string? ItemType = null) : IRequest<IReadOnlyCollection<PricedItemResponse>>;
public record GetCustomerPricedItemsQuery(string? ItemType = null) : IRequest<IReadOnlyCollection<PricedItemResponse>>;
public record GetItemAutofillQuery(string? SearchTerm = null) : IRequest<IReadOnlyCollection<ItemAutofillResponse>>;
public record GetPublicPricedItemByIdQuery(string Id) : IRequest<PricedItemResponse?>;
public record GetCustomerPricedItemByIdQuery(string Id) : IRequest<PricedItemResponse?>;
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
        
        var uomGroupIds = items.Select(x => x.UomGroupId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var uomGroups = uomGroupIds.Count > 0 ? await uomGroupRepository.GetByIdsAsync(uomGroupIds, cancellationToken) : [];

        var itemIds = items.Select(x => x.Id).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var books = itemIds.Count > 0 ? await bookRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];

        var authorIds = books.SelectMany(x => x.AuthorIds ?? []).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var authors = authorIds.Count > 0 ? await authorRepository.GetByIdsAsync(authorIds, cancellationToken) : [];
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
        
        var uomGroupIds = items.Select(x => x.UomGroupId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var uomGroups = uomGroupIds.Count > 0 ? await uomGroupRepository.GetByIdsAsync(uomGroupIds, cancellationToken) : [];

        var itemIds = items.Select(x => x.Id).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var books = itemIds.Count > 0 ? await bookRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];

        var authorIds = books.SelectMany(x => x.AuthorIds ?? []).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var authors = authorIds.Count > 0 ? await authorRepository.GetByIdsAsync(authorIds, cancellationToken) : [];
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
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetPublicPricedItemsQuery, IReadOnlyCollection<PricedItemResponse>>
{
    private readonly string _defaultCustomerGroupCode = appOptions.Value.PricingSetting?.DefaultPublicCustomerGroupCode?.Trim() ?? string.Empty;
    private readonly string _secondaryCustomerGroupCode = appOptions.Value.PricingSetting?.SecondaryPublicCustomerGroupCode?.Trim() ?? string.Empty;

    public async Task<IReadOnlyCollection<PricedItemResponse>> Handle(GetPublicPricedItemsQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            orderRepository,
            reviewRepository,
            request.ItemType,
            _defaultCustomerGroupCode,
            _secondaryCustomerGroupCode,
            cancellationToken);
    }
}

public class GetCustomerPricedItemsHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IPricingRepository pricingRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository,
    IHttpContextAccessor httpContextAccessor,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetCustomerPricedItemsQuery, IReadOnlyCollection<PricedItemResponse>>
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly string _secondaryCustomerGroupCode = appOptions.Value.PricingSetting?.SecondaryCustomerGroupCode?.Trim() ?? string.Empty;

    public async Task<IReadOnlyCollection<PricedItemResponse>> Handle(GetCustomerPricedItemsQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            orderRepository,
            reviewRepository,
            request.ItemType,
            ResolveCustomerGroupCode(),
            _secondaryCustomerGroupCode,
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
        IOrderRepository orderRepository,
        IReviewRepository reviewRepository,
        string? itemType,
        string customerGroupCode,
        string secondaryCustomerGroupCode,
        CancellationToken cancellationToken)
    {
        var items = string.IsNullOrWhiteSpace(itemType)
            ? await itemRepository.GetAllAsync(cancellationToken)
            : await itemRepository.GetByItemTypeAsync(itemType, cancellationToken);

        var itemList = items.ToArray();
        
        var uomGroupIds = itemList.Select(x => x.UomGroupId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var uomGroups = uomGroupIds.Count > 0 ? await uomGroupRepository.GetByIdsAsync(uomGroupIds, cancellationToken) : [];

        var itemIds = itemList
            .Where(item => !string.IsNullOrWhiteSpace(item.Id))
            .Select(item => item.Id!)
            .ToArray();

        var books = itemIds.Length > 0 ? await bookRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];

        var authorIds = books.SelectMany(x => x.AuthorIds ?? []).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Cast<string>().ToList();
        var authors = authorIds.Count > 0 ? await authorRepository.GetByIdsAsync(authorIds, cancellationToken) : [];
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);
        var booksByItemId = books
            .Where(book => !string.IsNullOrWhiteSpace(book.ItemId))
            .ToDictionary(book => book.ItemId, book => book, StringComparer.Ordinal);
        var authorsById = authors
            .Where(author => !string.IsNullOrWhiteSpace(author.Id))
            .ToDictionary(author => author.Id!, author => author, StringComparer.Ordinal);

        var pricings = string.IsNullOrWhiteSpace(customerGroupCode)
            ? []
            : await pricingRepository.GetActiveByItemIdsAsync(itemIds, DateTime.UtcNow, cancellationToken);

        var pricingByItemId = pricings
            .GroupBy(pricing => pricing.ItemId)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.Ordinal);

        var orders = itemIds.Length > 0 ? await orderRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];
        var reviews = itemIds.Length > 0 ? await reviewRepository.GetByItemIdsAsync(itemIds, cancellationToken) : [];

        var quantitySoldByItemId = orders
            .Where(order => string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            .SelectMany(order => order.Items)
            .Where(item => !string.IsNullOrWhiteSpace(item.ItemId))
            .GroupBy(item => item.ItemId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity), StringComparer.OrdinalIgnoreCase);

        var ratingByItemId = reviews
            .Where(review => !string.IsNullOrWhiteSpace(review.ItemId))
            .GroupBy(review => review.ItemId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Rating = group.Average(review => (double)review.Rating),
                    TotalReviews = group.Count()
                },
                StringComparer.OrdinalIgnoreCase);

        return itemList
            .Select(item =>
            {
                var response = ToPricedResponse(
                    item,
                    uomGroupsById.GetValueOrDefault(item.UomGroupId ?? string.Empty),
                    pricingByItemId,
                    customerGroupCode,
                    secondaryCustomerGroupCode,
                    ItemMetadataResolver.Resolve(item, booksByItemId, authorsById));

                if (!string.IsNullOrWhiteSpace(item.Id) && quantitySoldByItemId.TryGetValue(item.Id, out var quantitySold))
                {
                    response.QuantitySold = quantitySold;
                }

                if (!string.IsNullOrWhiteSpace(item.Id) && ratingByItemId.TryGetValue(item.Id, out var rating))
                {
                    response.Rating = rating.Rating;
                    response.AverageRating = rating.Rating;
                    response.TotalReviews = rating.TotalReviews;
                }

                return response;
            })
            .ToArray();
    }

    internal static async Task<PricedItemResponse?> ResolveSingleAsync(
        IItemRepository itemRepository,
        IUomGroupRepository uomGroupRepository,
        IBookRepository bookRepository,
        IAuthorRepository authorRepository,
        IPricingRepository pricingRepository,
        IOrderRepository orderRepository,
        IReviewRepository reviewRepository,
        string itemId,
        string customerGroupCode,
        string secondaryCustomerGroupCode,
        CancellationToken cancellationToken)
    {
        var item = await itemRepository.GetByIdAsync(itemId, cancellationToken);
        if (item is null)
        {
            return null;
        }

        var uomGroupIds = !string.IsNullOrWhiteSpace(item.UomGroupId) ? [item.UomGroupId] : Array.Empty<string>();
        var uomGroups = uomGroupIds.Length > 0 ? await uomGroupRepository.GetByIdsAsync(uomGroupIds, cancellationToken) : [];

        var book = await bookRepository.GetByItemIdAsync(itemId, cancellationToken);
        var booksByItemId = book is not null ? new Dictionary<string, Entity.BookEntity> { { itemId, book } } : new Dictionary<string, Entity.BookEntity>();

        var authorIds = book?.AuthorIds?.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToArray() ?? [];
        var authors = authorIds.Length > 0 ? await authorRepository.GetByIdsAsync(authorIds, cancellationToken) : [];
        var uomGroupsById = uomGroups
            .Where(group => !string.IsNullOrWhiteSpace(group.Id))
            .ToDictionary(group => group.Id!, group => group);
        var authorsById = authors
            .Where(author => !string.IsNullOrWhiteSpace(author.Id))
            .ToDictionary(author => author.Id!, author => author, StringComparer.Ordinal);

        var pricings = string.IsNullOrWhiteSpace(customerGroupCode)
            ? []
            : await pricingRepository.GetActiveByItemIdsAsync([itemId], DateTime.UtcNow, cancellationToken);

        var pricingByItemId = pricings
            .GroupBy(pricing => pricing.ItemId)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.Ordinal);

        var response = ToPricedResponse(
            item,
            uomGroupsById.GetValueOrDefault(item.UomGroupId ?? string.Empty),
            pricingByItemId,
            customerGroupCode,
            secondaryCustomerGroupCode,
            ItemMetadataResolver.Resolve(item, booksByItemId, authorsById));

        var orders = await orderRepository.GetByItemIdsAsync([itemId], cancellationToken);
        var reviews = await reviewRepository.GetByItemIdsAsync([itemId], cancellationToken);

        var quantitySold = orders
            .Where(order => string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            .SelectMany(order => order.Items)
            .Where(orderItem => string.Equals(orderItem.ItemId, itemId, StringComparison.OrdinalIgnoreCase))
            .Sum(orderItem => orderItem.Quantity);

        var itemReviews = reviews.Where(review => string.Equals(review.ItemId, itemId, StringComparison.OrdinalIgnoreCase)).ToArray();
        
        response.QuantitySold = quantitySold;
        if (itemReviews.Length > 0)
        {
            var rating = itemReviews.Average(review => (double)review.Rating);
            response.Rating = rating;
            response.AverageRating = rating;
            response.TotalReviews = itemReviews.Length;
        }

        return response;
    }

    private static PricedItemResponse ToPricedResponse(
        Entity.ItemEntity item,
        Entity.UomGroupEntity? uomGroup,
        IReadOnlyDictionary<string, Entity.PricingEntity[]> pricingByItemId,
        string customerGroupCode,
        string secondaryCustomerGroupCode,
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

        // Resolve secondary / compare-at price using secondary pricing group if provided
        if (!string.IsNullOrWhiteSpace(secondaryCustomerGroupCode))
        {
            var compareDetail = pricingByItemId.TryGetValue(item.Id, out var itemP) ?
                itemP.SelectMany(pr => pr.Details.Select(d => new { Pricing = pr, Detail = d }))
                    .FirstOrDefault(entry => string.Equals(entry.Detail.CustomerGroupCode, secondaryCustomerGroupCode, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(entry.Detail.UomCode, response.SalesUomCode, StringComparison.OrdinalIgnoreCase))
                : null;

            if (compareDetail is not null)
            {
                response.CompareAtPrice = compareDetail.Detail.Price;
                response.CompareAtPriceStartDate = compareDetail.Pricing.StartDate;
                response.CompareAtPriceEndDate = compareDetail.Pricing.EndDate;
            }
            else
            {
                response.CompareAtPrice = response.Price;
                response.CompareAtPriceStartDate = response.PriceStartDate;
                response.CompareAtPriceEndDate = response.PriceEndDate;
            }
        }
        else
        {
            response.CompareAtPrice = response.Price;
            response.CompareAtPriceStartDate = response.PriceStartDate;
            response.CompareAtPriceEndDate = response.PriceEndDate;
        }

        return response;
    }

    private static string GetSecondaryPricingGroupCode()
    {
        // read from config once per invocation via static access to AppSetting is not available here;
        // default behavior: read appsetting from configuration via environment variable/provider is not available in this static helper.
        // Instead, read from the AppSetting through Options is the preferred approach but would require refactoring the resolver to accept IOptions<AppSetting>.
        // For now, return empty so controllers/handlers that pass customerGroupCode can optionally call a different overload.
        return string.Empty;
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

public class GetItemAutofillHandler(IItemRepository itemRepository) : IRequestHandler<GetItemAutofillQuery, IReadOnlyCollection<ItemAutofillResponse>>
{
    public async Task<IReadOnlyCollection<ItemAutofillResponse>> Handle(GetItemAutofillQuery request, CancellationToken cancellationToken)
    {
        var items = await itemRepository.SearchAsync(request.SearchTerm ?? string.Empty, cancellationToken);
        return items.Select(x => new ItemAutofillResponse { Id = x.Id ?? string.Empty, Name = x.Name }).ToArray();
    }
}

public class GetPublicPricedItemByIdHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IPricingRepository pricingRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetPublicPricedItemByIdQuery, PricedItemResponse?>
{
    private readonly string _defaultCustomerGroupCode = appOptions.Value.PricingSetting?.DefaultPublicCustomerGroupCode?.Trim() ?? string.Empty;
    private readonly string _secondaryCustomerGroupCode = appOptions.Value.PricingSetting?.SecondaryPublicCustomerGroupCode?.Trim() ?? string.Empty;

    public async Task<PricedItemResponse?> Handle(GetPublicPricedItemByIdQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveSingleAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            orderRepository,
            reviewRepository,
            request.Id,
            _defaultCustomerGroupCode,
            _secondaryCustomerGroupCode,
            cancellationToken);
    }
}

public class GetCustomerPricedItemByIdHandler(
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IBookRepository bookRepository,
    IAuthorRepository authorRepository,
    IPricingRepository pricingRepository,
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository,
    IHttpContextAccessor httpContextAccessor,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetCustomerPricedItemByIdQuery, PricedItemResponse?>
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly string _secondaryCustomerGroupCode = appOptions.Value.PricingSetting?.SecondaryCustomerGroupCode?.Trim() ?? string.Empty;

    public async Task<PricedItemResponse?> Handle(GetCustomerPricedItemByIdQuery request, CancellationToken cancellationToken)
    {
        return await PricedItemResolver.ResolveSingleAsync(
            itemRepository,
            uomGroupRepository,
            bookRepository,
            authorRepository,
            pricingRepository,
            orderRepository,
            reviewRepository,
            request.Id,
            ResolveCustomerGroupCode(),
            _secondaryCustomerGroupCode,
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
