using MalakaBooks.ViewModel;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.BookHandlers;

public record CreateBookCommand(CreateBookRequest Request) : IRequest<ValidationResult?>;
