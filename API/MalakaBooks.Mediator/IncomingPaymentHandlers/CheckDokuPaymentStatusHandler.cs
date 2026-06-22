using MalakaBooks.IS4RegistrationService;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.Doku;
using MediatR;
using Microsoft.Extensions.Options;
using DokuSetting = MalakaBooks.ConfigSetting.DokuSetting;

namespace MalakaBooks.Mediator.IncomingPaymentHandlers;

public class CheckDokuPaymentStatusHandler(
    DokuApiClient dokuApiClient,
    IMediator mediator,
    IOptions<DokuSetting> dokuOptions) : IRequestHandler<CheckDokuPaymentStatusCommand, ProcessDokuPaymentResult>
{
    private readonly DokuSetting dokuSetting = dokuOptions.Value;

    public async Task<ProcessDokuPaymentResult> Handle(CheckDokuPaymentStatusCommand request, CancellationToken cancellationToken)
    {
        var orderId = request.Request.OrderId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new ProcessDokuPaymentResult
            {
                OrderId = string.Empty,
                IsSuccess = false,
                Message = "OrderId is required."
            };
        }

        var dokuResponse = await dokuApiClient.GetAsync<DokuNotification>(string.Format(dokuSetting.CheckPaymentStatusPath, request.Request.OrderId));
        if (dokuResponse is null)
        {
            return new ProcessDokuPaymentResult
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "No response returned from DOKU."
            };
        }

        if (dokuResponse.order.invoice_number == request.Request.OrderId && dokuResponse.transaction.status == "SUCCESS")
        {
            return await mediator.Send(
                new ProcessDokuPaymentNotificationCommand(new DokuPaymentNotificationRequest
                {
                    OrderId = orderId,
                    TransactionStatus = dokuResponse.transaction.status,
                    Amount = Convert.ToDecimal(dokuResponse.order.amount),
                }),
                cancellationToken);
        }

        return new ProcessDokuPaymentResult
        {
            OrderId = orderId,
            IsSuccess = false,
            Message = "No response returned from DOKU."
        };
    }
}
