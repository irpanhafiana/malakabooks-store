using MalakaBooks.ConfigSetting;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.Doku;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Json;
using System.Text;

namespace MalakaBooks.IS4RegistrationService;

public interface IDokuApiClient
{
    Task<DokuResponse?> CreatePaymentAsync(DokuObject request, CancellationToken cancellationToken = default);
    Task<DokuCheckPaymentStatusResponse?> CheckPaymentStatusAsync(DokuCheckPaymentStatusRequest request, CancellationToken cancellationToken = default);
}

public class DokuApiClient(HttpClient httpClient, IOptions<DokuSetting> dokuOptions) : IDokuApiClient
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly DokuSetting _dokuSetting = dokuOptions.Value;

    public async Task<DokuResponse?> CreatePaymentAsync(DokuObject request, CancellationToken cancellationToken = default)
    {
        var content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync(_dokuSetting.PaymentUrl, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonConvert.DeserializeObject<DokuResponse>(responseText);
    }

    public async Task<DokuCheckPaymentStatusResponse?> CheckPaymentStatusAsync(DokuCheckPaymentStatusRequest request, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync(_dokuSetting.CheckPaymentStatusPath, request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<DokuCheckPaymentStatusResponse>(cancellationToken: cancellationToken);
    }
}
