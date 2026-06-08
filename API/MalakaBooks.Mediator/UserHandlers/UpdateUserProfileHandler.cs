using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class UpdateUserProfileHandler(IUserRepository userRepository) : IRequestHandler<UpdateUserProfileCommand, UserResponse?>
{
    public async Task<UserResponse?> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var entity = await userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.UpdateFrom(request.Request);
        await userRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
