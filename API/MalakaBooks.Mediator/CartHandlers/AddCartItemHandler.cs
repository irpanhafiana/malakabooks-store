using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public class AddCartItemHandler(ICartRepository cartRepository) : IRequestHandler<AddCartItemCommand, CartResponse>
{
  public async Task<CartResponse> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
  {
    var items = await cartRepository.AddItemAsync(request.Request.UserId, request.Request.ToEntity(), cancellationToken);
    return items.ToResponse(request.Request.UserId);
  }
}
