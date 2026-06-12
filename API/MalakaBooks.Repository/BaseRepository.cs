using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using Subur.Extension;
using Subur.Storage.MongoDbProvider;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Repository
{
    public class BaseRepository<T> : IDataService<T> where T : BaseObject
    {
        protected MongoDbContext Context { get; set; }

        private readonly IMongoClient mongoClient;
        protected List<string> Errors = [];

        private readonly IHttpContextAccessor _contextAccessor;
        public BaseRepository(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor)
        {
            Context = mongoDbContext;
            this.mongoClient = mongoClient;
            _contextAccessor = contextAccessor;
        }

        //protected string? GetBranchUser()
        //{
        //    string? username = _contextAccessor.HttpContext!.User.Claims.SingleOrDefault(_ => _.Type.ToUpper() == "BRANCH")?.Value;

        //    return username;
        //}

        protected string? GetUsername()
        {
            string? username = _contextAccessor.HttpContext!.User.Claims.SingleOrDefault(_ => _.Type.ToUpper() == "NAME")?.Value;

            return username;
        }

        protected string? GetHandoverCode()
        {
            string? hoCode = _contextAccessor.HttpContext!.User.Claims.SingleOrDefault(_ => _.Type.ToUpper() == "HO_CODE")?.Value;

            return hoCode;
        }

        //protected string? GetCustomerCode()
        //{
        //    string? customerCode = _contextAccessor.HttpContext!.User.Claims.SingleOrDefault(_ => _.Type.ToUpper() == "CUSTOMER_CODE")?.Value;

        //    return customerCode;
        //}

        public async Task<bool> CreateAsync(T[] data, string collectionName)
        {
            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    data.ToList().ForEach(_ =>
                    {
                        if (string.IsNullOrEmpty(_.CreatedById)) _.CreatedById = GetUsername();
                    });

                    data.ToList().ForEach(_ =>
                    {
                        if (string.IsNullOrEmpty(_.ModifiedById)) _.ModifiedById = GetUsername();
                    });

                    var collection = Context.GetCollection<T>(collectionName);
                    await collection.InsertManyAsync(data);

                    await session.CommitTransactionAsync();

                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Create operation failed: {ex}");
                    await session.AbortTransactionAsync();

                    return false;
                }
            }
        }

        public async Task UpdateAsync(T[] data, string collectionName, FilterDefinition<T>[] filters)
        {
            if (data.Length != filters.Length)
            {
                throw new ArgumentException("The number of filters must match the number of data items.");
            }

            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    data.ToList().ForEach(_ => _.ModifiedById = GetUsername());
                    var collection = Context.GetCollection<T>(collectionName);
                    for (var i = 0; i < data.Length; i++)
                    {
                        var filter = filters[i];
                        var item = data[i];
                        var result = await collection.ReplaceOneAsync(filter, item);
                    }

                    await session.CommitTransactionAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Update operation failed: {ex}");
                    await session.AbortTransactionAsync();
                }
            }
        }

        public async Task<List<T>> GetAllAsync(string collectionName)
        {
            List<T> data = await Context.GetCollection<T>(collectionName).Find(_ => true).ToListAsync();
            return data;
        }

        public async Task<long> CountAsync(string collectionName, FilterDefinition<T> filter)
        {
            long total = await Context.GetCollection<T>(collectionName).CountDocumentsAsync(filter);

            return total;
        }

        public async Task<T> GetUniqueAsync(string collectionName, FilterDefinition<T> filter)
        {
            return await Context.GetCollection<T>(collectionName).Find(filter).SingleOrDefaultAsync();
        }

        public async Task<T> GetFirstOrDefaultFilterWithSortAsync(
          string collectionName,
          FilterDefinition<T> filter,
          SortDefinition<T> sortDefinition)
        {
            return await Context.GetCollection<T>(collectionName).Find(filter).Sort(sortDefinition).FirstOrDefaultAsync();
        }

        public async Task<List<T>> GetListFilterByAsync(string collectionName, FilterDefinition<T> filter)
        {
            var data = await Context.GetCollection<T>(collectionName).Find(filter).ToListAsync();
            return data;
        }

        public IMongoCollection<T> GetCollection(string collectionName)
        {
            var data = Context.GetCollection<T>(collectionName);
            return data;
        }


        public async Task<long> CountListFilterByAsync(string collectionName, FilterDefinition<T> filter)
        {
            return await Context.GetCollection<T>(collectionName).Find(filter).CountDocumentsAsync();
        }

        public async Task<PagedResult<T>> QueryByPageAsync(
          string collectionName,
          SortDefinition<T> sortDefinition,
          FilterDefinition<T> filter,
          long page,
          long pageSize)
        {
            var countFacet = AggregateFacet.Create("count",
              PipelineDefinition<T, AggregateCountResult>.Create(new[]
              {
          PipelineStageDefinitionBuilder.Count<T>()
              }));

            var dataFacet = AggregateFacet.Create("data",
              PipelineDefinition<T, T>.Create(new[]
              {
          PipelineStageDefinitionBuilder.Sort(sortDefinition),
                  //PipelineStageDefinitionBuilder.Skip<T>((page - 1) * pageSize),
                  //PipelineStageDefinitionBuilder.Limit<T>(pageSize),
                      }));

            var collection = Context.GetCollection<T>(collectionName);

            var aggregation = await collection.Aggregate()
              .Match(filter)
              .Facet(countFacet, dataFacet)
              .ToListAsync();

            var count = aggregation.First()
              .Facets.First(x => x.Name == "count")
              .Output<AggregateCountResult>()
              ?.FirstOrDefault()
              ?.Count ?? 0;

            var totalPages = count / pageSize;

            var data = aggregation.First()
              .Facets.First(x => x.Name == "data")
              .Output<T>();

            return data.ToPagedList((int)count, (int)page, (int)pageSize);
        }

        public async Task DeleteAllAsync(string collectionName)
        {
            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    var collection = Context.GetCollection<T>(collectionName);
                    await collection.DeleteManyAsync(Builders<T>.Filter.Empty);

                    await session.CommitTransactionAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Create operation failed: {ex}");
                    await session.AbortTransactionAsync();
                }
            }
        }

        public async Task DeleteAllAsync(string collectionName, FilterDefinition<T> filter)
        {
            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    var collection = Context.GetCollection<T>(collectionName);
                    await collection.DeleteManyAsync(filter);
                    await session.CommitTransactionAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Create operation failed: {ex}");
                    await session.AbortTransactionAsync();
                }
            }
        }

        public async Task DeleteManyAsync(string collectionName, FilterDefinition<T>[] filters)
        {
            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    foreach (var filter in filters)
                    {
                        var collection = Context.GetCollection<T>(collectionName);
                        await collection.DeleteManyAsync(filter);
                    }
                    await session.CommitTransactionAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Create operation failed: {ex}");
                    await session.AbortTransactionAsync();
                }
            }
        }

        public async Task DeleteByFilterAsync(string collectionName, FilterDefinition<T> filter)
        {
            using (var session = await mongoClient.StartSessionAsync())
            {
                session.StartTransaction();

                try
                {
                    var collection = Context.GetCollection<T>(collectionName);
                    await collection.DeleteManyAsync(filter);

                    await session.CommitTransactionAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Delete operation failed: {ex}");
                    await session.AbortTransactionAsync();
                }
            }
        }


        public ValidationResult GetErrorResult()
        {
            if (Errors.Count > 0)
            {
                return new ValidationResult(string.Join(Environment.NewLine, Errors));
            }
            else
            {
                return ValidationResult.Success!;
            }
        }

    }
}
