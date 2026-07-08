using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record UpdatePromotionBannerCommand(string Id, UpdatePromotionBannerRequest Request) : IRequest<bool>;
