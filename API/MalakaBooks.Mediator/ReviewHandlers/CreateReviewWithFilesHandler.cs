
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ReviewHandlers;

public class CreateReviewWithFilesHandler(
    IReviewRepository reviewRepository, 
    IReviewEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<CreateReviewWithFilesCommand, ValidationResult?>
{
    private readonly IReviewEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateReviewWithFilesCommand request, CancellationToken cancellationToken)
    {
        var additionalImageUrls = new List<string>();
        if (request.Request.AdditionalImages != null)
        {
            foreach (var img in request.Request.AdditionalImages)
            {
                var url = await fileStorageService.SaveFileAsync(img, "reviews", cancellationToken);
                if (!string.IsNullOrEmpty(url))
                {
                    additionalImageUrls.Add(url);
                }
            }
        }

        var entity = request.Request.ToEntity(additionalImageUrls);

        var result = await _validator.CreateValidateAsync(entity);
        if (result == null)
        {
            await reviewRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
