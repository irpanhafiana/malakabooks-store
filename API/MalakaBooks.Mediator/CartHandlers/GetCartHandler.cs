using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public class GetCartHandler(ICartRepository cartRepository) : IRequestHandler<GetCartQuery, CartResponse>
{
    public async Task<CartResponse> Handle(GetCartQuery request, CancellationToken cancellationToken) =>
        (await cartRepository.GetByUserIdAsync(request.UserId, cancellationToken)).ToResponse(request.UserId);
}
