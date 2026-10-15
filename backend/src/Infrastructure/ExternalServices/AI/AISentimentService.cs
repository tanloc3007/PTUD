using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;

namespace UniMind.Infrastructure.ExternalServices.AI;

public class AISentimentService : IAISentimentService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _primaryModel;
    private readonly List<string> _fallbackModels;

    // Từ điển cảm xúc chuẩn tiếng Việt và tiếng Anh cho NLP đa ngữ
    private static readonly HashSet<string> PositiveWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Tiếng Việt
        "vui", "bình yên", "thư thái", "hạnh phúc", "hy vọng", "tích cực", "thoải mái", "ấm áp", 
        "cố gắng", "dũng khí", "tự tin", "vượt qua", "ổn định", "lạc quan", "yêu đời", "thành công",
        "biết ơn", "hài lòng", "yêu thương", "tươi sáng", "phấn khởi", "nhẹ nhõm",
        // Tiếng Anh
        "happy", "peaceful", "joy", "joyful", "calm", "hope", "hopeful", "positive", "comfortable", 
        "warm", "confident", "optimistic", "successful", "grateful", "satisfied", "love", "bright", 
        "relieved", "blessed", "wonderful", "relaxed", "excited", "content", "great", "fine", "good"
    };

    private static readonly HashSet<string> NegativeWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Tiếng Việt
        "buồn", "chán", "mệt mỏi", "căng thẳng", "stress", "lo lắng", "bất an", "áp lực", "thất vọng",
        "cô đơn", "lạc lõng", "tê dại", "sốt ruột", "khó ngủ", "mất ngủ", "kiệt sức", "hoang mang", "đau đầu",
        "tuyệt vọng", "u sầu", "sụp đổ", "ngột ngạt", "quá tải",
        // Tiếng Anh
        "sad", "depressed", "depression", "tired", "exhausted", "stressed", "stressful", "anxious", "anxiety", 
        "worried", "nervous", "pressure", "disappointed", "lonely", "isolated", "burnout", "burned out", 
        "insomnia", "sleepless", "hopeless", "confused", "headache", "overwhelmed", "suffering", "pain", 
        "crying", "miserable", "broken", "empty", "panic", "scared", "fear"
    };

    private static readonly HashSet<string> CrisisWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Tiếng Việt
        "tự tử", "muốn chết", "nhảy lầu", "rạch tay", "buông bỏ cuộc sống", "không muốn sống", 
        "uống thuốc ngủ", "bế tắc cùng cực", "chấm dứt tất cả", "không còn lối thoát", "kết liễu",
        // Tiếng Anh
        "suicide", "suicidal", "kill myself", "end my life", "end it all", "want to die", "wanna die", 
        "self-harm", "self harm", "cutting myself", "cut myself", "overdose", "jump off", "no reason to live", 
        "no way out", "better off dead", "goodbye world"
    };

    public AISentimentService(string? apiKey = null, string? model = null)
    {
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(6) // Đảm bảo phản hồi nhanh, không nghẽn luồng
        };

        _apiKey = !string.IsNullOrWhiteSpace(apiKey)
            ? apiKey
            : (Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? string.Empty);

        _primaryModel = !string.IsNullOrWhiteSpace(model)
            ? model
            : "gemini-3.5-flash-lite";

        _fallbackModels = new List<string> { "gemini-flash-latest", "gemini-3.5-flash" };
    }

    /// <summary>
    /// Kiểm duyệt song song: Kết hợp kiểm tra từ khóa DB + Phân tích ngữ cảnh sâu qua Gemini AI
    /// </summary>
    public async Task<SentimentAnalysisResult> AnalyzeAsync(string text, IEnumerable<SensitiveKeyword> activeKeywords, CancellationToken cancellationToken = default)
    {
        // 1. Phân tích luật từ khóa & khủng hoảng trực tiếp (Rule-based Dictionary)
        var ruleResult = AnalyzeRuleBased(text, activeKeywords);

        if (string.IsNullOrWhiteSpace(text))
        {
            return ruleResult;
        }

        // 2. Gọi AI phân tích song song (Contextual & Semantic AI Check)
        GeminiModerationResponse? aiModeration = null;
        try
        {
            aiModeration = await CallGeminiModerationAsync(text, cancellationToken);
        }
        catch (Exception ex)
        {
            // Dự phòng sự cố: Nếu mạng gián đoạn hoặc API ngoài bị nghẽn, ghi log và giữ an toàn bằng bộ lọc từ khóa
            Console.WriteLine($"[UniMind AI Warning] Gemini AI moderation fallback: {ex.Message}");
        }

        // 3. Hợp nhất kết quả kiểm duyệt song song (Hybrid Moderation Decision)
        bool keywordTriggered = ruleResult.ContainsSensitiveKeywords || ruleResult.IsExtremeCrisis;
        bool aiTriggered = aiModeration != null && (aiModeration.IsSensitive || aiModeration.RiskScore >= 75);

        int combinedRisk = Math.Max(ruleResult.RiskScore, aiModeration?.RiskScore ?? 0);
        bool combinedCrisis = ruleResult.IsExtremeCrisis || (aiModeration?.RiskScore >= 85) || string.Equals(aiModeration?.Category, "SelfHarm", StringComparison.OrdinalIgnoreCase);

        var mergedKeywords = new List<string>(ruleResult.TriggeredKeywords);
        if (aiTriggered && !string.IsNullOrWhiteSpace(aiModeration?.Reason))
        {
            var aiBadge = $"[AI: {aiModeration.Category ?? "Nhạy cảm"}] {aiModeration.Reason}";
            if (!mergedKeywords.Contains(aiBadge))
            {
                mergedKeywords.Add(aiBadge);
            }
        }

        string source = (keywordTriggered && aiTriggered) 
            ? "KeywordAndAI" 
            : (aiTriggered ? "AIOnly" : (keywordTriggered ? "KeywordOnly" : "Clean"));

        string finalSentiment = (combinedCrisis || combinedRisk >= 75)
            ? "ExtremeNegative"
            : (!string.IsNullOrWhiteSpace(aiModeration?.SentimentLabel) ? aiModeration.SentimentLabel : ruleResult.SentimentLabel);

        double finalScore = aiModeration != null && aiModeration.SentimentScore.HasValue
            ? Math.Round((ruleResult.SentimentScore + aiModeration.SentimentScore.Value) / 2.0, 2)
            : ruleResult.SentimentScore;

        string finalAdvice = !string.IsNullOrWhiteSpace(aiModeration?.EmpatheticAdvice)
            ? aiModeration.EmpatheticAdvice
            : ruleResult.EmpatheticAdvice;

        return new SentimentAnalysisResult
        {
            SentimentScore = finalScore,
            SentimentLabel = finalSentiment,
            RiskScore = combinedRisk,
            ContainsSensitiveKeywords = ruleResult.ContainsSensitiveKeywords,
            TriggeredKeywords = mergedKeywords,
            IsExtremeCrisis = combinedCrisis,
            EmpatheticAdvice = finalAdvice,
            BreathingExerciseSuggestion = ruleResult.BreathingExerciseSuggestion,
            IsAiFlagged = aiTriggered,
            AiCategory = aiModeration?.Category,
            AiReason = aiModeration?.Reason,
            AiConfidence = aiModeration?.Confidence ?? (aiTriggered ? 90 : 0),
            ModerationSource = source
        };
    }

    public SentimentAnalysisResult Analyze(string text, IEnumerable<SensitiveKeyword> activeKeywords)
    {
        try
        {
            return AnalyzeAsync(text, activeKeywords).GetAwaiter().GetResult();
        }
        catch
        {
            return AnalyzeRuleBased(text, activeKeywords);
        }
    }

    private SentimentAnalysisResult AnalyzeRuleBased(string text, IEnumerable<SensitiveKeyword> activeKeywords)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new SentimentAnalysisResult
            {
                SentimentScore = 0.0,
                SentimentLabel = "Neutral",
                RiskScore = 10,
                EmpatheticAdvice = "UniMind luôn lắng nghe và đồng hành cùng bạn."
            };
        }

        var lower = text.ToLowerInvariant();
        var triggeredKeywords = new List<string>();

        // 1. Kiểm tra từ khóa nhạy cảm được cấu hình từ DB
        foreach (var kw in activeKeywords)
        {
            if (!string.IsNullOrWhiteSpace(kw.Keyword) && lower.Contains(kw.Keyword.ToLowerInvariant()))
            {
                if (!triggeredKeywords.Contains(kw.Keyword))
                    triggeredKeywords.Add(kw.Keyword);
            }
        }

        // 2. Kiểm tra từ khóa khủng hoảng cấp tính (VI + EN)
        bool hasCrisisWord = false;
        foreach (var cWord in CrisisWords)
        {
            if (lower.Contains(cWord))
            {
                hasCrisisWord = true;
                if (!triggeredKeywords.Contains(cWord))
                    triggeredKeywords.Add(cWord);
            }
        }

        // 3. Đếm số lượng từ tích cực và tiêu cực (VI + EN)
        int posCount = 0;
        int negCount = 0;

        foreach (var word in PositiveWords)
        {
            if (lower.Contains(word)) posCount++;
        }
        foreach (var word in NegativeWords)
        {
            if (lower.Contains(word)) negCount++;
        }

        // 4. Tính toán điểm SentimentScore (-1.0 đến +1.0)
        double score = 0.0;
        int total = posCount + negCount;
        if (total > 0)
        {
            score = Math.Round((double)(posCount - negCount) / total, 2);
        }

        // 5. Tính toán RiskScore (0 - 100)
        int baseRisk = hasCrisisWord ? 92 : (negCount * 12);
        if (triggeredKeywords.Count > 0) baseRisk += (triggeredKeywords.Count * 15);
        int finalRisk = Math.Clamp(baseRisk, 5, 99);

        // 6. Xác định nhãn cảm xúc
        string label;
        bool isExtremeCrisis = hasCrisisWord || finalRisk >= 75;

        if (isExtremeCrisis)
        {
            label = "ExtremeNegative";
            score = Math.Min(score, -0.85);
        }
        else if (score >= 0.2)
        {
            label = "Positive";
        }
        else if (score <= -0.2)
        {
            label = "Negative";
        }
        else
        {
            label = "Neutral";
        }

        bool isEnglish = IsEnglishText(text);
        string advice = GenerateAdvice(label, isExtremeCrisis, triggeredKeywords, isEnglish);
        string breathingAdvice = isEnglish
            ? "4-7-8 Breathing Technique: Inhale for 4s through nose, hold for 7s, exhale slowly for 8s through mouth."
            : "Kỹ thuật thở 4-7-8: Hít vào 4 giây qua mũi, giữ hơi 7 giây, thở ra 8 giây qua miệng.";

        return new SentimentAnalysisResult
        {
            SentimentScore = score,
            SentimentLabel = label,
            RiskScore = finalRisk,
            ContainsSensitiveKeywords = triggeredKeywords.Count > 0,
            TriggeredKeywords = triggeredKeywords,
            IsExtremeCrisis = isExtremeCrisis,
            EmpatheticAdvice = advice,
            BreathingExerciseSuggestion = breathingAdvice,
            ModerationSource = "KeywordOnly"
        };
    }

    /// <summary>
    /// Gửi nội dung bài viết/bình luận đến Google Gemini AI để phân tích ngữ cảnh, độ nhạy cảm và phát hiện nguy cơ
    /// </summary>
    private async Task<GeminiModerationResponse?> CallGeminiModerationAsync(string text, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return null;
        }

        var modelsToTry = new List<string> { _primaryModel };
        modelsToTry.AddRange(_fallbackModels.Where(m => m != _primaryModel));

        string prompt = $@"Bạn là trợ lý AI chuyên nghiệp về an toàn nội dung và tâm lý học đường của nền tảng UniMind (Đại học Lạc Hồng).
Nhiệm vụ của bạn: Phân tích sâu ngữ cảnh đoạn văn bản sau đây (từ sinh viên chia sẻ hoặc bình luận).
Phát hiện các yếu tố nhạy cảm ngầm hoặc trực tiếp:
1. Ý định tự tử, tự làm hại bản thân (SelfHarm), bế tắc muốn từ bỏ cuộc sống.
2. Quấy rối, bôi nhọ, xúc phạm, bắt nạt trực tuyến (Bullying/Harassment).
3. Bạo lực, kích động thù hằn, nội dung phản cảm học đường (Violence/Toxicity).
4. Khủng hoảng trầm cảm nặng nề cần chuyên viên can thiệp (Depression).

Nội dung cần kiểm duyệt:
""{text.Replace("\"", "\\\"")}""

YÊU CẦU: Trả về kết quả ĐÚNG định dạng JSON sau (không kèm lời chào hay ký tự thừa):
{{
  ""isSensitive"": true hoặc false,
  ""category"": ""SelfHarm"" hoặc ""Bullying"" hoặc ""Violence"" hoặc ""Depression"" hoặc ""None"",
  ""riskScore"": số nguyên từ 0 đến 100,
  ""confidence"": số nguyên từ 0 đến 100,
  ""reason"": ""Giải thích ngắn gọn lý do bằng tiếng Việt vì sao nhạy cảm hoặc an toàn"",
  ""sentimentLabel"": ""Positive"" hoặc ""Neutral"" hoặc ""Negative"" hoặc ""ExtremeNegative"",
  ""sentimentScore"": số thực từ -1.0 đến 1.0,
  ""empatheticAdvice"": ""Lời khuyên tâm lý thấu cảm, nhẹ nhàng dành cho sinh viên""
}}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

        var jsonPayload = JsonSerializer.Serialize(payload);

        foreach (var model in modelsToTry)
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";
                using var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
                };

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                    return ParseGeminiResponse(responseJson);
                }

                // Nếu 503 (High demand) hoặc 404, thử model tiếp theo trong danh sách dự phòng
                if ((int)response.StatusCode == 503 || (int)response.StatusCode == 404)
                {
                    continue;
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UniMind AI] Model {model} request failed: {ex.Message}");
            }
        }

        return null;
    }

    private static GeminiModerationResponse? ParseGeminiResponse(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];
                if (first.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) &&
                    parts.GetArrayLength() > 0)
                {
                    var rawText = parts[0].GetProperty("text").GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(rawText))
                    {
                        // Xóa markdown block ```json ... ``` nếu Gemini bọc
                        if (rawText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                        {
                            rawText = rawText.Substring(7);
                        }
                        if (rawText.StartsWith("```"))
                        {
                            rawText = rawText.Substring(3);
                        }
                        if (rawText.EndsWith("```"))
                        {
                            rawText = rawText.Substring(0, rawText.Length - 3);
                        }
                        rawText = rawText.Trim();

                        var options = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        return JsonSerializer.Deserialize<GeminiModerationResponse>(rawText, options);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UniMind AI] JSON parse failed: {ex.Message}");
        }

        return null;
    }

    private static bool IsEnglishText(string text)
    {
        var englishStopwords = new[] { "the", "and", "is", "in", "it", "to", "i", "my", "me", "am", "feel", "feeling", "with", "for", "that", "this", "have", "you", "so", "but" };
        var lower = text.ToLowerInvariant();
        int matches = englishStopwords.Count(w => System.Text.RegularExpressions.Regex.IsMatch(lower, $@"\b{w}\b"));
        return matches >= 2;
    }

    private string GenerateAdvice(string label, bool isCrisis, List<string> triggers, bool isEnglish)
    {
        if (isCrisis)
        {
            if (isEnglish)
                return "UniMind detected that you are experiencing intense emotional overwhelm. You do not have to go through this alone. Please connect with the Student Support Hotline (1900 1267) or book a confidential 1-on-1 counseling session with our school counselors right away.";

            return "UniMind phát hiện bạn đang trải qua những cảm xúc rất nặng nề và quá tải. Bạn hoàn toàn không phải vượt qua điều này một mình. Hãy kết nối ngay với Tổng đài SOS 1900 1267 hoặc đặt lịch phiên tham vấn bảo mật 1-1 với Chuyên viên tâm lý trường học ngay hôm nay.";
        }

        if (isEnglish)
        {
            return label switch
            {
                "Positive" => "Wonderful to see you nurturing positive energy today! Hold on to this peaceful moment to fuel your learning journey ahead.",
                "Negative" => "It seems like academic pressure and exhaustion are taking a toll on your mind. Give yourself a 15-minute break, drink warm water, and try the 4-7-8 breathing exercise to soothe your nervous system.",
                _ => "UniMind is always here to listen and empathize with you. Taking a few mindful minutes each day is a great way to take care of your mental well-being."
            };
        }

        return label switch
        {
            "Positive" => "Thật tuyệt vời khi bạn đang nuôi dưỡng nguồn năng lượng tích cực hôm nay. Hãy ghi nhớ khoảnh khắc bình yên này để tiếp thêm động lực cho chặng đường học tập sắp tới!",
            "Negative" => "Dường như những áp lực học đường hoặc cảm giác mệt mỏi đang làm hao tổn năng lượng của bạn. Hãy cho phép bản thân nghỉ ngơi 15 phút, uống một ngụm nước ấm và thử bài tập thở 4-7-8 để điều hòa nhịp tim nhé.",
            _ => "UniMind luôn lắng nghe và thấu cảm cùng bạn. Dành vài phút tĩnh tâm mỗi ngày là cách tuyệt vời để chăm sóc sức khỏe tinh thần bản thân."
        };
    }

    public class GeminiModerationResponse
    {
        [JsonPropertyName("isSensitive")]
        public bool IsSensitive { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("riskScore")]
        public int RiskScore { get; set; }

        [JsonPropertyName("confidence")]
        public int Confidence { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("sentimentLabel")]
        public string? SentimentLabel { get; set; }

        [JsonPropertyName("sentimentScore")]
        public double? SentimentScore { get; set; }

        [JsonPropertyName("empatheticAdvice")]
        public string? EmpatheticAdvice { get; set; }
    }
}
