using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CatalogHandlers;

public record GetWarehouseStocksQuery() : IRequest<IReadOnlyCollection<WarehouseStockResponse>>;
public record GetWarehouseStockByIdQuery(string Id) : IRequest<WarehouseStockResponse?>;
public record CreateWarehouseStockCommand(CreateWarehouseStockRequest Request) : IRequest<bool>;
public record UpdateWarehouseStockCommand(string Id, UpdateWarehouseStockRequest Request) : IRequest<bool>;
public record DeleteWarehouseStockCommand(string Id) : IRequest<bool>;

public class GetWarehouseStocksHandler(IWarehouseStockRepository warehouseStockRepository) : IRequestHandler<GetWarehouseStocksQuery, IReadOnlyCollection<WarehouseStockResponse>>
{
    public async Task<IReadOnlyCollection<WarehouseStockResponse>> Handle(GetWarehouseStocksQuery request, CancellationToken cancellationToken) =>
        (await warehouseStockRepository.GetAllAsync(cancellationToken)).Select(entity => entity.ToResponse()).ToArray();
}

public class GetWarehouseStockByIdHandler(IWarehouseStockRepository warehouseStockRepository) : IRequestHandler<GetWarehouseStockByIdQuery, WarehouseStockResponse?>
{
    public async Task<WarehouseStockResponse?> Handle(GetWarehouseStockByIdQuery request, CancellationToken cancellationToken) =>
        (await warehouseStockRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}

public class CreateWarehouseStockHandler(IWarehouseStockRepository warehouseStockRepository) : IRequestHandler<CreateWarehouseStockCommand, bool>
{
    public async Task<bool> Handle(CreateWarehouseStockCommand request, CancellationToken cancellationToken)
    {
        await warehouseStockRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}

public class UpdateWarehouseStockHandler(IWarehouseStockRepository warehouseStockRepository) : IRequestHandler<UpdateWarehouseStockCommand, bool>
{
    public async Task<bool> Handle(UpdateWarehouseStockCommand request, CancellationToken cancellationToken)
    {
        var entity = await warehouseStockRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await warehouseStockRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}

public class DeleteWarehouseStockHandler(IWarehouseStockRepository warehouseStockRepository) : IRequestHandler<DeleteWarehouseStockCommand, bool>
{
    public async Task<bool> Handle(DeleteWarehouseStockCommand request, CancellationToken cancellationToken) =>
        await warehouseStockRepository.DeleteAsync(request.Id, cancellationToken);
}
