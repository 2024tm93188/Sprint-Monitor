using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SprintMonitor.API.Data;
using SprintMonitor.API.Services;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<SprintMonitorDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SprintMonitor.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SprintMonitor.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Register application services
builder.Services.AddScoped<ISprintService, SprintService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IRiskAssessmentService, RiskAssessmentService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<ICsvImportService, CsvImportService>();
builder.Services.AddScoped<IFeasibilityService, FeasibilityService>();
builder.Services.AddScoped<IRiskFeedbackService, RiskFeedbackService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    { 
        Title = "Sprint Monitor API", 
        Version = "v1",
        Description = @"
## Sprint Risk Detection and Planning Analysis API

A data-driven sprint feasibility and spillover risk detection system for Agile teams.

### Key Features:
- **Sprint Management**: Track and analyze sprint data
- **Risk Assessment**: Evaluate sprint risks using deterministic rule-based logic
- **Feasibility Study**: Industry validation with mentor approval workflow
- **Human Feedback**: Prediction accuracy feedback for system calibration
- **Sprint Comparison**: Analyze last 3 sprints with predictions vs outcomes

### API Modules:
1. **Teams** - Manage Scrum teams
2. **Sprints** - CRUD operations for sprint data
3. **Risk Assessment** - Evaluate sprint risk factors
4. **Metrics** - Calculate velocity and performance metrics
5. **Feasibility** - Implementation viability assessments
6. **Risk Feedback** - Human relevance feedback loop

---
*Sprint Monitor v1.0 | M.Tech Dissertation Project*
        ",
        Contact = new OpenApiContact
        {
            Name = "Sprint Monitor Team",
            Email = "support@sprintmonitor.dev"
        },
        License = new OpenApiLicense
        {
            Name = "Academic Use Only",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // Add XML comments for API documentation
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Group endpoints by tags
    c.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] });
    c.DocInclusionPredicate((name, api) => true);

    // Add security definition (for future JWT auth)
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
});

// Configure CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      return false;
                  }

                  var isLocalHost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                                    || uri.Host.Equals("127.0.0.1");
                  var isHttpScheme = uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;

                  return isLocalHost && isHttpScheme;
              })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                message = ex.Message
            }));
        }
    }
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c =>
    {
        c.SerializeAsV2 = false;
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sprint Monitor API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "Sprint Monitor API Documentation";
        c.DefaultModelsExpandDepth(2);
        c.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Model);
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
        c.EnableDeepLinking();
        c.DisplayOperationId();
        c.EnableFilter();
        c.ShowExtensions();
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply migrations and seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SprintMonitorDbContext>();
    // Apply any pending migrations
    context.Database.Migrate();
    // Seed only on first run (empty DB) so generated assessment history is preserved
    if (!context.Teams.Any())
    {
        DbSeeder.Seed(context);
    }
    else
    {
        // Add any missing canonical teams/sprints without resetting existing runtime data.
        DbSeeder.EnsureCanonicalTeamsAndSprints(context);
    }
}

app.Run();
