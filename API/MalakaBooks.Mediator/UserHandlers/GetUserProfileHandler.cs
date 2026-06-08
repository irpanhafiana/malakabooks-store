using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class GetUserProfileHandler(IUserRepository userRepository) : IRequestHandler<GetUserProfileQuery, UserResponse?>
{
    public async Task<UserResponse?> Handle(GetUserProfileQuery request, CancellationToken cancellationToken) =>
        (await userRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}
