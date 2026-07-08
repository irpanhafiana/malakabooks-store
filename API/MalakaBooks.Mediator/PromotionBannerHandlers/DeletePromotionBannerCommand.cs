using MediatR;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record DeletePromotionBannerCommand(string Id) : IRequest<bool>;
