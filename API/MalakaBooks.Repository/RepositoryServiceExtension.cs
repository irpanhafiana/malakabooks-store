using MalakaBooks.IRepository;
using Microsoft.Extensions.DependencyInjection;

namespace MalakaBooks.Repository;

public static class RepositoryServiceExtension
{
    public static IServiceCollection RegisterRepositoryService(this IServiceCollection services)
    {
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddScoped<IItemRepository, ItemRepository>();
        services.AddScoped<IUomGroupRepository, UomGroupRepository>();
        services.AddScoped<IPricingRepository, PricingRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IWarehouseStockRepository, WarehouseStockRepository>();
        services.AddScoped<IInventoryMovementRepository, InventoryMovementRepository>();
        services.AddScoped<IAuthorRepository, AuthorRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IIncomingPaymentRepository, IncomingPaymentRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IAddressRepository, AddressRepository>();
        services.AddScoped<IHomeAddressRepository, HomeAddressRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IComplaintRepository, ComplaintRepository>();
        services.AddScoped<IPromotionBannerRepository, PromotionBannerRepository>();

        return services;
    }
}
