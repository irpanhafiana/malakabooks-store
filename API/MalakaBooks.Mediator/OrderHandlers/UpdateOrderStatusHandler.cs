using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class UpdateOrderStatusHandler(IOrderRepository orderRepository, IOrderEntityValidator validator) : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IOrderEntityValidator _validator = validator;
    private static readonly Dictionary<string, string[]> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pending_payment"] = ["cancelled", "expired"],
        ["ready_to_ship"] = ["shipped", "cancelled"],
        ["shipped"] = [],
        ["expired"] = [],
        ["cancelled"] = []
    };

    public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        var targetStatus = request.Request.Status.Trim();
        if (!CanTransition(entity.Status, targetStatus)) return false;

        entity.Status = targetStatus;

        if (string.Equals(targetStatus, "cancelled", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(targetStatus, "expired", StringComparison.OrdinalIgnoreCase))
        {
            entity.ExpiresAt = null;
        }

        entity.UpdatedAt = DateTime.UtcNow;

        return await orderRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }

    private static bool CanTransition(string currentStatus, string targetStatus)
    {
        if (string.Equals(currentStatus, targetStatus, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return AllowedTransitions.TryGetValue(currentStatus, out var allowedStatuses) &&
               allowedStatuses.Contains(targetStatus, StringComparer.OrdinalIgnoreCase);
    }
}
