using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record CreateComplaintCommand(CreateComplaintRequest Request) : IRequest<ComplaintResponse>;
