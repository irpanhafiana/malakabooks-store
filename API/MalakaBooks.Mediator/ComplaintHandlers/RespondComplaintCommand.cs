using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.ComplaintHandlers;

public record RespondComplaintCommand(string Id, RespondComplaintRequest Request) : IRequest<ComplaintResponse?>;
