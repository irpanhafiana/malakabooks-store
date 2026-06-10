using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.OrderHandlers;

public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<ValidationResult?>;
