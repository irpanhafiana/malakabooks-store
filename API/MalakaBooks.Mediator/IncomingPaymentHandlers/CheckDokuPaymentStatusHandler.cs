namespace MalakaBooks.Mediator.IncomingPaymentHandlers;

//public class CheckDokuPaymentStatusHandler(
//    DokuApiClient dokuApiClient,
//    IMediator mediator)
//    : IRequestHandler<CheckDokuPaymentStatusCommand, ProcessDokuPaymentResult>
//{
//    public async Task<ProcessDokuPaymentResult> Handle(CheckDokuPaymentStatusCommand request, CancellationToken cancellationToken)
//    {
//        var orderId = request.Request.OrderId?.Trim() ?? string.Empty;
//        if (string.IsNullOrWhiteSpace(orderId))
//        {
//            return new ProcessDokuPaymentResult
//            {
//                OrderId = string.Empty,
//                IsSuccess = false,
//                Message = "OrderId is required."
//            };
//        }

//        //var dokuResponse = await dokuApiClient.CheckPaymentStatusAsync(
//        //    new DokuCheckPaymentStatusRequest { OrderId = orderId },
//        //    cancellationToken);

//        //if (dokuResponse is null)
//        //{
//        //    return new ProcessDokuPaymentResult
//        //    {
//        //        OrderId = orderId,
//        //        IsSuccess = false,
//        //        Message = "No response returned from DOKU."
//        //    };
//        //}

//        //return await mediator.Send(
//        //    new ProcessDokuPaymentNotificationCommand(new DokuPaymentNotificationRequest
//        //    {
//        //        OrderId = dokuResponse.OrderId,
//        //        TransactionStatus = dokuResponse.TransactionStatus,
//        //        PaymentMethod = dokuResponse.PaymentMethod,
//        //        Amount = dokuResponse.Amount,
//        //        Currency = dokuResponse.Currency,
//        //        GatewayReference = dokuResponse.GatewayReference,
//        //        GatewayInvoiceNumber = dokuResponse.GatewayInvoiceNumber,
//        //        PaidAt = dokuResponse.PaidAt,
//        //        RawPayload = dokuResponse.RawPayload
//        //    }),
//        //    cancellationToken);
//    }
//}
