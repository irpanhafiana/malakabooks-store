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
        var existingComplaint = await complaintRepository.GetByUserOrderAndBookAsync(
            request.Request.UserId.Trim(),
            request.Request.OrderId.Trim(),
            request.Request.BookId.Trim(),
            cancellationToken);
        if (existingComplaint is not null)
        {
            return new ValidationResult("Complaint with same user, order, and book already exist.");
        }

        var entity = request.Request.ToEntity();
        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await complaintRepository.CreateAsync(entity, cancellationToken);
        }
        return result;
    }
}
