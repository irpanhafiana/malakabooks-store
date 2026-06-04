using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class UpdateUserProfileHandler(IUserRepository userRepository) : IRequestHandler<UpdateUserProfileCommand, UserResponse?>
{
    public async Task<UserResponse?> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var entity = await userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return null;

        entity.Name = request.Request.Name;
        entity.Phone = request.Request.Phone;
        entity.Avatar = request.Request.Avatar;

        await userRepository.UpdateAsync(request.Id, entity, cancellationToken);

        return new UserResponse
        {
            Id = entity.Id ?? string.Empty,
            Name = entity.Name,
            Phone = entity.Phone,
            Avatar = entity.Avatar,
            CreatedAt = entity.CreatedAt
        };
    }
}
