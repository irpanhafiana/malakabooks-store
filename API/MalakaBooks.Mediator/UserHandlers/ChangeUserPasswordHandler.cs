using MalakaBooks.IRepository;
using MalakaBooks.IS4RegistrationService;
using MalakaBooks.ViewModel.IS4Model;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.UserHandlers;

public class ChangeUserPasswordHandler(IUserRepository userRepository, IProtectedApiClient protectedApiClient) : IRequestHandler<ChangeUserPasswordCommand, ValidationResult?>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IProtectedApiClient _protectedApiClient = protectedApiClient;

    public async Task<ValidationResult?> Handle(ChangeUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var validationErrors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            validationErrors.Add("User identifier is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Request.Password))
        {
            validationErrors.Add("Password is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Request.ConfirmPassword))
        {
            validationErrors.Add("Confirm password is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Request.Password)
            && !string.IsNullOrWhiteSpace(request.Request.ConfirmPassword)
            && !string.Equals(request.Request.Password, request.Request.ConfirmPassword, StringComparison.Ordinal))
        {
            validationErrors.Add("Password and confirm password do not match.");
        }

        if (validationErrors.Count > 0)
        {
            return new ValidationResult(string.Join("\r\n", validationErrors));
        }

        var user = await _userRepository.GetByUserIdAsync(request.UserId.Trim(), cancellationToken);
        if (user is null)
        {
            return new ValidationResult("User profile not found.");
        }

        var passwordDto = new IdentityUserChangePasswordDto
        {
            UserId = request.UserId.Trim(),
            Password = request.Request.Password,
            ConfirmPassword = request.Request.ConfirmPassword
        };

        var response = await _protectedApiClient.PostAsync("/api/Users/ChangePassword", passwordDto);
        if (response.IsSuccessStatusCode)
        {
            return ValidationResult.Success;
        }

        var errorContent = await response.Content.ReadAsStringAsync();
        return new ValidationResult($"Failed to change password. Status Code: {response.StatusCode}, Error: {errorContent}");
    }
}
