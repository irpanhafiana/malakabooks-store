using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetWarehousesQuery() : IRequest<IReadOnlyCollection<WarehouseResponse>>;
public record GetWarehouseByIdQuery(string Id) : IRequest<WarehouseResponse?>;
public record CreateWarehouseCommand(CreateWarehouseRequest Request) : IRequest<bool>;
public record UpdateWarehouseCommand(string Id, UpdateWarehouseRequest Request) : IRequest<bool>;
public record DeleteWarehouseCommand(string Id) : IRequest<bool>;

public class GetWarehousesHandler(IWarehouseRepository warehouseRepository) : IRequestHandler<GetWarehousesQuery, IReadOnlyCollection<WarehouseResponse>>
{
    public async Task<IReadOnlyCollection<WarehouseResponse>> Handle(GetWarehousesQuery request, CancellationToken cancellationToken) =>
        (await warehouseRepository.GetAllAsync(cancellationToken)).Select(entity => entity.ToResponse()).ToArray();
}

public class GetWarehouseByIdHandler(IWarehouseRepository warehouseRepository) : IRequestHandler<GetWarehouseByIdQuery, WarehouseResponse?>
{
    public async Task<WarehouseResponse?> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken) =>
        (await warehouseRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}

public class CreateWarehouseHandler(IWarehouseRepository warehouseRepository) : IRequestHandler<CreateWarehouseCommand, bool>
{
    public async Task<bool> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        await warehouseRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}

public class UpdateWarehouseHandler(IWarehouseRepository warehouseRepository) : IRequestHandler<UpdateWarehouseCommand, bool>
{
    public async Task<bool> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var entity = await warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await warehouseRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}

public class DeleteWarehouseHandler(IWarehouseRepository warehouseRepository) : IRequestHandler<DeleteWarehouseCommand, bool>
{
    public async Task<bool> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken) =>
        await warehouseRepository.DeleteAsync(request.Id, cancellationToken);
}
