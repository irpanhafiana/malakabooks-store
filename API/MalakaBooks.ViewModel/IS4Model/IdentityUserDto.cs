using Skoruba.IdentityServer4.Admin.BusinessLogic.Identity.Dtos.Identity;

namespace MalakaBooks.ViewModel.IS4Model
{
  public class IdentityUserDto : UserDto<string>
  {
  }

  public class IdentityUsersDto
  {
    public IdentityUsersDto()
    {
      this.Users = new HashSet<IdentityUserDto>();
    }

    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public ICollection<IdentityUserDto> Users { get; set; }
  }
}
