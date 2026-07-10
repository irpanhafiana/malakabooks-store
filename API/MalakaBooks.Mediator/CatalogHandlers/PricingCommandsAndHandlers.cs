using MalakaBooks.ConfigSetting;
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
public record CreatePricingCommand(CreatePricingRequest Request) : IRequest<bool>;
public record UpdatePricingCommand(string Id, UpdatePricingRequest Request) : IRequest<bool>;
public record DeletePricingCommand(string Id) : IRequest<bool>;

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
    IOptions<AppSetting> appOptions) : IRequestHandler<GetPublicPriceQuery, PublicPriceLookupResponse?>
{
    private readonly AppSetting _appSetting = appOptions.Value;
    private readonly IPricingRepository _pricingRepository = pricingRepository;

    public async Task<PublicPriceLookupResponse?> Handle(GetPublicPriceQuery request, CancellationToken cancellationToken)
    {
        var customerGroupCode = _appSetting.PricingSetting?.DefaultPublicCustomerGroupCode ?? string.Empty;

        if (string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return null;
        }

        return await PricingLookupHelper.ResolvePriceAsync(_pricingRepository, request.Request.ItemId, request.Request.UomCode, customerGroupCode, cancellationToken);
    }
}

public class GetCustomerPriceHandler(
    IPricingRepository pricingRepository,
    IHttpContextAccessor httpContextAccessor) : IRequestHandler<GetCustomerPriceQuery, PublicPriceLookupResponse?>
{
    private readonly IPricingRepository _pricingRepository = pricingRepository;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<PublicPriceLookupResponse?> Handle(GetCustomerPriceQuery request, CancellationToken cancellationToken)
    {
        var customerGroupCode = GetCustomerGroupCode();
        if (string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return null;
        }

        return await PricingLookupHelper.ResolvePriceAsync(_pricingRepository, request.Request.ItemId, request.Request.UomCode, customerGroupCode, cancellationToken);
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
        string itemId,
        string uomCode,
        string customerGroupCode,
        CancellationToken cancellationToken)
    {
        var pricing = await pricingRepository.GetActiveByCustomerGroupCodeAsync(customerGroupCode, DateTime.UtcNow, cancellationToken);
        var detail = pricing?.Details.FirstOrDefault(detail =>
            string.Equals(detail.ItemId, itemId, StringComparison.OrdinalIgnoreCase)
            && string.Equals(detail.UomCode, uomCode, StringComparison.OrdinalIgnoreCase));

        if (pricing is null || detail is null)
        {
            return null;
        }

        return new PublicPriceLookupResponse
        {
            ItemId = itemId,
            UomCode = uomCode,
            CustomerGroupCode = customerGroupCode,
            Price = detail.Price,
            StartDate = pricing.StartDate,
            EndDate = pricing.EndDate
        };
    }
}

public class CreatePricingHandler(IPricingRepository pricingRepository) : IRequestHandler<CreatePricingCommand, bool>
{
    public async Task<bool> Handle(CreatePricingCommand request, CancellationToken cancellationToken)
    {
        await pricingRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}

public class UpdatePricingHandler(IPricingRepository pricingRepository) : IRequestHandler<UpdatePricingCommand, bool>
{
    public async Task<bool> Handle(UpdatePricingCommand request, CancellationToken cancellationToken)
    {
        var entity = await pricingRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await pricingRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}

public class DeletePricingHandler(IPricingRepository pricingRepository) : IRequestHandler<DeletePricingCommand, bool>
{
    public async Task<bool> Handle(DeletePricingCommand request, CancellationToken cancellationToken) =>
        await pricingRepository.DeleteAsync(request.Id, cancellationToken);
}
