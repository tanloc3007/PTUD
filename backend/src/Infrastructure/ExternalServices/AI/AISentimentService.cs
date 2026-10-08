using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;

namespace UniMind.Infrastructure.ExternalServices.AI;

public class AISentimentService : IAISentimentService
{
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

    public SentimentAnalysisResult Analyze(string text, IEnumerable<SensitiveKeyword> activeKeywords)
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

        // 7. Nhận diện ngôn ngữ & Sinh lời khuyên lâm sàng
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
            BreathingExerciseSuggestion = breathingAdvice
        };
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
}
