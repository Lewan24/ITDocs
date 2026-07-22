using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Application;

public interface IJwtTokenService
{
    string CreateToken(Guid userId, string email, SystemRole systemRole);
}