using MalakaBooks.Entity;
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.IS4RegistrationService;
using MalakaBooks.ViewModel;
using MalakaBooks.ViewModel.IS4Model;
using MediatR;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.UserHandlers
{
    public record RegisterUserCommand(CreateIS4UserRequest Request) : IRequest<ValidationResult?>;


    public class RegisterUserCommandHandler(IUserRepository userRepository, IProtectedApiClient protectedApi, IUserEntityValidator validator) : IRequestHandler<RegisterUserCommand, ValidationResult?>
    {
        private readonly IProtectedApiClient _protectedApiClient = protectedApi;
        private readonly IUserEntityValidator _validator = validator;

        public async Task<ValidationResult?> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var user = request.Request;
            var result = ValidationResult.Success;

            var is4UserModel = new IdentityUserDto
            {
                Email = user.Email,
                EmailConfirmed = true,
                PhoneNumber = user.Phone,
                PhoneNumberConfirmed = true,
                LockoutEnabled = true,
                UserName = user.Phone,
                TwoFactorEnabled = false,
                AccessFailedCount = 0
            };

            var userEntity = new UserEntity
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Avatar = request.Request.Avatar,
                CreatedAt = DateTime.UtcNow
            };

            result = await _validator.CreateValidateAsync(userEntity);
            if (result is null)
            {
                var response = await _protectedApiClient.PostAsync("/api/Users", is4UserModel);
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    var createdUser = JsonConvert.DeserializeObject<IdentityUserDto>(responseString);


                    #region Set Role

                    var existingRoles = await _protectedApiClient.GetAsync<IdentityRolesDto>("/api/Roles");
                    var customerRole = existingRoles.Roles.Single(_ => _.Name == "Malaka-Customer");

                    var userRole = new StringUserRoleApiDto() { RoleId = customerRole.Id, UserId = createdUser!.Id };
                    response = await _protectedApiClient.PostAsync("/api/Users/Roles", userRole);

                    #endregion


                    #region Set Password

                    IdentityUserChangePasswordDto passwordDto = new()
                    {
                        UserId = createdUser.Id,
                        UserName = createdUser.UserName,
                        Password = user.Password,
                        ConfirmPassword = user.Password
                    };

                    response = await _protectedApiClient.PostAsync("/api/Users/ChangePassword", passwordDto);

                    #endregion


                    #region add user claims

                    var userClaims = new List<StringUserClaimApiDto>
                    {
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "Create",
                            ClaimValue = "true"
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "Read",
                            ClaimValue = "true"
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "Update",
                            ClaimValue = "true"
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "Delete",
                            ClaimValue = "true"
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "name",
                            ClaimValue = user.Phone
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "customer_code",
                            ClaimValue = user.Phone
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "customer_group",
                            ClaimValue = "online"
                        },
                        new StringUserClaimApiDto
                        {
                            UserId = createdUser.Id,
                            ClaimType = "given_name",
                            ClaimValue = string.Format("{0} {1}", user.FirstName, user.LastName).Trim()
                        }
                    };

                    foreach (var claim in userClaims)
                    {
                        try
                        {
                            await _protectedApiClient.PostAsync("/api/Users/Claims", claim);
                            Console.WriteLine($"Claim posted successfully: {claim.ClaimType}");
                        }
                        catch (Exception ex)
                        {
                            // Log or handle the exception
                            Console.WriteLine($"Exception: {ex.Message}");
                        }
                    }

                    userEntity.UserId = createdUser.Id;
                    await userRepository.CreateAsync(userEntity, cancellationToken);

                    #endregion

                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    result = new ValidationResult($"Failed to create user. Status Code: {response.StatusCode}, Error: {errorContent}");
                }
            }

            return result;
        }
    }
}
