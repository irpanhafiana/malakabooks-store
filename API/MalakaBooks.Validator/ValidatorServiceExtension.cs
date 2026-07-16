using FluentValidation;
using MalakaBooks.ViewModel;
using Microsoft.Extensions.DependencyInjection;

namespace MalakaBooks.Validator;

public static class ValidatorServiceExtension
{
    public static IServiceCollection RegisterAdditionalValidatorService(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateBookRequest>, CreateBookRequestValidator>();
        services.AddScoped<IValidator<UpdateBookRequest>, UpdateBookRequestValidator>();
        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryRequestValidator>();
        services.AddScoped<IValidator<UpdateCategoryRequest>, UpdateCategoryRequestValidator>();
        services.AddScoped<IValidator<CreateOrderRequest>, CreateOrderRequestValidator>();
        services.AddScoped<IValidator<UpdateOrderStatusRequest>, UpdateOrderStatusRequestValidator>();
        services.AddScoped<IValidator<AddCartItemRequest>, AddCartItemRequestValidator>();
        services.AddScoped<IValidator<RemoveCartItemRequest>, RemoveCartItemRequestValidator>();
        services.AddScoped<IValidator<CreateAddressRequest>, CreateAddressRequestValidator>();
        services.AddScoped<IValidator<UpdateAddressRequest>, UpdateAddressRequestValidator>();
        services.AddScoped<IValidator<UpdateUserRequest>, UpdateUserRequestValidator>();
        services.AddScoped<IValidator<CreatePromotionBannerRequest>, CreatePromotionBannerRequestValidator>();
        services.AddScoped<IValidator<UpdatePromotionBannerRequest>, UpdatePromotionBannerRequestValidator>();
        services.AddScoped<IValidator<CreateReviewRequest>, CreateReviewRequestValidator>();
        services.AddScoped<IValidator<CreateComplaintRequest>, CreateComplaintRequestValidator>();
        services.AddScoped<IValidator<RespondComplaintRequest>, RespondComplaintRequestValidator>();
        services.AddScoped<IValidator<CreateHomeAddressRequest>, CreateHomeAddressRequestValidator>();
        services.AddScoped<IValidator<UpdateHomeAddressRequest>, UpdateHomeAddressRequestValidator>();
        services.AddScoped<IValidator<CreateUomGroupRequest>, CreateUomGroupRequestValidator>();
        services.AddScoped<IValidator<UpdateUomGroupRequest>, UpdateUomGroupRequestValidator>();

        return services;
    }
}
