using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using EasyCaching.InMemory;
using FluentValidation.AspNetCore;
using IdempotentAPI.Cache.DistributedCache.Extensions.DependencyInjection;
using IdempotentAPI.Extensions.DependencyInjection;
using MalakaBooks.API.Helper;
using MalakaBooks.Mediator.Common;
using MalakaBooks.Repository;
using MalakaBooks.Repository.Configuration;
using MalakaBooks.Validator;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Newtonsoft.Json;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.OpenApi.Models;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);
var environmentName = builder.Environment.EnvironmentName;

#region AppSetting
builder.Configuration
    .AddJsonFile($"appsetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"apiversionsetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"swaggersetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"mongodbsetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"corssetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"tokensetting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"is4setting.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"easycaching.{environmentName}.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();
#endregion

var apiVersionSection = builder.Configuration.GetSection("ApiVersionSetting");
var swaggerSection = builder.Configuration.GetSection("SwaggerSetting");
var corsSection = builder.Configuration.GetSection("CorsSetting");
var tokenSection = builder.Configuration.GetSection("TokenSetting");
var is4Section = builder.Configuration.GetSection("Is4Setting");

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddDistributedMemoryCache();

#region MongoDB
builder.Services.Configure<MongoDbSetting>(builder.Configuration.GetSection("MongoDbSetting"));
builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var setting = serviceProvider.GetRequiredService<IOptions<MongoDbSetting>>().Value;
    return new MongoClient(setting.ConnectionString);
});
builder.Services.AddSingleton<IMongoDatabase>(serviceProvider =>
{
    var setting = serviceProvider.GetRequiredService<IOptions<MongoDbSetting>>().Value;
    var client = serviceProvider.GetRequiredService<IMongoClient>();
    return client.GetDatabase(setting.DatabaseName);
});
#endregion

#region IS4
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = is4Section["Authority"];
        options.Audience = tokenSection["Audience"];
        options.RequireHttpsMetadata = bool.TryParse(is4Section["RequireHttpsMetadata"], out var requireHttps) && requireHttps;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = tokenSection["Audience"],
            ValidateIssuer = !string.IsNullOrWhiteSpace(is4Section["Authority"]),
            ValidIssuer = is4Section["Authority"]
        };
    });
builder.Services.AddAuthorization();
#endregion

#region API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(
        apiVersionSection.GetValue<int>("DefaultMajorVersion", 1),
        apiVersionSection.GetValue<int>("DefaultMinorVersion", 0));
    options.AssumeDefaultVersionWhenUnspecified = apiVersionSection.GetValue("AssumeDefaultVersionWhenUnspecified", true);
    options.ReportApiVersions = apiVersionSection.GetValue("ReportApiVersions", true);
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = apiVersionSection["GroupNameFormat"] ?? "'v'VVV";
    options.SubstituteApiVersionInUrl = apiVersionSection.GetValue("SubstituteApiVersionInUrl", true);
});
#endregion

#region Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();
builder.Services.AddSwaggerGen(options =>
{
    var authority = is4Section["Authority"] ?? string.Empty;
    var scopeKey = tokenSection["Scope"] ?? tokenSection["Audience"] ?? "malakabooks.api";
    var clientCredentialsTokenUrl = tokenSection["ClientCredentials:TokenEndpoint"] ?? $"{authority.TrimEnd('/')}/connect/token";
    var passwordTokenUrl = tokenSection["Password:TokenEndpoint"] ?? $"{authority.TrimEnd('/')}/connect/token";

    options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            ClientCredentials = new OpenApiOAuthFlow
            {
                TokenUrl = new Uri(clientCredentialsTokenUrl),
                Scopes = new Dictionary<string, string> { [scopeKey] = swaggerSection["Description"] ?? "MalakaBooks API" }
            },
            Password = new OpenApiOAuthFlow
            {
                TokenUrl = new Uri(passwordTokenUrl),
                Scopes = new Dictionary<string, string> { [scopeKey] = swaggerSection["Description"] ?? "MalakaBooks API" }
            }
        }
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "oauth2" }
            },
            new[] { scopeKey }
        }
    });
});
#endregion

#region Automapper
// Reserved for future AutoMapper profiles to mirror the reference layered architecture.
#endregion

#region MediatR
builder.Services.AddMediatR(typeof(MappingExtensions).Assembly);
#endregion

#region Idempotent
builder.Services.AddIdempotentAPIUsingDistributedCache();
#endregion

#region JSON Options
builder.Services
    .AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
#endregion

#region CORS
var allowedOrigins = corsSection.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var corsPolicyName = corsSection["PolicyName"] ?? "DefaultCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins);
        }
        else
        {
            policy.AllowAnyOrigin();
        }

        policy.AllowAnyHeader().AllowAnyMethod();

        if (corsSection.GetValue("AllowCredentials", false) && allowedOrigins.Length > 0)
        {
            policy.AllowCredentials();
        }
    });
});
#endregion

#region ExceptionHandling
builder.Services.RegisterRepositoryService();
builder.Services.RegisterAdditionalValidatorService();
#endregion

#region Caching
builder.Services.AddEasyCaching(options => options.UseInMemory(config =>
{
    config.EnableLogging = false;
    config.LockMs = 5000;
    config.SleepMs = 300;
}, "default"));
builder.Services.AddOutputCache();
#endregion

#region OutputCompression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
#endregion

var app = builder.Build();

app.UseResponseCompression();
app.UseExceptionHandler();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    var provider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();
    foreach (var description in provider.ApiVersionDescriptions)
    {
        options.SwaggerEndpoint($"/swagger/{description.GroupName}/swagger.json", $"{swaggerSection["Title"] ?? "MalakaBooks API"} {description.GroupName.ToUpperInvariant()}");
    }

    options.OAuthClientId(is4Section["SwaggerClientId"] ?? "malakabooks-swagger");
    options.OAuthClientSecret(is4Section["SwaggerClientSecret"] ?? "malakabooks-swagger-secret");
    options.OAuthAppName(swaggerSection["OAuthAppName"] ?? "MalakaBooks Swagger UI");
    options.OAuthUsePkce();
});
app.UseHttpsRedirection();
app.UseCors(corsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.UseOutputCache();
app.MapControllers();

app.Run();

internal sealed class ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider, IConfiguration configuration) : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        var swaggerSection = configuration.GetSection("SwaggerSetting");
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(description.GroupName, new OpenApiInfo
            {
                Title = swaggerSection["Title"] ?? "MalakaBooks API",
                Version = description.ApiVersion.ToString(),
                Description = swaggerSection["Description"] ?? "MalakaBooks bookstore Web API"
            });
        }
    }
}
