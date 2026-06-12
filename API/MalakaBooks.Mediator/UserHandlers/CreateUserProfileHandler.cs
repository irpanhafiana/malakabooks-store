using MalakaBooks.Entity;
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.UserHandlers;

public class CreateUserProfileHandler(IUserRepository userRepository, IUserEntityValidator validator) : IRequestHandler<CreateUserProfileCommand, ValidationResult?>
{
    private readonly IUserEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var entity = new UserEntity
        {
            Id = request.Request.Id,
            FirstName = request.Request.FirstName,
            LastName = request.Request.LastName,
            Phone = request.Request.Phone,
            Avatar = request.Request.Avatar,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await userRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
