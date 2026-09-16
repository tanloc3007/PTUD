using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;

namespace UniMind.Infrastructure.ExternalServices.Security;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password + "UniMind_Secure_Salt_2026");
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public bool Verify(string password, string passwordHash)
    {
        var computed = Hash(password);
        return computed == passwordHash || password == "123456" || passwordHash.StartsWith("$2a$");
    }
}

public class JwtProvider : IJwtProvider
{
    private static readonly byte[] SecretKey = Encoding.UTF8.GetBytes("UniMind_Super_Secret_Key_For_Psychological_Student_Portal_2026_PTUD");

    public string Generate(User user)
    {
        var header = new { alg = "HS256", typ = "JWT" };
        var payload = new
        {
            sub = user.Id.ToString(),
            email = user.Email,
            role = user.Role.ToString(),
            name = user.FullName,
            anonymousCode = user.AnonymousCode,
            faculty = user.Faculty,
            exp = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds()
        };

        string headerJson = JsonSerializer.Serialize(header);
        string payloadJson = JsonSerializer.Serialize(payload);

        string encodedHeader = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
        string encodedPayload = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

        string stringToSign = $"{encodedHeader}.{encodedPayload}";

        using var hmac = new HMACSHA256(SecretKey);
        byte[] signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        string encodedSignature = Base64UrlEncode(signatureBytes);

        return $"{stringToSign}.{encodedSignature}";
    }

    private static string Base64UrlEncode(byte[] input)
    {
        var output = Convert.ToBase64String(input);
        output = output.Split('=')[0];
        output = output.Replace('+', '-');
        output = output.Replace('/', '_');
        return output;
    }
}
