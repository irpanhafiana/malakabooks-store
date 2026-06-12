using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class UpdateUserProfileHandler(IUserRepository userRepository, IUserEntityValidator validator) : IRequestHandler<UpdateUserProfileCommand, bool>
{
    private readonly IUserEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var entity = await userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.FirstName = request.Request.FirstName;
        entity.LastName = request.Request.LastName;
        entity.Avatar = request.Request.Avatar;

        var result = _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        return await userRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
