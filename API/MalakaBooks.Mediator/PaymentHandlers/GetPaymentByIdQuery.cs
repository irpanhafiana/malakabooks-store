using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record GetPaymentByIdQuery(string Id) : IRequest<PaymentResponse?>;
