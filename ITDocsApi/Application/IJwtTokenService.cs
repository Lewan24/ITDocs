namespace ITDocsApi.Application;

public interface IJwtTokenService
{
    string CreateToken(Guid userId, string email);
}