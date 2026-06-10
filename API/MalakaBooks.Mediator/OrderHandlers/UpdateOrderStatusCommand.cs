using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public record UpdateOrderStatusCommand(string Id, UpdateOrderStatusRequest Request) : IRequest<bool>;
