using IdentityModel.Client;

namespace MalakaBooks.IS4RegistrationService
{
  public class ProtectedApiBearerTokenHandler : DelegatingHandler
  {
    private readonly ITokenService _tokenService;
    public ProtectedApiBearerTokenHandler(ITokenService tokenService)
    {
      _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
    }

    protected override async Task<HttpResponseMessage> SendAsync(
      HttpRequestMessage request,
      CancellationToken cancellationToken)
    {
      var accessToken = await _tokenService.FetchPasswordTokenAsync();

      // set the bearer token to the outgoing request
      request.SetBearerToken(accessToken);

      // Proceed calling our "default" handler, that will actually send the request
      // to our protected api
      return await base.SendAsync(request, cancellationToken);
    }

  }
}
