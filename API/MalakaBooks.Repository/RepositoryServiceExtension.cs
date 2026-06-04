using MalakaBooks.IRepository;
using Microsoft.Extensions.DependencyInjection;

namespace MalakaBooks.Repository;

public static class RepositoryServiceExtension
{
    public static IServiceCollection RegisterRepositoryService(this IServiceCollection services)
    {
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IAddressRepository, AddressRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IComplaintRepository, ComplaintRepository>();

        return services;
    }
}
