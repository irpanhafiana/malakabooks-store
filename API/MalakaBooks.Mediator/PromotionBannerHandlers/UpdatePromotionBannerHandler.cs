using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class UpdatePromotionBannerHandler(IPromotionBannerRepository promotionBannerRepository, IPromotionBannerEntityValidator validator) : IRequestHandler<UpdatePromotionBannerCommand, bool>
{
    private readonly IPromotionBannerEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdatePromotionBannerCommand request, CancellationToken cancellationToken)
    {
        var entity = await promotionBannerRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        return await promotionBannerRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
