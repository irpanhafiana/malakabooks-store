using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.IS4RegistrationService;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.Doku;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using DokuSetting = ConfigSetting.DokuSetting;

public class CreateOrderHandler(
    IOrderRepository orderRepository,
    IOrderEntityValidator validator,
    DokuApiClient dokuApiClient,
    IOptions<DokuSetting> dokuOptions) : IRequestHandler<CreateOrderCommand, CreateOrderResponse>
{
    private readonly IOrderEntityValidator _validator = validator;
    private readonly DokuSetting dokuSetting = dokuOptions.Value;

    public async Task<CreateOrderResponse> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result is not null)
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = ToErrorDictionary(result)
            };
        }

        await orderRepository.CreateAsync(entity, cancellationToken);

        var content = ToDokuObject(request.Request, entity, dokuSetting);
        var url = dokuSetting.BaseUrl + dokuSetting.PaymentUrl;

        var dokuResponse = await dokuApiClient.PostAsync(url, content);
        dokuResponse.EnsureSuccessStatusCode();

        var responseText = JsonConvert.DeserializeObject<DokuResponse>(await dokuResponse.Content.ReadAsStringAsync());

        entity.PaymentGateway = "DOKU";
        entity.PaymentMethod = "QRIS";

        entity.PaymentUrl = responseText!.response.payment!.url!;
        entity.UpdatedAt = DateTime.UtcNow;

        await orderRepository.UpdateAsync(entity.Id!, entity, cancellationToken);

        return new CreateOrderResponse
        {
            IsSuccess = true,
            OrderId = entity.Id ?? string.Empty,
            PaymentUrl = entity.PaymentUrl
        };
    }

    private static Dictionary<string, string> ToErrorDictionary(System.ComponentModel.DataAnnotations.ValidationResult result)
    {
        var errorDictionary = new Dictionary<string, string>();
        var errorsList = result.ErrorMessage?.Split("\r\n") ?? [];

        var lineNo = 1;
        foreach (var error in errorsList)
        {
            if (!string.IsNullOrWhiteSpace(error))
            {
                errorDictionary.Add(lineNo.ToString(), error);
                lineNo++;
            }
        }

        return errorDictionary;
    }

    private static DokuObject ToDokuObject(CreateOrderRequest request, MalakaBooks.Entity.OrderEntity entity, MalakaBooks.ConfigSetting.DokuSetting dokuSetting)
    {
        var detail = request.Items.Select(item => new Line_Items
        {
            id = item.BookId,
            name = string.IsNullOrWhiteSpace(item.BookName) ? item.Title : item.BookName,
            quantity = item.Quantity,
            price = Convert.ToInt32(item.Price),
            type = "PRODUCT"
        }).ToArray();

        return new DokuObject
        {
            order = new Order
            {
                amount = Convert.ToInt32(request.Items.Sum(item => item.Price * item.Quantity)),
                invoice_number = entity.Id,
                callback_url_result = dokuSetting.PaymentCallbackUrl,
                line_items = detail
            },
            payment = new Payment(),
            customer = new Customer
            {
                id = request.UserId,
                name = request.FirstName,
                last_name = request.LastName,
                phone = request.Phone
            },
            additional_info = new Additional_Info
            {
                override_notification_url = dokuSetting.PaymentNotificationUrl
            }
        };
    }
}



