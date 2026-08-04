using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record GetCustomerDashboardQuery(string UserId) : IRequest<CustomerDashboardResponse>;
