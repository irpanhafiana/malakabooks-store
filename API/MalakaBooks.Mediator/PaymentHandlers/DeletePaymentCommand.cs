using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record DeletePaymentCommand(string Id) : IRequest<bool>;
