using MalakaBooks.ViewModel;
using MediatR;
using Subur.Extension;

namespace MalakaBooks.Mediator.OrderHandlers;

public record GetAllOrdersQuery(long PageNumber, long PageSize) : IRequest<PagedResult<AdminOrderResponse>>;
