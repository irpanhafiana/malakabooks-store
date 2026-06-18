using MalakaBooks.ConfigSetting;
using MalakaBooks.ViewModel;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace MalakaBooks.IS4RegistrationService;

public interface IDokuApiClient
{
    Task<DokuCheckPaymentStatusResponse?> CheckPaymentStatusAsync(DokuCheckPaymentStatusRequest request, CancellationToken cancellationToken = default);
}

public class DokuApiClient(HttpClient httpClient, IOptions<DokuSetting> dokuOptions) : IDokuApiClient
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly DokuSetting _dokuSetting = dokuOptions.Value;

    public async Task<DokuCheckPaymentStatusResponse?> CheckPaymentStatusAsync(DokuCheckPaymentStatusRequest request, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync(_dokuSetting.CheckPaymentStatusPath, request, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<DokuCheckPaymentStatusResponse>(cancellationToken: cancellationToken);
    }
}
