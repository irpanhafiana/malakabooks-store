using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.IncomingPaymentHandlers;

public record ProcessDokuPaymentNotificationCommand(DokuPaymentNotificationRequest Request) : IRequest<ProcessDokuPaymentResult>;
