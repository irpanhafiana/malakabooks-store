using MalakaBooks.ConfigSetting;
using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetPricingsQuery() : IRequest<IReadOnlyCollection<PricingResponse>>;
public record GetPricingByIdQuery(string Id) : IRequest<PricingResponse?>;
public record GetPublicPriceQuery(PublicPriceLookupRequest Request) : IRequest<PublicPriceLookupResponse?>;
public record GetCustomerPriceQuery(CustomerPriceLookupRequest Request) : IRequest<PublicPriceLookupResponse?>;
public record CreatePricingCommand(CreatePricingRequest Request) : IRequest<CreatePricingResponse>;
public record UpdatePricingCommand(string Id, UpdatePricingRequest Request) : IRequest<CreatePricingResponse>;
public record DeletePricingCommand(string Id) : IRequest<CreatePricingResponse>;

public class GetPricingsHandler(IPricingRepository pricingRepository) : IRequestHandler<GetPricingsQuery, IReadOnlyCollection<PricingResponse>>
{
    public async Task<IReadOnlyCollection<PricingResponse>> Handle(GetPricingsQuery request, CancellationToken cancellationToken) =>
        (await pricingRepository.GetAllAsync(cancellationToken)).Select(entity => entity.ToResponse()).ToArray();
}

public class GetPricingByIdHandler(IPricingRepository pricingRepository) : IRequestHandler<GetPricingByIdQuery, PricingResponse?>
{
    public async Task<PricingResponse?> Handle(GetPricingByIdQuery request, CancellationToken cancellationToken) =>
        (await pricingRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}

public class GetPublicPriceHandler(
    IPricingRepository pricingRepository,
    IItemRepository itemRepository,
    IOptions<AppSetting> appOptions) : IRequestHandler<GetPublicPriceQuery, PublicPriceLookupResponse?>
{
    private readonly AppSetting _appSetting = appOptions.Value;
    private readonly IPricingRepository _pricingRepository = pricingRepository;
    private readonly IItemRepository _itemRepository = itemRepository;

    public async Task<PublicPriceLookupResponse?> Handle(GetPublicPriceQuery request, CancellationToken cancellationToken)
    {
        var customerGroupCode = _appSetting.PricingSetting?.DefaultPublicCustomerGroupCode ?? string.Empty;

        if (string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return null;
        }

        return await PricingLookupHelper.ResolvePriceAsync(_pricingRepository, _itemRepository, request.Request.ItemId, request.Request.UomCode, customerGroupCode, cancellationToken);
    }
}

public class GetCustomerPriceHandler(
    IPricingRepository pricingRepository,
    IItemRepository itemRepository,
    IHttpContextAccessor httpContextAccessor) : IRequestHandler<GetCustomerPriceQuery, PublicPriceLookupResponse?>
{
    private readonly IPricingRepository _pricingRepository = pricingRepository;
    private readonly IItemRepository _itemRepository = itemRepository;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<PublicPriceLookupResponse?> Handle(GetCustomerPriceQuery request, CancellationToken cancellationToken)
    {
        var customerGroupCode = GetCustomerGroupCode();
        if (string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return null;
        }

        return await PricingLookupHelper.ResolvePriceAsync(_pricingRepository, _itemRepository, request.Request.ItemId, request.Request.UomCode, customerGroupCode, cancellationToken);
    }

    private string GetCustomerGroupCode()
    {
        var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
        if (claimsPrincipal is null)
        {
            return string.Empty;
        }

        string[] claimTypes = ["customer_group"];

        foreach (var claimType in claimTypes)
        {
            var value = claimsPrincipal.Claims
                .FirstOrDefault(claim => string.Equals(claim.Type, claimType, StringComparison.OrdinalIgnoreCase))
                ?.Value;

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }
}

internal static class PricingLookupHelper
{
    internal static async Task<PublicPriceLookupResponse?> ResolvePriceAsync(
        IPricingRepository pricingRepository,
        IItemRepository itemRepository,
        string itemId,
        string uomCode,
        string customerGroupCode,
        CancellationToken cancellationToken)
    {
        var resolvedItemId = itemId;
        if (!string.IsNullOrWhiteSpace(itemId))
        {
            var item = await itemRepository.GetByIdAsync(itemId, cancellationToken)
                ?? await itemRepository.GetBySapCodeAsync(itemId, cancellationToken);

            if (item is not null)
            {
                resolvedItemId = item.Id ?? itemId;
            }
        }

        var pricings = await pricingRepository.GetActiveByItemIdAsync(resolvedItemId, DateTime.UtcNow, cancellationToken);
        var pricing = pricings.FirstOrDefault();
        var detail = pricing?.Details.FirstOrDefault(detail =>
            string.Equals(detail.CustomerGroupCode, customerGroupCode, StringComparison.OrdinalIgnoreCase)
            && string.Equals(detail.UomCode, uomCode, StringComparison.OrdinalIgnoreCase));

        if (pricing is null || detail is null)
        {
            return null;
        }

        return new PublicPriceLookupResponse
        {
            ItemId = resolvedItemId,
            UomCode = uomCode,
            CustomerGroupCode = customerGroupCode,
            Price = detail.Price,
            StartDate = pricing.StartDate,
            EndDate = pricing.EndDate
        };
    }
}

public class CreatePricingHandler(IPricingRepository pricingRepository, IItemRepository itemRepository) : IRequestHandler<CreatePricingCommand, CreatePricingResponse>
{
    public async Task<CreatePricingResponse> Handle(CreatePricingCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        entity.ItemId = await ResolveItemIdAsync(request.Request.ItemCode, cancellationToken);
        if (string.IsNullOrWhiteSpace(entity.ItemId))
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Item not found for provided item code.",
                Errors = new Dictionary<string, string> { ["1"] = "Item not found for provided item code." }
            };
        }

        var details = ResolvePricingDetails(request.Request.Details);
        if (details.Count == 0)
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Pricing details must contain at least one entry.",
                Errors = new Dictionary<string, string> { ["1"] = "Pricing details must contain at least one entry." }
            };
        }

        entity.Details = details;
        var created = await pricingRepository.CreateAsync(entity, cancellationToken);

        return new CreatePricingResponse
        {
            IsSuccess = true,
            Message = "OK",
            PricingId = created?.Id ?? string.Empty
        };
    }

    private List<PricingDetailEntity> ResolvePricingDetails(
        IEnumerable<PricingDetailRequest> requests)
    {
        var details = new List<PricingDetailEntity>();

        foreach (var detailRequest in requests)
        {
            details.Add(new PricingDetailEntity
            {
                CustomerGroupCode = detailRequest.CustomerGroupCode.Trim(),
                UomCode = detailRequest.UomCode.Trim(),
                Price = detailRequest.Price
            });
        }

        return details;
    }

    private async Task<string> ResolveItemIdAsync(string itemCode, CancellationToken cancellationToken)
    {
        var item = await itemRepository.GetBySapCodeAsync(itemCode.Trim(), cancellationToken);

        return item?.Id ?? string.Empty;
    }
}

public class UpdatePricingHandler(IPricingRepository pricingRepository, IItemRepository itemRepository) : IRequestHandler<UpdatePricingCommand, CreatePricingResponse>
{
    public async Task<CreatePricingResponse> Handle(UpdatePricingCommand request, CancellationToken cancellationToken)
    {
        var entity = await pricingRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Pricing not found.",
                Errors = new Dictionary<string, string> { ["1"] = "Pricing not found." }
            };
        }

        entity.UpdateFrom(request.Request);
        entity.ItemId = await ResolveItemIdAsync(request.Request.ItemCode, cancellationToken);
        if (string.IsNullOrWhiteSpace(entity.ItemId))
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Item not found for provided item code.",
                Errors = new Dictionary<string, string> { ["1"] = "Item not found for provided item code." }
            };
        }

        var details = ResolvePricingDetails(request.Request.Details);
        if (details.Count == 0)
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Pricing details must contain at least one entry.",
                Errors = new Dictionary<string, string> { ["1"] = "Pricing details must contain at least one entry." }
            };
        }

        entity.Details = details;
        var updated = await pricingRepository.UpdateAsync(request.Id, entity, cancellationToken);

        if (!updated)
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Failed to update pricing.",
                Errors = new Dictionary<string, string> { ["1"] = "Failed to update pricing." }
            };
        }

        return new CreatePricingResponse
        {
            IsSuccess = true,
            Message = "OK",
            PricingId = entity.Id ?? string.Empty
        };
    }

    private List<PricingDetailEntity> ResolvePricingDetails(
        IEnumerable<PricingDetailRequest> requests)
    {
        var details = new List<PricingDetailEntity>();

        foreach (var detailRequest in requests)
        {
            details.Add(new PricingDetailEntity
            {
                CustomerGroupCode = detailRequest.CustomerGroupCode.Trim(),
                UomCode = detailRequest.UomCode.Trim(),
                Price = detailRequest.Price
            });
        }

        return details;
    }

    private async Task<string> ResolveItemIdAsync(string itemCode, CancellationToken cancellationToken)
    {
        var item = await itemRepository.GetBySapCodeAsync(itemCode.Trim(), cancellationToken);

        return item?.Id ?? string.Empty;
    }
}

public class DeletePricingHandler(IPricingRepository pricingRepository) : IRequestHandler<DeletePricingCommand, CreatePricingResponse>
{
    public async Task<CreatePricingResponse> Handle(DeletePricingCommand request, CancellationToken cancellationToken)
    {
        var deleted = await pricingRepository.DeleteAsync(request.Id, cancellationToken);
        if (!deleted)
        {
            return new CreatePricingResponse
            {
                IsSuccess = false,
                Message = "Failed to delete pricing.",
                Errors = new Dictionary<string, string> { ["1"] = "Failed to delete pricing." }
            };
        }

        return new CreatePricingResponse
        {
            IsSuccess = true,
            Message = "OK",
            PricingId = request.Id
        };
    }
}
