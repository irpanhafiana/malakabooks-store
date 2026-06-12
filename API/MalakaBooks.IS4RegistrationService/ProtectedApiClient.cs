using System.Net.Http.Json;

namespace MalakaBooks.IS4RegistrationService
{
    public interface IProtectedApiClient
    {
        Task<T> GetAsync<T>(string url) where T : class;
        Task<HttpResponseMessage> PostAsync(string url, object content);
        Task<HttpResponseMessage> PutAsync(string url, object content);
    }

    public class ProtectedApiClient : IProtectedApiClient
    {
        private readonly HttpClient _httpClient;

        public ProtectedApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        }

        public async Task<T> GetAsync<T>(string url) where T : class
        {
            return await _httpClient.GetFromJsonAsync<T>(url)
                ?? throw new InvalidOperationException($"No content returned from '{url}'.");
        }

        public async Task<HttpResponseMessage> PostAsync(string url, object content)
        {
            return await _httpClient.PostAsJsonAsync(url, content);
        }


        public async Task<HttpResponseMessage> PutAsync(string url, object content)
        {
            return await _httpClient.PutAsJsonAsync(url, content);
        }

    }
}
