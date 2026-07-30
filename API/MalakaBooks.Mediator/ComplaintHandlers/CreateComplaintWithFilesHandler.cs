
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class CreateComplaintWithFilesHandler(
    IComplaintRepository complaintRepository, 
    IComplaintEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<CreateComplaintWithFilesCommand, ValidationResult?>
{
    private readonly IComplaintEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateComplaintWithFilesCommand request, CancellationToken cancellationToken)
    {
        var additionalImageUrls = new List<string>();
        if (request.Request.AdditionalImages != null)
        {
            foreach (var img in request.Request.AdditionalImages)
            {
                var url = await fileStorageService.SaveFileAsync(img, "complaints", cancellationToken);
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
            await complaintRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
