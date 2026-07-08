using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class CreatePromotionBannerHandler(IPromotionBannerRepository promotionBannerRepository, IPromotionBannerEntityValidator validator) : IRequestHandler<CreatePromotionBannerCommand, ValidationResult?>
{
    private readonly IPromotionBannerEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreatePromotionBannerCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result == null)
        {
            await promotionBannerRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
