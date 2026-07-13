using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class GetOrdersByUserHandler(IOrderRepository orderRepository, IItemRepository itemRepository) : IRequestHandler<GetOrdersByUserQuery, IReadOnlyCollection<OrderResponse>>
{
    public async Task<IReadOnlyCollection<OrderResponse>> Handle(GetOrdersByUserQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        var itemIds = orders.SelectMany(order => order.Items).Select(item => item.ItemId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToArray();
        var coverImagesByItemId = await LoadCoverImagesByItemIdAsync(itemRepository, itemIds, cancellationToken);

        return [.. orders.OrderByDescending(_ => _.DateCreated).Select(orderEntity => orderEntity.ToResponse(coverImagesByItemId))];
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
