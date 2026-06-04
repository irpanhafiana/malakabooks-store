using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public record RemoveCartItemCommand(RemoveCartItemRequest Request) : IRequest<CartResponse>;
