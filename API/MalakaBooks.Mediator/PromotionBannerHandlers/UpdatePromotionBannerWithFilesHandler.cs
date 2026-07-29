
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class UpdatePromotionBannerWithFilesHandler(
    IPromotionBannerRepository promotionBannerRepository, 
    IPromotionBannerEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<UpdatePromotionBannerWithFilesCommand, ValidationResult?>
{
    private readonly IPromotionBannerEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(UpdatePromotionBannerWithFilesCommand request, CancellationToken cancellationToken)
    {
        var entity = await promotionBannerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null)
        {
            return new ValidationResult("Promotion Banner not found.");
        }

        string? imageUrl = null;
        if (request.Request.Image != null)
        {
            imageUrl = await fileStorageService.SaveFileAsync(request.Request.Image, "promotion-banners", cancellationToken);
        }

        entity.UpdateFrom(request.Request, imageUrl);

        var result = await _validator.UpdateValidateAsync(entity);
        if (result == null)
        {
            await promotionBannerRepository.UpdateAsync(request.Id, entity, cancellationToken);
        }

        return result;
    }
}
