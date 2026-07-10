using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class GetAllComplaintsHandler(IComplaintRepository complaintRepository) : IRequestHandler<GetAllComplaintsQuery, IReadOnlyCollection<ComplaintResponse>>
{
    public async Task<IReadOnlyCollection<ComplaintResponse>> Handle(GetAllComplaintsQuery request, CancellationToken cancellationToken)
    {
        var complaints = await complaintRepository.GetAllAsync(cancellationToken);
        return complaints.Select(entity => entity.ToResponse()).ToList();
    }
}
