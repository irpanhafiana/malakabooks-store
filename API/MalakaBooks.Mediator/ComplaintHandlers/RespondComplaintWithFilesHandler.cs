
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class RespondComplaintWithFilesHandler(
    IComplaintRepository complaintRepository, 
    IComplaintEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<RespondComplaintWithFilesCommand, ValidationResult?>
{
    private readonly IComplaintEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(RespondComplaintWithFilesCommand request, CancellationToken cancellationToken)
    {
        var entity = await complaintRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity == null)
        {
            return new ValidationResult("Complaint not found.");
        }

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

        entity.UpdateFrom(request.Request, additionalImageUrls);

        var result = await _validator.UpdateValidateAsync(entity);
        if (result == null)
        {
            await complaintRepository.UpdateAsync(request.Id, entity, cancellationToken);
        }

        return result;
    }
}
