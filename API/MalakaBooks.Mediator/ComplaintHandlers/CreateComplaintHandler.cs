using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class CreateComplaintHandler(IComplaintRepository complaintRepository, IComplaintEntityValidator validator) : IRequestHandler<CreateComplaintCommand, ValidationResult?>
{
    private readonly IComplaintEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateComplaintCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await complaintRepository.CreateAsync(entity, cancellationToken);
        }
        return result;
    }
}
