using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record CreatePaymentCommand(CreatePaymentRequest Request) : IRequest<bool>;
