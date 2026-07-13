using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public class RemoveCartItemHandler(ICartRepository cartRepository) : IRequestHandler<RemoveCartItemCommand, CartResponse>
{
    public async Task<CartResponse> Handle(RemoveCartItemCommand request, CancellationToken cancellationToken)
    {
        var items = await cartRepository.RemoveItemAsync(request.Request.UserId, request.Request.ItemId, cancellationToken);
        return items.ToResponse(request.Request.UserId);
    }
}
