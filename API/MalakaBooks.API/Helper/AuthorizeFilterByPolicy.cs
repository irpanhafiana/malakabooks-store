using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Authorization;

namespace MalakaBooks.API.Helper
{
    /// <summary>
    /// Applies authorization policies to a controller by adding predefined authorization filters for roles, scopes, and
    /// claims.
    /// </summary>
    /// <remarks>This convention is intended to be used with ASP.NET Core MVC to ensure that controllers are
    /// protected by the specified authorization policies. The filters added require that incoming requests satisfy the
    /// 'RolesPolicy', 'ScopesPolicy', and 'ClaimsPolicy' policies. Use this convention to enforce consistent
    /// authorization requirements across multiple controllers.</remarks>
    public class AuthorizeFilterByPolicy : IControllerModelConvention
    {
        /// <summary>
        /// Adds authorization filters for roles, scopes, and claims policies to the specified controller model.
        /// </summary>
        /// <remarks>This method is typically used to enforce multiple authorization policies on all actions
        /// within a controller. The filters are added in the order: roles, scopes, then claims.</remarks>
        /// <param name="controller">The controller model to which the authorization filters will be applied. Cannot be null.</param>
        public void Apply(ControllerModel controller)
        {
            controller.Filters.Add(new AuthorizeFilter("MalakaAdminPolicy"));
            controller.Filters.Add(new AuthorizeFilter("MalakaCustomerPolicy"));
        }
    }
}
