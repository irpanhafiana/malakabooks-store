using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.IS4RegistrationService;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.Doku;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

using MalakaBooks.Entity;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using PhoneNumbers;
using System.Text.RegularExpressions;
using AppSetting = ConfigSetting.AppSetting;
using DokuSetting = ConfigSetting.DokuSetting;

public class CreateOrderHandler(
    IOrderRepository orderRepository,
    IUserRepository userRepository,
    IAddressRepository addressRepository,
    IHomeAddressRepository homeAddressRepository,
    IOrderEntityValidator validator,
    DokuApiClient dokuApiClient,
    IOptions<DokuSetting> dokuOptions,
    IOptions<AppSetting> appOptions) : IRequestHandler<CreateOrderCommand, CreateOrderResponse>
{
    private readonly IOrderEntityValidator _validator = validator;
    private readonly DokuSetting dokuSetting = dokuOptions.Value;
    private readonly AppSetting appSetting = appOptions.Value;

    public async Task<CreateOrderResponse> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByUserIdAsync(request.Request.UserId.Trim(), cancellationToken);
        if (user is null)
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = new Dictionary<string, string>
                {
                    ["1"] = "User not found."
                }
            };
        }

        var receiverAddress = await addressRepository.GetByIdAsync(request.Request.AddressId.Trim(), cancellationToken);
        if (receiverAddress is null || !string.Equals(receiverAddress.UserId, user.UserId, StringComparison.OrdinalIgnoreCase))
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = new Dictionary<string, string>
                {
                    ["1"] = "Address not found for the current user."
                }
            };
        }

        var pickupAddress = (await homeAddressRepository.GetAllAsync(cancellationToken)).FirstOrDefault();
        if (pickupAddress is null)
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = new Dictionary<string, string>
                {
                    ["1"] = "Home address is not configured."
                }
            };
        }

        var shipmentDetail = BuildShipmentDetail(request.Request, user, pickupAddress, pickupAddress, receiverAddress);
        var entity = request.Request.ToEntity(user, shipmentDetail);
        var expirationTimeoutMinutes = Math.Max(1, appSetting.OrderSetting?.ExpirationTimeoutMinutes ?? 60);

        entity.Status = "pending_payment";
        entity.PaymentStatus = "unpaid";
        entity.PaymentGateway = "DOKU";
        entity.PaymentMethod = "QRIS";
        entity.ExpiresAt = DateTime.UtcNow.AddMinutes(expirationTimeoutMinutes);

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

    private static OrderShipmentDetail BuildShipmentDetail(
        CreateOrderRequest request,
        UserEntity user,
        HomeAddressEntity pickupAddress,
        HomeAddressEntity senderAddress,
        AddressEntity receiverAddress)
    {
        var itemTitles = request.Items
            .Select(item => string.IsNullOrWhiteSpace(item.BookName) ? item.Title : item.BookName)
            .Where(title => !string.IsNullOrWhiteSpace(title))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new OrderShipmentDetail
        {
            Courier = request.ShippingCourier.Trim(),
            PickupName = pickupAddress.RecipientName,
            PickupDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            PickupPhoneNumber = pickupAddress.Phone,
            PickupAddress = pickupAddress.Street,
            PickupAddressId = pickupAddress.AddressCode ?? string.Empty,
            SenderName = senderAddress.RecipientName,
            SenderAddress = senderAddress.Street,
            SenderAddressId = senderAddress.AddressCode ?? string.Empty,
            SenderPhoneNumber = senderAddress.Phone,
            ReceiverName = receiverAddress.RecipientName,
            ReceiverAddress = receiverAddress.Street,
            ReceiverAddressId = receiverAddress.AddressCode ?? string.Empty,
            ReceiverPhoneNumber = receiverAddress.Phone,
            Type = "PICKUP",
            ItemWeight = "1",
            ServiceType = request.ShippingType.Trim(),
            ServicePrice = request.ShippingFee.ToString("0.##"),
            ServiceEstimate = request.ShippingEst.Trim(),
            Quantity = request.Items.Sum(item => item.Quantity).ToString(),
            WoodenPacking = "no",
            Insurance = "no",
            ItemValueAmount = request.Items.Sum(item => item.Price * item.Quantity),
            ItemType = "buku",
            Volume = "10x10x10",
            ItemName = string.Join(", ", itemTitles),
            CourierInstruction = request.Note.Trim(),
            PickupZipCode = pickupAddress.PostalCode,
            ReceiverZipCode = receiverAddress.PostalCode,
            SenderLongitude = senderAddress.Longitude.ToString(),
            SenderLatitude = senderAddress.Latitude.ToString(),
            ReceiverLongitude = receiverAddress.Longitude.ToString(),
            ReceiverLatitude = receiverAddress.Latitude.ToString(),
            ItemCode = string.Join(",", request.Items.Select(item => item.BookId.Trim()).Where(id => !string.IsNullOrWhiteSpace(id))),
            ItemCategory = "buku",
            Bpik = null,
            ReceiverNote = "tolong video unboxing",
            PartnerName = "SIMASRIM"
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
        var phoneNumberUtil = PhoneNumberUtil.GetInstance();

        var detail = request.Items.Select(item => new Line_Items
        {
            id = item.BookId,
            name = string.IsNullOrWhiteSpace(item.BookName) ? RemoveInvalidCharacters(item.Title) : RemoveInvalidCharacters(item.BookName),
            quantity = item.Quantity,
            price = Convert.ToInt32(item.Price),
            type = "PRODUCT"
        }).ToList();

        if (request.ShippingFee > 0)
        {
            detail.Add(new Line_Items
            {
                id = "LOGISTIC",
                name = "LOGISTIC",
                quantity = 1,
                price = Convert.ToInt32(entity.ShippingFee),
                type = "LOGISTIC"
            });
        }

        return new DokuObject
        {
            order = new Order
            {
                amount = Convert.ToInt32(entity.GrandTotal),
                invoice_number = entity.Id,
                callback_url_result = dokuSetting.PaymentCallbackUrl,
                line_items = detail.ToArray()
            },
            payment = new Payment(),
            customer = new Customer
            {
                id = request.Id,
                name = entity.User.FirstName,
                last_name = entity.User.LastName,
                phone = phoneNumberUtil.Format(phoneNumberUtil.Parse(entity.User.Phone, "ID"), PhoneNumberFormat.E164)
            },
            additional_info = new Additional_Info
            {
                override_notification_url = dokuSetting.PaymentNotificationUrl
            }
        };
    }

    private static string RemoveInvalidCharacters(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        return Regex.Replace(
            value,
            @"[^a-zA-Z0-9.\-\/+,=_:'@%]",
            ""
        );
    }
}



