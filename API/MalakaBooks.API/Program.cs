using IdempotentAPI.Cache.DistributedCache.Extensions.DependencyInjection;
using IdempotentAPI.Extensions.DependencyInjection;
using MalakaBooks.API.Helper;
using MalakaBooks.ConfigSetting;
using MalakaBooks.DataValidator;
using MalakaBooks.Repository;
using MalakaBooks.Validator;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Subur.API.SwaggerConfig;
using Subur.API.SwaggerProvider;
using Subur.API.VersioningConfig;
using Subur.API.VersioningProvider;
using Subur.Messaging.MediatRProvider;
using Subur.Security.AuthConfig;
using Subur.Security.AuthProvider;
using Subur.Security.CorsConfig;
using Subur.Security.CorsProvider;
using Subur.Storage.CacheConfig;
using Subur.Storage.CacheProvider;
using Subur.Storage.MongoDbConfig;
using Subur.Storage.MongoDbProvider;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Threading.RateLimiting;

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
var appSection = builder.Configuration.GetSection("AppSetting");
var easyCacheSection = builder.Configuration.GetSection("EasyCachingConfig");
var mongoSection = builder.Configuration.GetSection("MongoDbSetting");

builder.Services.AddHttpContextAccessor();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddDistributedMemoryCache();

#region MongoDB
MongoSetting mongoSetting = new();
mongoSection.Bind(mongoSetting);

builder.Services.AddSingleton(mongoSetting);
builder.Services.ConfigureMongoService(mongoSetting);
#endregion

#region IS4
IS4Setting is4Setting = new();
is4Section.Bind(is4Setting);
builder.Services.ConfigureAuthenticationService(is4Setting);
#endregion

#region API Versioning
VersioningSetting versioningSetting = new();
apiVersionSection.Bind(versioningSetting);
builder.Services.ConfigureVersioningService(versioningSetting);
#endregion

#region Swagger
SwaggerSetting swaggerSetting = new();
swaggerSection.Bind(swaggerSetting);

builder.Services.AddSingleton(swaggerSetting);

builder.Services.AddSwaggerGen(c =>
{
  c.SwaggerDoc($"v{versioningSetting.MajorVersion}", new OpenApiInfo { Title = swaggerSetting.Title, Version = $"v{versioningSetting.MajorVersion}", Description = "" });

  c.OperationFilter<SwaggerAuthorizeOperationFilter>();
  c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
  {
    Type = SecuritySchemeType.OAuth2,
    Name = swaggerSetting.OidcClientId,// client id
    In = ParameterLocation.Cookie, // where the token will go
    Flows = new OpenApiOAuthFlows()
    {
      ClientCredentials = new OpenApiOAuthFlow()
      {
        Scopes = new Dictionary<string, string>
        {
          {
            swaggerSetting.OidcApiName!, swaggerSetting.OidcApiName!
          }
        },
        TokenUrl = new Uri($"{swaggerSetting.IdentityServerBaseUrl}/connect/token"),
      }
    }
  });
  c.AddSecurityRequirement(new OpenApiSecurityRequirement()
        {
          {
            new OpenApiSecurityScheme() { Reference = new OpenApiReference() { Type= ReferenceType.SecurityScheme, Id="oauth2" } },
            new [] { swaggerSetting.OidcApiName }
          }
        });

  // Set the comments path for the Swagger JSON and UI.
  var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
  var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
  c.IncludeXmlComments(xmlPath);
});
#endregion

#region Automapper
// Reserved for future AutoMapper profiles to mirror the reference layered architecture.
#endregion

#region MediatR
builder.Services.ConfigureMediatRService("MalakaBooks.Mediator");
#endregion

#region Idempotent
builder.Services.AddIdempotentAPI();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddIdempotentAPIUsingDistributedCache();
#endregion

#region JSON Options
AppSetting appSetting = new();
appSection.Bind(appSetting);

builder.Services.AddControllers(options =>
{
  options.Filters.Add(new IdempotentFilter(appSetting.IdempotentExpiredHours!));
  options.Conventions.Add(new AuthorizeFilterByPolicy());
  options.Filters.Add(typeof(GlobalHttpMethodAuthorizationFilter));
}).AddNewtonsoftJson(nwtOptions =>
{
  nwtOptions.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
  nwtOptions.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
  nwtOptions.SerializerSettings.StringEscapeHandling = StringEscapeHandling.EscapeNonAscii;
  nwtOptions.SerializerSettings.DateFormatHandling = DateFormatHandling.IsoDateFormat;
  nwtOptions.SerializerSettings.Formatting = Formatting.None;
  nwtOptions.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Local;
});
//builder.Services.AddFluentValidationAutoValidation();
//builder.Services.AddFluentValidationClientsideAdapters();
#endregion

#region CORS
CORSSetting corsSetting = new();
corsSection.Bind(corsSetting);

if (corsSetting.Enabled) builder.Services.ConfigureCORSService(corsSetting);
#endregion

#region ExceptionHandling
builder.Services.RegisterRepositoryService();
builder.Services.RegisterAdditionalValidatorService();
builder.Services.RegisterAdditionalDataValidatorService();
#endregion

#region Caching
EasyCachingConfig easyCachingSetting = new();
easyCacheSection.Bind(easyCachingSetting);

builder.Services.ConfigureCacheService(easyCachingSetting);
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

#region Rate Limiter


if (appSetting.RateLimiterSetting != null)
{
  builder.Services.AddRateLimiter(options =>
  {
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, IPAddress>(context =>
    {
      var clientIp = context.Connection.RemoteIpAddress;
      return RateLimitPartition.GetFixedWindowLimiter(clientIp!, _ =>
        new FixedWindowRateLimiterOptions
        {
          PermitLimit = appSetting.RateLimiterSetting.Limit,   // Max requests allowed
          Window = TimeSpan.FromMinutes(appSetting.RateLimiterSetting.ResetMinute), // Reset every minute
          QueueLimit = appSetting.RateLimiterSetting.QueueLimit,
          AutoReplenishment = appSetting.RateLimiterSetting.AutoReplenish
        });
    });
  });
}

#endregion

var app = builder.Build();

app.UseResponseCompression();
app.UseExceptionHandler();

app.UseSwagger();
if (app.Environment.IsDevelopment())
{
  app.UseSwaggerUI(c =>
  {
    var descriptions = app.DescribeApiVersions();
    foreach (var description in descriptions)
    {
      var url = $"/swagger/{description.GroupName}/swagger.json";
      var name = description.GroupName.ToUpperInvariant();
      c.SwaggerEndpoint(url, name);
    }
  });
}

app.UseHttpsRedirection();
if (corsSetting.Enabled)
{
  foreach (var cors in corsSetting.CORSPolicies!)
  {
    if (cors.IsDefault)
    {
      app.UseCors();
    }
    else
    {
      app.UseCors(cors.PolicyName!);
    }
  }
}

app.UseAuthentication();
app.UseAuthorization();

app.UseOutputCache();
app.MapControllers();

app.Run();
