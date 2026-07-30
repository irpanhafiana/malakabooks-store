
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class CreatePromotionBannerWithFilesHandler(
    IPromotionBannerRepository promotionBannerRepository, 
    IPromotionBannerEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<CreatePromotionBannerWithFilesCommand, ValidationResult?>
{
    private readonly IPromotionBannerEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreatePromotionBannerWithFilesCommand request, CancellationToken cancellationToken)
    {
        string imageUrl = string.Empty;
        if (request.Request.Image != null)
        {
            imageUrl = await fileStorageService.SaveFileAsync(request.Request.Image, "promotion-banners", cancellationToken);
        }

        var entity = request.Request.ToEntity(imageUrl);

        var result = await _validator.CreateValidateAsync(entity);
        if (result == null)
        {
            await promotionBannerRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
