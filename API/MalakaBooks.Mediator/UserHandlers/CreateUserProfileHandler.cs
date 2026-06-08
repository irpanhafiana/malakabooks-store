using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class CreateUserProfileHandler(IUserRepository userRepository) : IRequestHandler<CreateUserProfileCommand, UserResponse>
{
    public async Task<UserResponse> Handle(CreateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var entity = new UserEntity
        {
            Id = request.Request.Id,  // IS4 sub claim
            Name = request.Request.Name,
            Phone = request.Request.Phone,
            Avatar = request.Request.Avatar,
            CreatedAt = DateTime.UtcNow
        };

        var created = await userRepository.CreateAsync(entity, cancellationToken);

        return new UserResponse
        {
            Id = created.Id ?? string.Empty,
            Name = created.Name,
            Phone = created.Phone,
            Avatar = created.Avatar,
            CreatedAt = created.CreatedAt
        };
    }
}
