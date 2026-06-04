using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CartHandlers;

public record GetCartQuery(string UserId) : IRequest<CartResponse>;
