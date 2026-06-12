using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.IDataValidator
{
    public interface IEntityValidator<T> where T : class
    {
        Task<ValidationResult> CreateValidateAsync(params T[] entities);
        Task<ValidationResult> UpdateValidateAsync(params T[] entities);
    }
}
