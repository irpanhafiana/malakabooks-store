using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.IncomingPaymentHandlers;

public record CheckDokuPaymentStatusCommand(CheckDokuPaymentStatusRequest Request) : IRequest<ProcessDokuPaymentResult>;
