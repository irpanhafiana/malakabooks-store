using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrderByIdHandler(IOrderRepository orderRepository, IItemRepository itemRepository) : IRequestHandler<GetOrderByIdQuery, OrderResponse?>
{
    public async Task<OrderResponse?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        var itemIds = entity.Items.Select(item => item.ItemId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToArray();
        var coverImagesByItemId = await LoadCoverImagesByItemIdAsync(itemRepository, itemIds, cancellationToken);

        return entity.ToResponse(coverImagesByItemId);
    }

    private static async Task<IReadOnlyDictionary<string, string>> LoadCoverImagesByItemIdAsync(IItemRepository itemRepository, IEnumerable<string> itemIds, CancellationToken cancellationToken)
    {
        var coverImagesByItemId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var itemId in itemIds)
        {
            var item = await itemRepository.GetByIdAsync(itemId, cancellationToken);
            if (item is not null)
            {
                coverImagesByItemId[itemId] = item.CoverImage;
            }
        }

        return coverImagesByItemId;
    }
}
