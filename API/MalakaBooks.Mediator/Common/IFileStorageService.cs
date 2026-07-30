using Microsoft.AspNetCore.Http;

namespace MalakaBooks.Mediator.Common;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subfolder, CancellationToken cancellationToken = default);
}
