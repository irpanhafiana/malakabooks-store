using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record UpdatePaymentCommand(string Id, UpdatePaymentRequest Request) : IRequest<bool>;
