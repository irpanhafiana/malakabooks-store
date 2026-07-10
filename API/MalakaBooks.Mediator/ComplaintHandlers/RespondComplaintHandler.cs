using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class RespondComplaintHandler(IComplaintRepository complaintRepository) : IRequestHandler<RespondComplaintCommand, ComplaintResponse?>
{
    public async Task<ComplaintResponse?> Handle(RespondComplaintCommand request, CancellationToken cancellationToken)
    {
        var entity = await complaintRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        if (string.Equals(request.Request.SenderType, "customer", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(entity.UserId, request.Request.SenderId, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        entity.UpdateFrom(request.Request);
        await complaintRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
