using IdentityModel.Client;
using MalakaBooks.ViewModel.IS4Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;

namespace MalakaBooks.IS4RegistrationService
{
    public interface ITokenService
    {
        Task<string> FetchPasswordTokenAsync();

        Task<string> FetchAccessTokenAsync();
    }

    public class TokenService : ITokenService
    {
        private readonly IMemoryCache _cache;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly HttpClient _httpClient;
        private readonly PasswordTokenRequest _tokenRequest;
        private readonly ClientCredentialsTokenRequest _clientCredentialsTokenRequest;

        private const string TOKEN = "TOKEN";
        private const string ACCESSTOKEN = "ACCESSTOKEN";

        public TokenService(
          IMemoryCache cache,
          IHttpContextAccessor httpContextAccessor,
          HttpClient httpClient,
          PasswordTokenRequest tokenRequest,
          ClientCredentialsTokenRequest clientCredentialsTokenRequest)
        {
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
            _httpClient = httpClient;

            _tokenRequest = tokenRequest;
            _clientCredentialsTokenRequest = clientCredentialsTokenRequest;
        }

        #region Request Password Token

        public async Task<string> FetchPasswordTokenAsync()
        {
            string token = string.Empty;

            // if cache doesn't contain 
            // an entry called TOKEN
            // error handling mechanism is mandatory
            if (!_cache.TryGetValue(TOKEN, out token!))
            {
                var tokenmodel = await this.GetTokenFromApiAsync();

                // keep the value within cache for 
                // given amount of time
                // if value is not accessed within the expiry time
                // delete the entry from the cache
                var options = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(
                        TimeSpan.FromMinutes(tokenmodel.ExpiresIn));

                _cache.Set(TOKEN, tokenmodel.Value, options);

                token = tokenmodel.Value!;
            }

            return token;
        }

        private async Task<TokenModel> GetTokenFromApiAsync()
        {
            var tokenResponse = await _httpClient.RequestPasswordTokenAsync(_tokenRequest);
            var accessToken = tokenResponse.AccessToken;

            TokenModel token = new()
            {
                Value = accessToken!,
                ExpiresIn = 2,
            };

            return token;
        }

        #endregion


        #region Access Token

        public async Task<string> FetchAccessTokenAsync()
        {
            string token = string.Empty;

            // if cache doesn't contain 
            // an entry called TOKEN
            // error handling mechanism is mandatory
            if (!_cache.TryGetValue(ACCESSTOKEN, out token!))
            {
                var tokenmodel = await this.GetAccessTokenHttpContext();

                // keep the value within cache for 
                // given amount of time
                // if value is not accessed within the expiry time
                // delete the entry from the cache
                var options = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(
                        TimeSpan.FromMinutes(tokenmodel.ExpiresIn));

                _cache.Set(ACCESSTOKEN, tokenmodel.Value, options);

                token = tokenmodel.Value!;
            }

            return token;
        }

        private async Task<TokenModel> GetAccessTokenHttpContext()
        {
            var tokenResponse = await _httpClient.RequestClientCredentialsTokenAsync(_clientCredentialsTokenRequest);
            var accessToken = tokenResponse.AccessToken;

            TokenModel token = new()
            {
                Value = accessToken!,
                ExpiresIn = 2,
            };

            return token;
        }

        #endregion

    }
}


