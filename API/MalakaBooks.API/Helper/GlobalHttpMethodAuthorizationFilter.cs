using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Subur.Extension;

namespace MalakaBooks.API.Helper
{
    /// <summary>
    /// Implements a global authorization filter that enforces HTTP method-based access control using user claims.
    /// </summary>
    /// <remarks>This filter checks the current user's claims for permissions corresponding to the HTTP method of the
    /// incoming request. If the user lacks the required claim ("Create" for POST, "Read" for GET, "Update" for PUT, or
    /// "Delete" for DELETE), the request is forbidden. Actions decorated with the AllowAnonymousAttribute are excluded from
    /// this authorization check. This filter is intended for use in ASP.NET Core applications to provide a centralized,
    /// claim-based authorization mechanism for controller actions.</remarks>
    public class GlobalHttpMethodAuthorizationFilter : IAuthorizationFilter
    {
        /// <summary>
        /// Performs authorization by validating user claims for the current HTTP request method.
        /// </summary>
        /// <remarks>If the action allows anonymous access, authorization is skipped. For other requests, the
        /// method checks for specific user claims corresponding to the HTTP method (e.g., 'Create' for POST, 'Read' for
        /// GET). If the required claim is missing, the request is forbidden.</remarks>
        /// <param name="context">The context for the authorization filter, containing information about the current HTTP request and action.</param>
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Skip if AllowAnonymous is present
            if (context.ActionDescriptor.EndpointMetadata.Any(m => m is AllowAnonymousAttribute)) return;

            if (context.HttpContext.Request.Path.StartsWithSegments("/swagger")) return;

            switch (context.HttpContext.Request.Method.ToUpper())
            {
                case "POST":
                    if (!context.HttpContext.User.HasClaimType("Create", "true"))
                        context.Result = new ForbidResult();

                    break;

                case "DELETE":
                    if (!context.HttpContext.User.HasClaimType("Delete", "true"))
                        context.Result = new ForbidResult();

                    break;

                case "PUT":
                    if (!context.HttpContext.User.HasClaimType("Update", "true"))
                        context.Result = new ForbidResult();

                    break;

                case "GET":
                    if (!context.HttpContext.User.HasClaimType("Read", "true"))
                        context.Result = new ForbidResult();

                    break;
            }
        }
    }
}
