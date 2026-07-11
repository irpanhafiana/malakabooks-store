using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record ProcessSimasrimShipmentWebhookCommand(CreateResiResponse Request) : IRequest<ProcessSimasrimShipmentWebhookResult>;
