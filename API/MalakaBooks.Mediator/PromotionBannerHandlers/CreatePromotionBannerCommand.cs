using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record CreatePromotionBannerCommand(CreatePromotionBannerRequest Request) : IRequest<ValidationResult?>;
