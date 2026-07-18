namespace ITDocsApi.Domain;

public sealed class AppSettings
{
    public string ITDocsAdmin { get; init; } = "";

    public bool AllowRegister { get; init; }

    public string[] AllowOrigins { get; init; } = [];
}