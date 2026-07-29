using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record CreatePromotionBannerWithFilesCommand(CreatePromotionBannerWithFilesRequest Request) : IRequest<ValidationResult?>;
