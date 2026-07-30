using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class CreateAuthorWithFilesHandler(
    IAuthorRepository authorRepository,
    IFileStorageService fileStorageService) : IRequestHandler<CreateAuthorWithFilesCommand, bool>
{
    public async Task<bool> Handle(CreateAuthorWithFilesCommand request, CancellationToken cancellationToken)
    {
        string photoUrl = string.Empty;
        if (request.Request.Photo != null)
        {
            photoUrl = await fileStorageService.SaveFileAsync(request.Request.Photo, "authors", cancellationToken);
        }

        var entity = request.Request.ToEntity(photoUrl);
        await authorRepository.CreateAsync(entity, cancellationToken);
        return true;
    }
}
