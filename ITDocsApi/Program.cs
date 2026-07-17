using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using ITDocsApi.Api;
using ITDocsApi.Application;
using ITDocsApi.Domain;
using ITDocsApi.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── DbContext ──
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ── AutoMapper ──
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<AppMappingProfile>());

// ── App services ──
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IPasswordCipher, DataProtectionPasswordCipher>();
builder.Services.AddDataProtection(); // required by the cipher above
builder.Services.AddScoped<IFileStorage, LocalFileStorage>();
builder.Services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICurrentUserIdProvider, HttpCurrentUserIdProvider>();
builder.Services.AddScoped<ICurrentUserContext, DbCurrentUserContext>();

// ── Auth ──
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        // Stops ASP.NET from rewriting "sub" -> ClaimTypes.NameIdentifier, "email" -> ClaimTypes.Email, etc.
        // Claims on HttpContext.User now match exactly what you put in the token.
        opt.MapInboundClaims = false;

        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["SigningKey"]!))
        };
    });
builder.Services.AddAuthorization();

// ── CORS (adjust origin to your React dev server / prod domain) ──
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("Frontend", p => p
        .WithOrigins("http://localhost:8443", "https://localhost:7121", "http://localhost:5006")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// ── Controllers / Swagger ──
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Auto-migrate on startup (dev convenience — use real migration pipeline in prod) ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();