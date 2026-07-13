using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.IS4RegistrationService;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.Doku;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

using MalakaBooks.ConfigSetting;
using MalakaBooks.Entity;
using Microsoft.AspNetCore.Http;
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
    IPaymentRepository paymentRepository,
    IPricingRepository pricingRepository,
    IItemRepository itemRepository,
    IUomGroupRepository uomGroupRepository,
    IHttpContextAccessor httpContextAccessor,
    IOrderEntityValidator validator,
    DokuApiClient dokuApiClient,
    SimasrimApiClient simasrimApiClient,
    IOptions<DokuSetting> dokuOptions,
    IOptions<SimasrimSetting> simasrimOptions,
    IOptions<AppSetting> appOptions) : IRequestHandler<CreateOrderCommand, CreateOrderResponse>
{
    private readonly IOrderEntityValidator _validator = validator;
    private readonly DokuSetting dokuSetting = dokuOptions.Value;
    private readonly AppSetting appSetting = appOptions.Value;
    private readonly SimasrimSetting simasrimSetting = simasrimOptions.Value;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<CreateOrderResponse> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var customerGroupCode = GetCustomerGroupCode();
        if (string.IsNullOrWhiteSpace(customerGroupCode))
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = new Dictionary<string, string>
                {
                    ["1"] = "Customer group claim was not found."
                }
            };
        }

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

        var payment = await paymentRepository.GetByIdAsync(request.Request.PaymentId.Trim(), cancellationToken);
        if (payment is null)
        {
            return new CreateOrderResponse
            {
                IsSuccess = false,
                Errors = new Dictionary<string, string>
                {
                    ["1"] = "Payment method not found."
                }
            };
        }

        var shipmentDetail = BuildShipmentDetail(request.Request, user, pickupAddress, pickupAddress, receiverAddress);
        var entity = request.Request.ToEntity(user, customerGroupCode);
        var pricingResolution = await ApplyPricingAsync(request.Request, entity, customerGroupCode, pricingRepository, itemRepository, uomGroupRepository, cancellationToken);
        if (!pricingResolution.IsSuccess)
        {
            return pricingResolution;
        }

        var expirationTimeoutMinutes = Math.Max(1, appSetting.OrderSetting?.ExpirationTimeoutMinutes ?? 60);

        if (request.Request.Insurance)
        {
            var insuranceResponse = await simasrimApiClient.PostAsync<SimasrimInsuranceResponse>(
                "api/b2b/pengiriman/asuransi",
                new SimasrimInsuranceRequest
                {
                    NilaiBarang = entity.ItemsSubtotal
                },
                cancellationToken);

            if (insuranceResponse?.Data is null)
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "Failed to calculate shipping insurance.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = "Failed to calculate shipping insurance."
                    }
                };
            }

            var recalculatedInsurance = insuranceResponse.Data.NilaiAsuransi;
            if (request.Request.ShippingInsurance != recalculatedInsurance)
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "insurance value no longer valid",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = "insurance value no longer valid"
                    }
                };
            }

            entity.ShippingInsurance = recalculatedInsurance;
            entity.GrandTotal = entity.ItemsSubtotal + entity.ShippingFee + entity.ShippingInsurance;
            entity.TotalPrice = entity.GrandTotal;
        }

        entity.Status = "pending_payment";
        entity.PaymentStatus = "unpaid";
        entity.PaymentGateway = "DOKU";
        entity.PaymentId = payment.Id ?? string.Empty;
        entity.PaymentMethod = payment.MethodType;
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

        shipmentDetail.PartnerName = simasrimSetting.PartnerName!;
        shipmentDetail.ReferenceNo = entity.Id ?? string.Empty;

        entity.PaymentUrl = responseText!.response.payment!.url!;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.ShipmentDetailJson = shipmentDetail.ToShipmentDetailJson();

        await orderRepository.UpdateAsync(entity.Id!, entity, cancellationToken);

        return new CreateOrderResponse
        {
            IsSuccess = true,
            Message = "OK",
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
            .Select(item => string.IsNullOrWhiteSpace(item.ItemName) ? item.Title : item.ItemName)
            .Where(title => !string.IsNullOrWhiteSpace(title))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var insuranceEnabled = request.Insurance;
        var bpik = insuranceEnabled
            ? request.Items.Select(item => new OrderShipmentBpikDetail
            {
                GoodsName = item.ItemName,
                GoodsType = "buku",
                Quantity = item.Quantity
            }).ToList()
            : [];

        return new OrderShipmentDetail
        {
            Courier = request.ShippingCourier.Trim(),
            PickupName = pickupAddress.RecipientName,
            PickupDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
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
            Insurance = insuranceEnabled ? "yes" : "no",
            ItemValueAmount = request.Items.Sum(item => (item.Price ?? 0) * item.Quantity),
            ItemType = "buku",
            Volume = "10x3x10",
            ItemName = string.Join(", ", itemTitles),
            CourierInstruction = request.Note.Trim(),
            PickupZipCode = pickupAddress.PostalCode,
            ReceiverZipCode = receiverAddress.PostalCode,
            SenderLongitude = senderAddress.Longitude.ToString(),
            SenderLatitude = senderAddress.Latitude.ToString(),
            ReceiverLongitude = receiverAddress.Longitude.ToString(),
            ReceiverLatitude = receiverAddress.Latitude.ToString(),
            ItemCode = string.Join(",", request.Items.Select(item => item.ItemId.Trim()).Where(id => !string.IsNullOrWhiteSpace(id))),
            ItemCategory = request.ShippingCourier.ToUpper() == "JNTC" ? "bm000007" : "SHTPC",
            Bpik = bpik,
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

    private static async Task<CreateOrderResponse> ApplyPricingAsync(
        CreateOrderRequest request,
        OrderEntity entity,
        string customerGroupCode,
        IPricingRepository pricingRepository,
        IItemRepository itemRepository,
        IUomGroupRepository uomGroupRepository,
        CancellationToken cancellationToken)
    {
        for (var index = 0; index < request.Items.Count; index++)
        {
            var requestItem = request.Items[index];
            var orderItem = entity.Items[index];

            if (string.IsNullOrWhiteSpace(orderItem.ItemId))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(orderItem.UomCode))
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "UoM code is required for catalog-priced items.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = $"UoM code is required for item '{orderItem.ItemId}'."
                    }
                };
            }

            var item = await itemRepository.GetByIdAsync(orderItem.ItemId, cancellationToken);
            if (item is null)
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "Catalog item not found.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = $"Item '{orderItem.ItemId}' was not found."
                    }
                };
            }

            if (string.IsNullOrWhiteSpace(item.UomGroupId))
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "Item UoM group is not configured.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = $"Item '{item.Name}' does not have a UoM group."
                    }
                };
            }

            var uomGroup = await uomGroupRepository.GetByIdAsync(item.UomGroupId, cancellationToken);
            if (uomGroup is null || !uomGroup.Details.Any(detail => string.Equals(detail.Code, orderItem.UomCode, StringComparison.OrdinalIgnoreCase) && detail.IsActive))
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "Item UoM is invalid.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = $"UoM '{orderItem.UomCode}' is not valid for item '{item.Name}'."
                    }
                };
            }

            var pricingHeaders = await pricingRepository.GetActiveByItemIdAsync(orderItem.ItemId, DateTime.UtcNow, cancellationToken);
            var pricingDetail = pricingHeaders
                .SelectMany(header => header.Details.Select(detail => new { header, detail }))
                .Where(entry => string.Equals(entry.detail.CustomerGroupCode, customerGroupCode, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(entry.detail.UomCode, orderItem.UomCode, StringComparison.OrdinalIgnoreCase))
                .Select(entry => entry.detail)
                .FirstOrDefault();

            if (pricingDetail is null)
            {
                return new CreateOrderResponse
                {
                    IsSuccess = false,
                    Message = "Pricing detail not found for item and UoM.",
                    Errors = new Dictionary<string, string>
                    {
                        ["1"] = $"Pricing for item '{item.Name}' and UoM '{orderItem.UomCode}' was not found."
                    }
                };
            }

            orderItem.Price = pricingDetail.Price;
            orderItem.Title = string.IsNullOrWhiteSpace(orderItem.Title) ? item.Name : orderItem.Title;
            if (string.IsNullOrWhiteSpace(orderItem.ItemName))
            {
                orderItem.ItemName = item.Name;
            }

            requestItem.Price = pricingDetail.Price;
            if (string.IsNullOrWhiteSpace(requestItem.ItemName))
            {
                requestItem.ItemName = item.Name;
            }
        }

        entity.ItemsSubtotal = entity.Items.Sum(item => item.Price * item.Quantity);
        entity.GrandTotal = entity.ItemsSubtotal + entity.ShippingFee + entity.ShippingInsurance;
        entity.TotalPrice = entity.GrandTotal;

        return new CreateOrderResponse
        {
            IsSuccess = true,
            Message = "OK"
        };
    }

    private string GetCustomerGroupCode()
    {
        var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
        if (claimsPrincipal is null)
        {
            return string.Empty;
        }

        string[] claimTypes = ["customer_group", "customer_group_code", "customerGroup", "customerGroupCode", "CUSTOMER_GROUP", "CUSTOMER_GROUP_CODE"];

        foreach (var claimType in claimTypes)
        {
            var value = claimsPrincipal.Claims
                .FirstOrDefault(claim => string.Equals(claim.Type, claimType, StringComparison.OrdinalIgnoreCase))
                ?.Value;

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }

    private static DokuObject ToDokuObject(CreateOrderRequest request, MalakaBooks.Entity.OrderEntity entity, MalakaBooks.ConfigSetting.DokuSetting dokuSetting)
    {
        var phoneNumberUtil = PhoneNumberUtil.GetInstance();

        var detail = request.Items.Select(item => new Line_Items
        {
            id = item.ItemId,
            name = string.IsNullOrWhiteSpace(item.ItemName) ? RemoveInvalidCharacters(item.Title) : RemoveInvalidCharacters(item.ItemName),
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



