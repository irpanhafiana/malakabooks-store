using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class GetComplaintsByUserHandler(IComplaintRepository complaintRepository) : IRequestHandler<GetComplaintsByUserQuery, IReadOnlyCollection<ComplaintResponse>>
{
    public async Task<IReadOnlyCollection<ComplaintResponse>> Handle(GetComplaintsByUserQuery request, CancellationToken cancellationToken) =>
        (await complaintRepository.GetByUserIdAsync(request.UserId, cancellationToken)).Select(complaintEntity => complaintEntity.ToResponse()).ToArray();
}
