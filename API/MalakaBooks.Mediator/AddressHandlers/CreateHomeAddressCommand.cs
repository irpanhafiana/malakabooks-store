using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.AddressHandlers;

public record CreateHomeAddressCommand(CreateHomeAddressRequest Request) : IRequest<ValidationResult?>;

