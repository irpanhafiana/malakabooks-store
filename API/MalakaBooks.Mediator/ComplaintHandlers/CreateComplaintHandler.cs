using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class CreateComplaintHandler(IComplaintRepository complaintRepository) : IRequestHandler<CreateComplaintCommand, ComplaintResponse>
{
    public async Task<ComplaintResponse> Handle(CreateComplaintCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();
        await complaintRepository.CreateAsync(entity, cancellationToken);
        return entity.ToResponse();
    }
}
