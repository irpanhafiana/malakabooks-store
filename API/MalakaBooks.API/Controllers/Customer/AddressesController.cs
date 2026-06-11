using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AddressHandlers;
using MalakaBooks.ViewModel;
using Mardika.Portfolio.AppsSetting;
using Mardika.Simasrim.Service.Model;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// API controller that manages address resources for customers, providing endpoints to create, retrieve, update, and
/// delete addresses associated with a user.
/// </summary>
/// <remarks>All endpoints require the user to be authenticated and are versioned via the API route. The
/// controller is intended for use by customer-facing clients to manage their own address data.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to address operations.</param>
/// <param name="simasrimApiClient"></param>
/// <param name="simasrimSetting"></param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class AddressesController(IMediator mediator, SimasrimApiClient simasrimApiClient, SimasrimSetting simasrimSetting) : ApiControllerBase
{

  /// <summary>Get own addresses</summary>
  [HttpGet("user/{userId}")]
  public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetAddressesByUserQuery(userId), cancellationToken));

  /// <summary>Create address</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateAddressRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new CreateAddressCommand(request), cancellationToken);
    return ProcessResult(result);
  }

  /// <summary>Update address</summary>
  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] UpdateAddressRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new UpdateAddressCommand(id, request), cancellationToken);
    return Success(result);
  }

  /// <summary>Delete address</summary>
  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    => Success(await mediator.Send(new DeleteAddressCommand(id), cancellationToken));


  #region Simasrim

  /// <summary>
  /// Retrieves the list of provinces available in Simasrim shipping service.
  /// </summary>
  /// <remarks>
  /// This endpoint fetches all provinces supported by Simasrim for shipping operations.
  /// The province data is used to populate location selection dropdowns and validate shipping addresses.
  /// </remarks>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
  /// <returns>
  /// An <see cref="IActionResult"/> containing a <see cref="BaseResponse"/> with the list of provinces.
  /// The response includes status code, status message, and province data.
  /// </returns>
  [HttpGet]
  [Route("Simasrim/Province")]
  public async Task<IActionResult> GetSimasrimProvince(CancellationToken cancellationToken)
  {
    var response = await simasrimApiClient.GetAsync<BaseResponse>("api/b2b/pengiriman/ekspedisi/wilayah/province", cancellationToken);
    return Ok(response);
  }

  /// <summary>
  /// Handles a POST request to retrieve city information from the Simasrim API based on the specified criteria.
  /// </summary>
  /// <param name="model">The city search criteria to use when querying the Simasrim API. Cannot be null.</param>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
  /// <returns>An <see cref="IActionResult"/> containing a <see cref="BaseResponse"/> with the list of cities.
  /// matches the specified criteria.</returns>
  [HttpPost]
  [Route("Simasrim/City")]
  public async Task<IActionResult> GetSimasrimCity(CityModel model, CancellationToken cancellationToken)
  {
    var response = await simasrimApiClient.PostAsync<BaseResponse>("api/b2b/pengiriman/ekspedisi/wilayah/city", model, cancellationToken);
    return Ok(response);
  }

  /// <summary>
  /// Retrieves the list of available courier codes for Simasrim shipping services.
  /// </summary>
  /// <remarks>The returned list includes all supported courier codes for Simasrim. This endpoint is
  /// intended for use when clients need to display or validate available couriers for Simasrim
  /// shipments.</remarks>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
  /// <returns>An <see cref="IActionResult"/> containing a response with the list of courier codes. The response includes a
  /// status code, status message, and an array of courier code strings.</returns>
  [HttpGet]
  [Route("Simasrim/Courier")]
  public async Task<IActionResult> GetSimasrimCity(CancellationToken cancellationToken)
  {
    var response = new BaseResponse
    {
      Code = "200",
      Status = "Success",
      Data = [.. simasrimSetting.Courier]
    };

    return Ok(response);
  }

  /// <summary>
  /// Handles a POST request to retrieve district information from the Simasrim API based on the specified
  /// criteria.
  /// </summary>
  /// <param name="model">The district search criteria to use when querying the Simasrim API. Cannot be null.</param>
  /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
  /// <returns>An <see cref="IActionResult"/> containing the district information returned by the Simasrim API.</returns>
  [HttpPost]
  [Route("Simasrim/District")]
  public async Task<IActionResult> GetSimasrimDistrict(DistrictModel model, CancellationToken cancellationToken)
  {
    var response = await simasrimApiClient.PostAsync<DistrictResponse>("api/b2b/pengiriman/ekspedisi/wilayah/district", model, cancellationToken);
    return Ok(response);
  }

  /// <summary>
  /// Handles a request to retrieve shipping tariff information from the Simasrim service based on the specified
  /// tariff criteria.
  /// </summary>
  /// <param name="model">The tariff criteria to use when querying for shipping rates. Must not be null.</param>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
  /// <returns>An <see cref="IActionResult"/> containing the shipping tariff information returned by the Simasrim service.</returns>
  [HttpPost]
  [Route("Simasrim/Tarif")]
  public async Task<IActionResult> GetSimasrimTarif(TariffModel model, CancellationToken cancellationToken)
  {
    var response = await simasrimApiClient.PostAsync<TariffResponse>("api/b2b/pengiriman/ekspedisi/cek-tarif", model, cancellationToken);

    return Ok(response);
  }

  #endregion
}
