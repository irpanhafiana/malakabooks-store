using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public record AddCartItemCommand(AddCartItemRequest Request) : IRequest<CartResponse>;
