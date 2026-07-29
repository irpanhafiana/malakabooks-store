using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.PromotionBannerHandlers;

public record UpdatePromotionBannerWithFilesCommand(string Id, UpdatePromotionBannerWithFilesRequest Request) : IRequest<ValidationResult?>;
