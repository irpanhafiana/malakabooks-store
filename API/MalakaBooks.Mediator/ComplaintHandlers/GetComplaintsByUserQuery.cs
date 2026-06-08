using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record GetComplaintsByUserQuery(string UserId) : IRequest<IReadOnlyCollection<ComplaintResponse>>;
