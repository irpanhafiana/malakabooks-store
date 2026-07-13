using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "MalakaBooks.API")))
    .AddJsonFile("mongodbsetting.Development.json", optional: false)
    .AddEnvironmentVariables()
    .Build();

var mongoSetting = configuration.GetSection("MongoDbSetting").Get<MongoDbSetting>();
if (mongoSetting is null || string.IsNullOrWhiteSpace(mongoSetting.ConnectionString) || string.IsNullOrWhiteSpace(mongoSetting.DatabaseName))
{
    Console.Error.WriteLine("MongoDbSetting is not configured.");
    return 1;
}

var client = new MongoClient(mongoSetting.ConnectionString);
var database = client.GetDatabase(mongoSetting.DatabaseName);

var cleanupTargets = new[]
{
    new CleanupTarget(mongoSetting.OrdersCollection, "Items.BookId"),
    new CleanupTarget(mongoSetting.CartsCollection, "Items.BookId"),
    new CleanupTarget(mongoSetting.ReviewsCollection, "BookId"),
    new CleanupTarget(mongoSetting.ComplaintsCollection, "BookId")
};

foreach (var target in cleanupTargets)
{
    var collection = database.GetCollection<BsonDocument>(target.CollectionName);
    var filter = Builders<BsonDocument>.Filter.Exists(target.FieldPath, true);
    var update = Builders<BsonDocument>.Update.Unset(target.FieldPath);
    var result = await collection.UpdateManyAsync(filter, update);

    Console.WriteLine($"Collection '{target.CollectionName}': matched={result.MatchedCount}, modified={result.ModifiedCount}, field='{target.FieldPath}'");
}

Console.WriteLine("Legacy BookId cleanup completed.");
return 0;

internal sealed record CleanupTarget(string CollectionName, string FieldPath);
