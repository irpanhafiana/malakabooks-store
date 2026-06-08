using MalakaBooks.Entity;
using MongoDB.Driver;
using Subur.Extension;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.IRepository
{
  public interface IDataService<T> where T : BaseObject
  {
    Task<bool> CreateAsync(T[] data, string collectionName);
    Task UpdateAsync(T[] data, string collectionName, FilterDefinition<T>[] filters);
    Task<List<T>> GetAllAsync(string collectionName);
    Task<long> CountAsync(string collectionName, FilterDefinition<T> filter);
    Task<T> GetUniqueAsync(string collectionName, FilterDefinition<T> filter);
    Task<T> GetFirstOrDefaultFilterWithSortAsync(string collectionName, FilterDefinition<T> filter, SortDefinition<T> sortDefinition);
    Task<List<T>> GetListFilterByAsync(string collectionName, FilterDefinition<T> filter);
    IMongoCollection<T> GetCollection(string collectionName);
    Task<long> CountListFilterByAsync(string collectionName, FilterDefinition<T> filter);
    Task<PagedResult<T>> QueryByPageAsync(string collectionName, SortDefinition<T> sortDefinition, FilterDefinition<T> filter, long page, long pageSize);
    Task DeleteAllAsync(string collectionName);
    Task DeleteAllAsync(string collectionName, FilterDefinition<T> filter);
    Task DeleteManyAsync(string collectionName, FilterDefinition<T>[] filters);
    Task DeleteByFilterAsync(string collectionName, FilterDefinition<T> filter);
    ValidationResult GetErrorResult();
  }
}
