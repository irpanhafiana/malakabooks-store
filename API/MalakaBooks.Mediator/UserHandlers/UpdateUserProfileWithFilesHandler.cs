using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class UpdateUserProfileWithFilesHandler(
    IUserRepository userRepository, 
    IUserEntityValidator validator,
    IFileStorageService fileStorageService) : IRequestHandler<UpdateUserProfileWithFilesCommand, bool>
{
    private readonly IUserEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateUserProfileWithFilesCommand request, CancellationToken cancellationToken)
    {
        var entity = await userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.FirstName = request.Request.FirstName;
        entity.LastName = request.Request.LastName;
        
        if (request.Request.Avatar != null)
        {
            entity.Avatar = await fileStorageService.SaveFileAsync(request.Request.Avatar, "users", cancellationToken);
        }

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        return await userRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
