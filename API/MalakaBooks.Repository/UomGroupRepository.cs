using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Globalization;

namespace MalakaBooks.Repository;

public class UomGroupRepository : IUomGroupRepository
{
    private readonly IMongoCollection<UomGroupEntity> _collection;

    public UomGroupRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<UomGroupEntity>(mongoDbSetting.Value.UomGroupsCollection);
    }

    public async Task<IReadOnlyCollection<UomGroupEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<UomGroupEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<UomGroupEntity>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<UomGroupEntity>.Filter.In(x => x.Id, ids)).ToListAsync(cancellationToken);

    public async Task<UomGroupEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<UomGroupEntity?> GetByDefinitionAsync(UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        var signature = BuildSignature(uomGroup);
        var allGroups = await _collection.Find(Builders<UomGroupEntity>.Filter.Empty).ToListAsync(cancellationToken);
        return allGroups.FirstOrDefault(existing => BuildSignature(existing) == signature);
    }

    public async Task<UomGroupEntity> UpsertByDefinitionAsync(UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        var existing = await GetByDefinitionAsync(uomGroup, cancellationToken);
        if (existing is not null)
        {
            uomGroup.Id = existing.Id;
            uomGroup.Alias = existing.Alias;
            await UpdateAsync(existing.Id!, uomGroup, cancellationToken);
            return uomGroup;
        }

        return await CreateAsync(uomGroup, cancellationToken);
    }

    public async Task<UomGroupEntity> CreateAsync(UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(uomGroup, cancellationToken: cancellationToken);
        return uomGroup;
    }

    public async Task<bool> UpdateAsync(string id, UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        uomGroup.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, uomGroup, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }

    private static string BuildSignature(UomGroupEntity uomGroup)
    {
        var normalizedName = Normalize(uomGroup.Name);
        var normalizedBaseUomCode = Normalize(uomGroup.BaseUomCode);
        var normalizedDetails = uomGroup.Details
            .OrderBy(detail => detail.SortOrder)
            .ThenBy(detail => Normalize(detail.Code))
            .Select(detail => string.Join("|",
                Normalize(detail.Code),
                Normalize(detail.Name),
                detail.ConversionFactor.ToString(CultureInfo.InvariantCulture),
                detail.IsBaseUom,
                detail.SortOrder,
                detail.IsActive));

        return string.Join("::", new[] { normalizedName, normalizedBaseUomCode }.Concat(normalizedDetails));
    }

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToUpperInvariant();
}
