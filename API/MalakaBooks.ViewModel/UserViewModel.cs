namespace MalakaBooks.ViewModel;

public class UserResponse
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateIS4UserRequest
{
    public string Id { get; set; } = string.Empty;  // IS4 sub claim
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Called right after IS4 registration. Id = IS4 sub claim.
/// Role/Email/Password are managed by IS4, not stored here.
/// </summary>
public class CreateUserProfileRequest
{
    public string Id { get; set; } = string.Empty;  // IS4 sub claim
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}

/// <summary>
/// Update profile fields only. Role/Email/Password handled by IS4.
/// </summary>
public class UpdateUserRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}
