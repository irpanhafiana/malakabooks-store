using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MalakaBooks.Mediator.Common;
using Microsoft.AspNetCore.Hosting;

namespace MalakaBooks.API.Services;

/// <summary>
/// Service for handling file storage operations
/// </summary>
/// <param name="env">The web host environment</param>
public class FileStorageService(IWebHostEnvironment env) : IFileStorageService
{
    /// <summary>
    /// Saves an uploaded file to a specific subfolder in wwwroot/images
    /// </summary>
    /// <param name="file">The file to save</param>
    /// <param name="subFolder">The subfolder to save the file in</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The relative URL of the saved file</returns>
    public async Task<string> SaveFileAsync(IFormFile file, string subFolder, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return string.Empty;

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        
        var uploadPath = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "images", subFolder);
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var filePath = Path.Combine(uploadPath, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return $"/images/{subFolder}/{fileName}";
    }
}
