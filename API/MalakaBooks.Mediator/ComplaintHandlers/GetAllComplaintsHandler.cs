using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public class GetAllComplaintsHandler(IComplaintRepository complaintRepository) : IRequestHandler<GetAllComplaintsQuery, IReadOnlyCollection<ComplaintResponse>>
{
    public async Task<IReadOnlyCollection<ComplaintResponse>> Handle(GetAllComplaintsQuery request, CancellationToken cancellationToken)
    {
        var complaints = await complaintRepository.GetAllAsync(cancellationToken);
        return complaints.Select(entity => new ComplaintResponse
        {
            Id = entity.Id ?? string.Empty,
            UserId = entity.UserId,
            OrderId = entity.OrderId,
            Subject = entity.Subject,
            Description = entity.Description,
            Status = entity.Status,
            AdminResponse = entity.AdminResponse,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        }).ToList();
    }
}
