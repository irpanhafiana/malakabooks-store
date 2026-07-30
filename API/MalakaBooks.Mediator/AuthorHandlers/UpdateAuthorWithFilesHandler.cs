using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class UpdateAuthorWithFilesHandler(
    IAuthorRepository authorRepository,
    IFileStorageService fileStorageService) : IRequestHandler<UpdateAuthorWithFilesCommand, bool>
{
    public async Task<bool> Handle(UpdateAuthorWithFilesCommand request, CancellationToken cancellationToken)
    {
        var entity = await authorRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        string? photoUrl = null;
        if (request.Request.Photo != null)
        {
            photoUrl = await fileStorageService.SaveFileAsync(request.Request.Photo, "authors", cancellationToken);
        }

        entity.UpdateFrom(request.Request, photoUrl);
        return await authorRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
