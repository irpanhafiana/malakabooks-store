using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetUomGroupsQuery() : IRequest<IReadOnlyCollection<UomGroupResponse>>;
public record GetUomGroupByIdQuery(string Id) : IRequest<UomGroupResponse?>;
public record CreateUomGroupCommand(CreateUomGroupRequest Request) : IRequest<bool>;
public record UpdateUomGroupCommand(string Id, UpdateUomGroupRequest Request) : IRequest<bool>;
public record DeleteUomGroupCommand(string Id) : IRequest<bool>;

public class GetUomGroupsHandler(IUomGroupRepository uomGroupRepository) : IRequestHandler<GetUomGroupsQuery, IReadOnlyCollection<UomGroupResponse>>
{
    public async Task<IReadOnlyCollection<UomGroupResponse>> Handle(GetUomGroupsQuery request, CancellationToken cancellationToken) =>
        (await uomGroupRepository.GetAllAsync(cancellationToken)).Select(entity => entity.ToResponse()).ToArray();
}

public class GetUomGroupByIdHandler(IUomGroupRepository uomGroupRepository) : IRequestHandler<GetUomGroupByIdQuery, UomGroupResponse?>
{
    public async Task<UomGroupResponse?> Handle(GetUomGroupByIdQuery request, CancellationToken cancellationToken) =>
        (await uomGroupRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}

public class CreateUomGroupHandler(IUomGroupRepository uomGroupRepository) : IRequestHandler<CreateUomGroupCommand, bool>
{
    public async Task<bool> Handle(CreateUomGroupCommand request, CancellationToken cancellationToken)
    {
        await uomGroupRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}

public class UpdateUomGroupHandler(IUomGroupRepository uomGroupRepository) : IRequestHandler<UpdateUomGroupCommand, bool>
{
    public async Task<bool> Handle(UpdateUomGroupCommand request, CancellationToken cancellationToken)
    {
        var entity = await uomGroupRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await uomGroupRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}

public class DeleteUomGroupHandler(IUomGroupRepository uomGroupRepository) : IRequestHandler<DeleteUomGroupCommand, bool>
{
    public async Task<bool> Handle(DeleteUomGroupCommand request, CancellationToken cancellationToken) =>
        await uomGroupRepository.DeleteAsync(request.Id, cancellationToken);
}
