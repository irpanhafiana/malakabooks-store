using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record GetAllComplaintsQuery : IRequest<IReadOnlyCollection<ComplaintResponse>>;
