using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record GetPaymentsQuery() : IRequest<IReadOnlyCollection<PaymentResponse>>;
