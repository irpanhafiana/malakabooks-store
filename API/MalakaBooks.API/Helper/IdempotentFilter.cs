using IdempotentAPI.Filters;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MalakaBooks.API.Helper
{
  /// <summary>
  /// Provides an action filter that applies idempotency expiration settings to HTTP requests based on configurable
  /// defaults.
  /// </summary>
  /// <remarks>This filter inspects incoming requests for the presence of an IdempotentAttribute and, if enabled,
  /// sets an expiration duration for idempotency keys in the HTTP context. The expiration duration is determined by the
  /// HTTP method and the provided default expiration settings. This filter is typically used to support idempotent
  /// operations in web APIs, ensuring that repeated requests with the same key are handled consistently within the
  /// specified expiration window.</remarks>
  public class IdempotentFilter : IActionFilter
  {
    private readonly Dictionary<string, int> defaultExpireHours;

    /// <summary>
    /// Initializes a new instance of the IdempotentFilter class with the specified default expiration settings for
    /// keys.
    /// </summary>
    /// <param name="defaultExpireHours">A dictionary that maps key names to their default expiration durations, in hours. Keys represent the filter
    /// keys, and values specify the number of hours before each key expires. Cannot be null; if not provided, an empty
    /// dictionary is used.</param>
    public IdempotentFilter(Dictionary<string, int> defaultExpireHours)
    {
      this.defaultExpireHours = defaultExpireHours ?? [];
    }

    /// <summary>
    /// Executes logic before the action method is called, applying idempotency settings to the current HTTP request if
    /// applicable.
    /// </summary>
    /// <remarks>If the action is marked with an <see cref="IdempotentAttribute"/> and the HTTP method is
    /// idempotent, this method sets the expiration period for idempotency in the <see cref="HttpContext.Items"/>
    /// collection. This allows downstream components to access the idempotency expiration setting for the
    /// request.</remarks>
    /// <param name="context">The context for the executing action, containing information about the HTTP request and action metadata.</param>
    public void OnActionExecuting(ActionExecutingContext context)
    {
      var httpMethod = context.HttpContext.Request.Method;
      var idempotentAttribute = context.ActionDescriptor.EndpointMetadata
        .OfType<IdempotentAttribute>()
        .FirstOrDefault();

      // Check if the request method is one of the specified idempotent methods
      if (idempotentAttribute != null && idempotentAttribute.Enabled &&
        IsIdempotentMethod(httpMethod))
      {
        int expireHours = GetExpireHoursForMethod(httpMethod);

        // Apply the expireHours to all idempotent methods.
        context.HttpContext.Items["IdempotentExpireHours"] = expireHours;
      }
    }

    /// <summary>
    /// Called after an action method has executed.
    /// </summary>
    /// <param name="context">The context for the executed action, containing information about the action and its result. Cannot be null.</param>
    public void OnActionExecuted(ActionExecutedContext context)
    {
      // You can add logic after the action has executed if needed.
    }

    private bool IsIdempotentMethod(string httpMethod)
    {
      // Specify the list of idempotent HTTP methods here
      var idempotentMethods = new[] { "GET", "POST", "PUT", "DELETE" };

      return idempotentMethods.Contains(httpMethod, StringComparer.OrdinalIgnoreCase);
    }

    private int GetExpireHoursForMethod(string httpMethod)
    {
      // Check if a specific ExpireHours is set for the method, otherwise use the default
      return defaultExpireHours.TryGetValue(httpMethod, out var expireHours)
        ? expireHours
        : defaultExpireHours.TryGetValue("DEFAULT", out var defaultExpire)
          ? defaultExpire
          : 2; // Default value if not specified
    }
  }
}
