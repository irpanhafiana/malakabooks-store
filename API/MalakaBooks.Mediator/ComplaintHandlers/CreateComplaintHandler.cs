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
        var requestModel = request.Request;
        var existingComplaint = await complaintRepository.GetByUserOrderAndItemAsync(
            requestModel.UserId.Trim(),
            requestModel.OrderId.Trim(),
            requestModel.ItemId.Trim(),
            cancellationToken);
        if (existingComplaint is not null)
        {
            return new ValidationResult("Complaint with same user, order, and item already exist.");
        }

        var entity = requestModel.ToEntity();
        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await complaintRepository.CreateAsync(entity, cancellationToken);
        }
        return result;
    }
}
