using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.ReviewHandlers;

public class CreateReviewHandler(IReviewRepository reviewRepository, IReviewEntityValidator validator) : IRequestHandler<CreateReviewCommand, ValidationResult?>
{
    private readonly IReviewEntityValidator _validator = validator;

    public async Task<ValidationResult?> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var entity = request.Request.ToEntity();

        var result = await _validator.CreateValidateAsync(entity);
        if (result is null)
        {
            await reviewRepository.CreateAsync(entity, cancellationToken);
        }

        return result;
    }
}
