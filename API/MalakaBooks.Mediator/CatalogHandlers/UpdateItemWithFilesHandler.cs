
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CatalogHandlers;

public class UpdateItemWithFilesHandler(
    IItemRepository itemRepository, 
    IFileStorageService fileStorageService) : IRequestHandler<UpdateItemWithFilesCommand, ValidationResult?>
{
    public async Task<ValidationResult?> Handle(UpdateItemWithFilesCommand request, CancellationToken cancellationToken)
    {
        var entity = await itemRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null)
        {
            return new ValidationResult("Item not found.");
        }

        string? coverImageUrl = null;
        if (request.Request.CoverImage != null)
        {
            coverImageUrl = await fileStorageService.SaveFileAsync(request.Request.CoverImage, "items", cancellationToken);
        }

        List<string>? additionalImageUrls = null;
        if (request.Request.AdditionalImages != null)
        {
            additionalImageUrls = new List<string>();
            foreach (var img in request.Request.AdditionalImages)
            {
                var url = await fileStorageService.SaveFileAsync(img, "items", cancellationToken);
                if (!string.IsNullOrEmpty(url))
                {
                    additionalImageUrls.Add(url);
                }
            }
        }

        entity.UpdateFrom(request.Request, coverImageUrl, additionalImageUrls);

        await itemRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return ValidationResult.Success;
    }
}
