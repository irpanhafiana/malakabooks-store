using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.PaymentHandlers;

public record CalculatePaymentFeesQuery(CalculatePaymentFeeRequest Request) : IRequest<CalculatedPaymentFeeResponse?>;

public class CalculatePaymentFeesHandler(IPaymentRepository paymentRepository) : IRequestHandler<CalculatePaymentFeesQuery, CalculatedPaymentFeeResponse?>
{
    public async Task<CalculatedPaymentFeeResponse?> Handle(CalculatePaymentFeesQuery request, CancellationToken cancellationToken)
    {
        var payment = await paymentRepository.GetByIdAsync(request.Request.PaymentId, cancellationToken);
        if (payment is null)
        {
            return null;
        }

        var fees = payment.Fees
            .Select(fee => fee.ToEntity(request.Request.ItemsSubtotal))
            .ToList();

        return new CalculatedPaymentFeeResponse
        {
            PaymentId = payment.Id ?? string.Empty,
            PaymentName = payment.Name,
            MethodType = payment.MethodType,
            ItemsSubtotal = request.Request.ItemsSubtotal,
            TotalFeeAmount = fees.Sum(fee => fee.Amount),
            Fees = fees.Select(fee => new CalculatedPaymentFeeItemResponse
            {
                Code = fee.Code,
                Name = fee.Name,
                Type = fee.Type,
                Value = fee.Value,
                Amount = fee.Amount
            }).ToList()
        };
    }
}
