using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record GetActivePromotionBannersQuery() : IRequest<IReadOnlyCollection<PromotionBannerResponse>>;
