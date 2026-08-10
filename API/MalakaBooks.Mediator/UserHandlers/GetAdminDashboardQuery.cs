using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public record GetAdminDashboardQuery() : IRequest<AdminDashboardResponse>;
