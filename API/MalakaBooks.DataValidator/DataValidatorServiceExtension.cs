using MalakaBooks.IDataValidator;
using Microsoft.Extensions.DependencyInjection;

namespace MalakaBooks.DataValidator
{
  public static class DataValidatorServiceExtension
  {
    public static IServiceCollection RegisterAdditionalDataValidatorService(this IServiceCollection services)
    {
      services.AddScoped<ICategoryEntityValidator, CategoryEntityValidator>();

      return services;
    }
  }
}
