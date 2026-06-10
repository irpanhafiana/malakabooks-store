using Skoruba.IdentityServer4.Admin.BusinessLogic.Identity.Dtos.Identity;

namespace MalakaBooks.ViewModel.IS4Model
{
  public class IdentityRoleDto : RoleDto<string>
  {
  }


  public class IdentityRolesDto : RolesDto<IdentityRoleDto, string>
  {

  }
}
