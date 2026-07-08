using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public class DeletePromotionBannerHandler(IPromotionBannerRepository promotionBannerRepository) : IRequestHandler<DeletePromotionBannerCommand, bool>
{
    public async Task<bool> Handle(DeletePromotionBannerCommand request, CancellationToken cancellationToken) =>
        await promotionBannerRepository.DeleteAsync(request.Id, cancellationToken);
}
