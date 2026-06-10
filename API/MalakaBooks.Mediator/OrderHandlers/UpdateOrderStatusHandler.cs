using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class UpdateOrderStatusHandler(IOrderRepository orderRepository, IOrderEntityValidator validator) : IRequestHandler<UpdateOrderStatusCommand, bool>
{
  private readonly IOrderEntityValidator _validator = validator;

  public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
  {
    var entity = await orderRepository.GetByIdAsync(request.Id, cancellationToken);
    if (entity is null) return false;

    var result = _validator.UpdateValidateAsync(entity);
    if (result is not null) return false;

    entity.Status = request.Request.Status.Trim();
    entity.UpdatedAt = DateTime.UtcNow;

    return await orderRepository.UpdateAsync(request.Id, entity, cancellationToken);
  }
}
