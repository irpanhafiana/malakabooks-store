using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class GetAllUsersHandler(IUserRepository userRepository) : IRequestHandler<GetAllUsersQuery, IReadOnlyCollection<UserResponse>>
{
    public async Task<IReadOnlyCollection<UserResponse>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        return users.Select(u => new UserResponse
        {
            Id = u.Id ?? string.Empty,
            Name = u.Name,
            Phone = u.Phone,
            Avatar = u.Avatar,
            CreatedAt = u.CreatedAt
        }).ToList();
    }
}
