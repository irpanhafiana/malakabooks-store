using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.OrderHandlers;

public class CreateOrderHandler(IOrderRepository orderRepository, IOrderEntityValidator validator) : IRequestHandler<CreateOrderCommand, ValidationResult?>
{
    private readonly IOrderEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await orderRepository.CreateAsync(entity, cancellationToken);
        }
        return result;
    }
}
