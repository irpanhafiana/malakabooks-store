
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CatalogHandlers;

public class CreateItemWithFilesHandler(
    IItemRepository itemRepository, 
    IUomGroupRepository uomGroupRepository,
    IFileStorageService fileStorageService) : IRequestHandler<CreateItemWithFilesCommand, ValidationResult?>
{
    public async Task<ValidationResult?> Handle(CreateItemWithFilesCommand request, CancellationToken cancellationToken)
    {
        string coverImageUrl = string.Empty;
        if (request.Request.CoverImage != null)
        {
            coverImageUrl = await fileStorageService.SaveFileAsync(request.Request.CoverImage, "items", cancellationToken);
        }

        var additionalImageUrls = new List<string>();
        if (request.Request.AdditionalImages != null)
        {
            foreach (var img in request.Request.AdditionalImages)
            {
                var url = await fileStorageService.SaveFileAsync(img, "items", cancellationToken);
                if (!string.IsNullOrEmpty(url))
                {
                    additionalImageUrls.Add(url);
                }
            }
        }

        var entity = request.Request.ToEntity(coverImageUrl, additionalImageUrls);

        if (request.Request.HasEmbeddedUomGroup())
        {
            var uomGroupEntity = request.Request.UomGroup!.ToEntity();
            entity.UomGroupId = uomGroupEntity.Id = Guid.NewGuid().ToString();
            entity.BaseUomCode = uomGroupEntity.BaseUomCode;
            
            await uomGroupRepository.CreateAsync(uomGroupEntity, cancellationToken);
        }

        var createdItem = await itemRepository.CreateAsync(entity, cancellationToken);
        return ValidationResult.Success;
    }
}
