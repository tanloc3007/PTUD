using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;

namespace UniMind.Infrastructure.ExternalServices.AI;

public class AISentimentService : IAISentimentService
{
    // Từ điển cảm xúc chuẩn tiếng Việt cho NLP
    private static readonly HashSet<string> PositiveWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "vui", "bình yên", "thư thái", "hạnh phúc", "hy vọng", "tích cực", "thoải mái", "ấm áp", 
        "cố gắng", "dũng khí", "tự tin", "vượt qua", "ổn định", "lạc quan", "yêu đời", "thành công"
    };

    private static readonly HashSet<string> NegativeWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "buồn", "chán", "mệt mỏi", "căng thẳng", "stress", "lo lắng", "bất an", "áp lực", "thất vọng",
        "cô đơn", "lạc lõng", "tê dại", "sốt ruột", "khó ngủ", "mất ngủ", "kiệt sức", "hoang mang", "đau đầu"
    };

    private static readonly HashSet<string> CrisisWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "tự tử", "muốn chết", "nhảy lầu", "rạch tay", "buông bỏ cuộc sống", "không muốn sống", 
        "uống thuốc ngủ", "bế tắc cùng cực", "chấm dứt tất cả", "không còn lối thoát"
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

        // 2. Kiểm tra từ khóa khủng hoảng cấp tính
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

        // 3. Đếm số lượng từ tích cực và tiêu cực
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

        // 7. Sinh lời khuyên lâm sàng & gợi ý hơi thở
        string advice = GenerateAdvice(label, isExtremeCrisis, triggeredKeywords);

        return new SentimentAnalysisResult
        {
            SentimentScore = score,
            SentimentLabel = label,
            RiskScore = finalRisk,
            ContainsSensitiveKeywords = triggeredKeywords.Count > 0,
            TriggeredKeywords = triggeredKeywords,
            IsExtremeCrisis = isExtremeCrisis,
            EmpatheticAdvice = advice,
            BreathingExerciseSuggestion = "Kỹ thuật thở 4-7-8: Hít vào 4 giây qua mũi, giữ hơi 7 giây, thở ra 8 giây qua miệng."
        };
    }

    private string GenerateAdvice(string label, bool isCrisis, List<string> triggers)
    {
        if (isCrisis)
        {
            return "UniMind phát hiện bạn đang trải qua những cảm xúc rất nặng nề và quá tải. Bạn hoàn toàn không phải vượt qua điều này một mình. Hãy kết nối ngay với Tổng đài SOS 1900 1267 hoặc đặt lịch phiên tham vấn bảo mật 1-1 với Chuyên viên tâm lý trường học ngay hôm nay.";
        }

        return label switch
        {
            "Positive" => "Thật tuyệt vời khi bạn đang nuôi dưỡng nguồn năng lượng tích cực hôm nay. Hãy ghi nhớ khoảnh khắc bình yên này để tiếp thêm động lực cho chặng đường học tập sắp tới!",
            "Negative" => "Dường như những áp lực học đường hoặc cảm giác mệt mỏi đang làm hao tổn năng lượng của bạn. Hãy cho phép bản thân nghỉ ngơi 15 phút, uống một ngụm nước ấm và thử bài tập thở 4-7-8 để điều hòa nhịp tim nhé.",
            _ => "UniMind luôn lắng nghe và thấu cảm cùng bạn. Dành vài phút tĩnh tâm mỗi ngày là cách tuyệt vời để chăm sóc sức khỏe tinh thần bản thân."
        };
    }
}
