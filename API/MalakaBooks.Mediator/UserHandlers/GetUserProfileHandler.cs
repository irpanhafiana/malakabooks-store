using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class GetUserProfileHandler(IUserRepository userRepository) : IRequestHandler<GetUserProfileQuery, UserResponse?>
{
  public async Task<UserResponse?> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
  {
    var entity = await userRepository.GetByIdAsync(request.Id, cancellationToken);
    if (entity is null) return null;

    return new UserResponse
    {
      Id = entity.Id ?? string.Empty,
      FirstName = entity.FirstName,
      LastName = entity.LastName,
      Phone = entity.Phone,
      Avatar = entity.Avatar,
      CreatedAt = entity.CreatedAt
    };
  }
}
