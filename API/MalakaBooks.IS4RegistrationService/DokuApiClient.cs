using MalakaBooks.ConfigSetting;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MalakaBooks.IS4RegistrationService;

public class DokuApiClient
{
    private readonly HttpClient _httpClient;
    private readonly DokuSetting _dokuSetting;

    public DokuApiClient(HttpClient httpClient, IOptions<DokuSetting> dokuOptions)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _dokuSetting = dokuOptions.Value;
    }


    public async Task<T?> GetAsync<T>(string url) where T : class
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddDynamicHeaders(request, url.Replace(_dokuSetting.BaseUrl, ""));

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<T>();
    }


    public async Task<HttpResponseMessage> PostAsync(string url, object content)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(content)
        };
        AddDynamicHeaders(request, url.Replace(_dokuSetting.BaseUrl, ""), content);

        var response = await _httpClient.SendAsync(request);
        return response;
    }


    public async Task<HttpResponseMessage> PutAsync(string url, object content)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, url)
        {
            Content = JsonContent.Create(content)
        };
        AddDynamicHeaders(request, url.Replace(_dokuSetting.BaseUrl, ""));

        var response = await _httpClient.SendAsync(request);
        return response;
    }


    private void AddDynamicHeaders(HttpRequestMessage request, string url, object? content = null)
    {
        // Add Request-Id
        var requestId = Guid.NewGuid().ToString();
        request.Headers.Add("Request-Id", requestId);

        // Add Request-Timestamp
        var timeStamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        request.Headers.Add("Request-Timestamp", timeStamp);

        // Add Request-Target
        var requestTarget = url;
        var digest = string.Empty;

        // Add Digest (for POST only)
        if (request.Method == HttpMethod.Post && content != null)
        {
            digest = CreateDigest(content);
        }

        request.Headers.Add("Signature", GenerateSignature(_dokuSetting.ClientId, requestId, timeStamp, requestTarget, digest));
    }


    private string GenerateSignature(string clientId, string requestId, string requestTimestamp, string requestTarget, string digest)
    {
        // Step 1: Arrange the signature components in the specified format
        string signatureString = $"Client-Id:{clientId}\n" +
                                 $"Request-Id:{requestId}\n" +
                                 $"Request-Timestamp:{requestTimestamp}\n" +
                                 $"Request-Target:{requestTarget}";

        if (!string.IsNullOrEmpty(digest)) signatureString += $"\nDigest:{digest}";

        // Step 2: Calculate HMAC-SHA256 using the secret key
        using (HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_dokuSetting.SecretKey)))
        {
            byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(signatureString));

            // Step 3: Encode the HMAC result as Base64
            string base64Hash = Convert.ToBase64String(hashBytes);

            // Step 4: Format the final signature
            return $"HMACSHA256={base64Hash}";
        }
    }

    private string CreateDigest(object body)
    {
        var jsonBody = JsonSerializer.Serialize(body);
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(jsonBody));
        return Convert.ToBase64String(hash);
    }

}

