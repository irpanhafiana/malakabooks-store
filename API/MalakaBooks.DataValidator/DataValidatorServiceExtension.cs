using MalakaBooks.IDataValidator;
using Microsoft.Extensions.DependencyInjection;

namespace MalakaBooks.DataValidator
{
    public static class DataValidatorServiceExtension
    {
        public static IServiceCollection RegisterAdditionalDataValidatorService(this IServiceCollection services)
        {
            services.AddScoped<IAddressEntityValidator, AddressEntityValidator>();
            services.AddScoped<IHomeAddressEntityValidator, HomeAddressEntityValidator>();
            services.AddScoped<IBookEntityValidator, BookEntityValidator>();
            services.AddScoped<ICategoryEntityValidator, CategoryEntityValidator>();
            services.AddScoped<IComplaintEntityValidator, ComplaintEntityValidator>();
            services.AddScoped<IOrderEntityValidator, OrderEntityValidator>();
            services.AddScoped<IPromotionBannerEntityValidator, PromotionBannerEntityValidator>();
            services.AddScoped<IReviewEntityValidator, ReviewEntityValidator>();
            services.AddScoped<IUserEntityValidator, UserEntityValidator>();

            return services;
        }
    }
}
