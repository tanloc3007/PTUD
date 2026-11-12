import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

// ══════════════════════════════════════════════════════════════════════════════
// THANG ĐO SỨC KHỎE TINH THẦN WHO-5 (WHO-Five Well-Being Index)
// Tiêu chuẩn chính thức của Tổ chức Y tế Thế giới (World Health Organization)
// Nguồn tham chiếu chuẩn: https://psytests.org/life/who5en_1.html
// ══════════════════════════════════════════════════════════════════════════════

const WHO5_QUESTIONS = [
  {
    id: 1,
    textVi: 'Tôi cảm thấy vui vẻ và tinh thần phấn chấn',
    textEn: 'I have felt cheerful and in good spirits',
    dimension: 'Tâm trạng tích cực'
  },
  {
    id: 2,
    textVi: 'Tôi cảm thấy bình tĩnh và thư thái',
    textEn: 'I have felt calm and relaxed',
    dimension: 'Sự an yên & Thư thái'
  },
  {
    id: 3,
    textVi: 'Tôi cảm thấy năng động và tràn đầy sinh lực',
    textEn: 'I have felt active and vigorous',
    dimension: 'Năng lượng & Sinh lực'
  },
  {
    id: 4,
    textVi: 'Tôi thức dậy với cảm giác sảng khoái và được nghỉ ngơi đầy đủ',
    textEn: 'I woke up feeling fresh and rested',
    dimension: 'Chất lượng giấc ngủ & Phục hồi'
  },
  {
    id: 5,
    textVi: 'Cuộc sống thường ngày của tôi tràn ngập những điều thú vị khiến tôi quan tâm',
    textEn: 'My daily life has been filled with things that interest me',
    dimension: 'Hứng thú & Ý nghĩa cuộc sống'
  },
];

const WHO5_OPTIONS = [
  { value: 5, labelVi: '5 - Tất cả thời gian', labelEn: 'All of the time', desc: 'Luôn luôn cảm thấy điều này trong 2 tuần qua' },
  { value: 4, labelVi: '4 - Hầu hết thời gian', labelEn: 'Most of the time', desc: 'Phần lớn các ngày trong tuần' },
  { value: 3, labelVi: '3 - Hơn một nửa thời gian', labelEn: 'More than half of the time', desc: 'Nhiều hơn 50% số ngày' },
  { value: 2, labelVi: '2 - Dưới một nửa thời gian', labelEn: 'Less than half of the time', desc: 'Ít hơn một nửa thời gian' },
  { value: 1, labelVi: '1 - Thỉnh thoảng / Một vài lúc', labelEn: 'Some of the time', desc: 'Chỉ xuất hiện một vài ngày' },
  { value: 0, labelVi: '0 - Hoàn toàn không có lúc nào', labelEn: 'At no time', desc: 'Không có ngày nào cảm thấy như vậy' },
];

/**
 * Thuật toán tính điểm và đánh giá phân loại theo tiêu chuẩn lâm sàng WHO-5
 * - Điểm thô (Raw Score): Tổng 5 câu, từ 0 đến 25
 * - Điểm quy đổi phần trăm: Điểm thô * 4, từ 0% đến 100%
 * - Ngưỡng sàng lọc WHO:
 *   + <= 50% (Điểm thô < 13): Nguy cơ suy giảm sức khỏe tinh thần / có dấu hiệu trầm cảm nhẹ
 *   + <= 28% (Điểm thô <= 7): Nguy cơ trầm cảm mức độ nặng theo chuẩn lâm sàng
 *   + 51% - 74% (13 - 18): Sức khỏe tinh thần bình thường & ổn định
 *   + >= 75% (19 - 25): Sức khỏe tinh thần tối ưu (Optimal Well-being)
 */
function evaluateWho5(rawScore) {
  const score = Math.max(0, Math.min(25, Number(rawScore) || 0));
  const percent = score * 4;

  if (score <= 7) {
    return {
      rawScore: score,
      percentage: percent,
      levelKey: 'Severe',
      levelText: 'Nguy cơ trầm cảm đáng kể',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      needsConsultation: true,
      summary: 'Dưới ngưỡng nguy cơ trầm cảm của WHO (<= 28%)',
      advice: 'Chỉ số WHO-5 của bạn thuộc ngưỡng cảnh báo nguy cơ trầm cảm mức độ nặng theo tiêu chuẩn của Tổ chức Y tế Thế giới. Tinh thần của bạn đang chịu tổn thương hoặc áp lực rất lớn. Hãy liên hệ ngay với Chuyên viên tư vấn tâm lý UniMind hoặc Hotline SOS 1900 1267 để được nâng đỡ kịp thời.'
    };
  }

  if (score < 13) {
    return {
      rawScore: score,
      percentage: percent,
      levelKey: 'Mild',
      levelText: 'Cần chú ý / Suy giảm tinh thần',
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
      needsConsultation: true,
      summary: 'Dưới ngưỡng chuẩn sàng lọc của WHO (<= 50%)',
      advice: 'Chỉ số WHO-5 của bạn ở mức dưới 50%, cho thấy năng lượng tinh thần và cảm xúc tích cực đang bị suy giảm trong 2 tuần qua. Bạn có dấu hiệu mệt mỏi, quá tải hoặc trầm cảm nhẹ. Bạn nên dành thời gian nghỉ ngơi và đặt lịch một phiên trò chuyện định hướng với chuyên viên.'
    };
  }

  if (score <= 18) {
    return {
      rawScore: score,
      percentage: percent,
      levelKey: 'Normal',
      levelText: 'Bình thường & Ổn định',
      color: '#0d9488',
      bg: '#f0fdfa',
      border: '#99f6e4',
      needsConsultation: false,
      summary: 'Sức khỏe tinh thần ở mức tương đối tốt',
      advice: 'Sức khỏe tinh thần của bạn đang ở trạng thái tương đối bình ổn và ổn định. Khả năng tự phục hồi tốt. Hãy tiếp tục duy trì chế độ sinh hoạt cân bằng, ngủ đủ giấc và dành thời gian cho những sở thích tích cực.'
    };
  }

  return {
    rawScore: score,
    percentage: percent,
    levelKey: 'Optimal',
    levelText: 'Sức khỏe tinh thần tối ưu',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    needsConsultation: false,
    summary: 'Sức khỏe tinh thần phát triển mạnh mẽ (>= 75%)',
    advice: 'Tuyệt vời! Bạn đang duy trì chất lượng cuộc sống tinh thần rất cao, cảm xúc vui tươi, năng động và khả năng thích ứng linh hoạt trước các áp lực học đường.'
  };
}

export default function TestPage() {
  const { user } = useAuthStore();
  const studentId = user?.id || '22222222-2222-2222-2222-222222222221';

  // Quản lý đúng 2 khung (tabs) theo yêu cầu người dùng:
  // 1. 'quiz': Khung soạn câu hỏi cho người dùng làm rồi nộp
  // 2. 'history': Khung coi lại các kết quả đã làm từ database
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'history'

  const [answers, setAnswers] = useState(Array(5).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notification, setNotification] = useState(null);

  // Tải danh sách lịch sử kết quả từ CSDL
  const loadHistory = () => {
    setLoadingHistory(true);
    const url = user?.id ? `/psychological-tests/student/${user.id}/history` : '/psychological-tests/history';
    axiosClient.get(url)
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setHistoryList(res.data.data);
        } else {
          // Fallback thử endpoint latest nếu history chưa có bản ghi danh sách
          const latestUrl = user?.id ? `/psychological-tests/student/${user.id}/latest` : '/psychological-tests/latest';
          axiosClient.get(latestUrl).then(latestRes => {
            if (latestRes.data?.data) {
              setHistoryList([latestRes.data.data]);
            }
          }).catch(() => {});
        }
      })
      .catch(() => {
        const latestUrl = user?.id ? `/psychological-tests/student/${user.id}/latest` : '/psychological-tests/latest';
        axiosClient.get(latestUrl).then(latestRes => {
          if (latestRes.data?.data) {
            setHistoryList([latestRes.data.data]);
          }
        }).catch(() => {});
      })
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const totalQuestions = WHO5_QUESTIONS.length;
  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (qIndex, scoreVal) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qIndex] = scoreVal;
      return next;
    });
  };

  const handleResetForm = () => {
    setAnswers(Array(5).fill(null));
    setSubmittedResult(null);
    setNotification(null);
  };

  const handleSubmitQuiz = async () => {
    if (answeredCount < totalQuestions) {
      setNotification({
        type: 'warning',
        title: 'Chưa hoàn thành đủ 5 câu hỏi',
        message: `Bạn mới hoàn thành ${answeredCount}/${totalQuestions} câu hỏi. Vui lòng trả lời đầy đủ 5 câu để hệ thống đánh giá chính xác theo chuẩn WHO-5.`
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const rawScore = answers.reduce((sum, val) => sum + (val || 0), 0);
    const percentScore = rawScore * 4;
    const evaluation = evaluateWho5(rawScore);

    const submitPayload = {
      testType: 'WHO5',
      rawAnswers: answers,
      totalScore: percentScore,
      depressionScore: rawScore,
      studentId: studentId
    };

    try {
      const submitUrl = user?.id ? `/psychological-tests/student/${user.id}/submit` : '/psychological-tests/submit';
      const res = await axiosClient.post(submitUrl, submitPayload);
      const savedDto = res.data?.data;

      const finalResult = {
        id: savedDto?.id || `who5-${Date.now()}`,
        completedAt: savedDto?.completedAt ? new Date(savedDto.completedAt) : new Date(),
        rawScore: rawScore,
        percentage: percentScore,
        levelText: evaluation.levelText,
        color: evaluation.color,
        bg: evaluation.bg,
        border: evaluation.border,
        needsConsultation: evaluation.needsConsultation,
        summary: evaluation.summary,
        advice: savedDto?.aiInterpretation || evaluation.advice
      };

      setSubmittedResult(finalResult);
      setNotification({
        type: 'success',
        title: 'Nộp bài trắc nghiệm WHO-5 thành công',
        message: `Kết quả của bạn: ${percentScore}% (Điểm thô: ${rawScore}/25) - ${evaluation.levelText}. Đã lưu an toàn vào cơ sở dữ liệu.`
      });

      // Tự động làm mới danh sách lịch sử và chuyển ngay sang tab Coi kết quả
      await loadHistory();
      setActiveTab('history');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Fallback lưu tạm vào state nếu mạng offline
      const finalResult = {
        id: `who5-${Date.now()}`,
        completedAt: new Date(),
        rawScore: rawScore,
        percentage: percentScore,
        levelText: evaluation.levelText,
        color: evaluation.color,
        bg: evaluation.bg,
        border: evaluation.border,
        needsConsultation: evaluation.needsConsultation,
        summary: evaluation.summary,
        advice: evaluation.advice
      };
      setSubmittedResult(finalResult);
      setHistoryList(prev => [
        {
          id: finalResult.id,
          testCode: 'WHO5',
          testTitle: 'Thang đo Sức khỏe Tinh thần WHO-5',
          totalScore: percentScore,
          depressionScore: rawScore,
          severityLevel: evaluation.levelKey,
          aiInterpretation: evaluation.advice,
          completedAt: new Date(),
          needsConsultation: evaluation.needsConsultation
        },
        ...prev
      ]);
      setNotification({
        type: 'success',
        title: 'Đã hoàn thành đánh giá WHO-5',
        message: `Kết quả: ${percentScore}% (${rawScore}/25) - ${evaluation.levelText}.`
      });
      // Chuyển ngay sang tab Coi kết quả
      setActiveTab('history');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-page-shell" style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header trang */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 900, color: 'var(--s-text, #0f172a)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Trắc Nghiệm Sức Khỏe Tinh Thần WHO-5
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--s-text-muted, #64748b)', margin: 0, lineHeight: 1.6 }}>
          Thước đo tiêu chuẩn vàng của Tổ chức Y tế Thế giới (WHO) đo lường chất lượng cuộc sống tinh thần trong 2 tuần qua qua 5 câu hỏi trọng tâm.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <InPageNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 2 Khung chính: Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: 9,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
            transition: 'all 0.2s ease',
            background: activeTab === 'quiz' ? '#ffffff' : 'transparent',
            color: activeTab === 'quiz' ? '#0d9488' : '#64748b',
            boxShadow: activeTab === 'quiz' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          1. Làm bài trắc nghiệm WHO-5
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            loadHistory();
          }}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRadius: 9,
            border: 'none',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
            transition: 'all 0.2s ease',
            background: activeTab === 'history' ? '#ffffff' : 'transparent',
            color: activeTab === 'history' ? '#0d9488' : '#64748b',
            boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          2. Coi lại các kết quả đã làm ({historyList.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          KHUNG 1: SOẠN CÂU HỎI CHO NGƯỜI DÙNG LÀM RỒI NỘP BÀI
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quiz' && (
        <div>
          {/* Card giới thiệu quy tắc đánh giá */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 22px',
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '3px 10px', borderRadius: 6 }}>
                Khung thời gian đánh giá: 2 tuần vừa qua (Over the last two weeks)
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: answeredCount === 5 ? '#16a34a' : '#0d9488' }}>
                Tiến độ: {answeredCount}/{totalQuestions} câu
              </span>
            </div>

            {/* Thanh tiến độ */}
            <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0d9488, #10b981)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Vui lòng cho biết mỗi câu dưới đây đúng với bạn ở mức độ nào trong <strong>2 tuần vừa qua</strong>. Chọn một mức độ phù hợp nhất cho từng câu hỏi.
            </p>
          </div>

          {/* Nếu vừa nộp xong: Hiển thị Thẻ kết quả ngay đầu */}
          {submittedResult && (
            <div style={{
              background: submittedResult.bg,
              border: `1.5px solid ${submittedResult.border}`,
              borderRadius: 16,
              padding: '22px 24px',
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: submittedResult.color, background: '#ffffff', padding: '3px 10px', borderRadius: 6, border: `1px solid ${submittedResult.border}` }}>
                    {submittedResult.levelText}
                  </span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                    Điểm Sức Khỏe Tinh Thần: {submittedResult.percentage}%
                  </h3>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    Điểm thô: <strong>{submittedResult.rawScore}/25</strong> • Chuẩn WHO-5 (0 - 100%)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xem lịch sử đã làm →
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#0d9488',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Làm lại bài mới
                  </button>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 10, padding: '12px 16px', border: `1px solid ${submittedResult.border}` }}>
                <strong style={{ fontSize: 13, color: '#0f766e', display: 'block', marginBottom: 4 }}>
                  Lời khuyên cho bạn:
                </strong>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                  {submittedResult.advice}
                </p>
              </div>
            </div>
          )}

          {/* Danh sách 5 câu hỏi trắc nghiệm WHO-5 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
            {WHO5_QUESTIONS.map((q, qIndex) => {
              const currentAnswer = answers[qIndex];
              const isAnswered = currentAnswer !== null;

              return (
                <div
                  key={q.id}
                  style={{
                    background: '#ffffff',
                    border: isAnswered ? '1.5px solid #99f6e4' : '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '20px 22px',
                    boxShadow: isAnswered ? '0 2px 10px rgba(13, 148, 136, 0.05)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Tiêu đề câu hỏi */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isAnswered ? '#0d9488' : '#e2e8f0',
                      color: isAnswered ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {q.id}
                    </span>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: '#1e293b', lineHeight: 1.5 }}>
                        {q.textVi}
                      </h4>
                      <span style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>
                        ({q.textEn})
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '2px 8px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {q.dimension}
                    </span>
                  </div>

                  {/* 6 mức lựa chọn (0 - 5 điểm) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                    {WHO5_OPTIONS.map((opt) => {
                      const isSelected = currentAnswer === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleSelectOption(qIndex, opt.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                            background: isSelected ? '#f0fdfa' : '#ffffff',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #0d9488' : '1.5px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0f766e' : '#334155', display: 'block' }}>
                              {opt.labelVi}
                            </span>
                            <span style={{ fontSize: 11, color: isSelected ? '#0d9488' : '#94a3b8', display: 'block' }}>
                              {opt.labelEn}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thanh tác vụ nộp bài */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px 24px',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Đã chọn: <strong style={{ color: answeredCount === 5 ? '#16a34a' : '#ea580c' }}>{answeredCount}/5 câu</strong>
              </span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Dữ liệu bài test sẽ được lưu tự động vào lịch sử cơ sở dữ liệu sau khi nộp
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleResetForm}
                disabled={submitting}
                style={{
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif"
                }}
              >
                Làm lại
              </button>

              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submitting || answeredCount < 5}
                style={{
                  padding: '11px 26px',
                  borderRadius: 10,
                  border: 'none',
                  background: answeredCount === 5 ? 'linear-gradient(135deg, #0d9488, #10b981)' : '#94a3b8',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: answeredCount === 5 ? 'pointer' : 'not-allowed',
                  boxShadow: answeredCount === 5 ? '0 4px 14px rgba(13, 148, 136, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Plus Jakarta Sans', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '0.01em'
                }}
              >
                {submitting ? 'Đang chấm điểm & lưu CSDL...' : 'Nộp bài & Đánh giá kết quả'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          KHUNG 2: COI LẠI CÁC KẾT QUẢ ĐÃ LÀM TỪ DATABASE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div>
          {/* Tiêu đề & Thao tác làm mới */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hồ Sơ & Lịch Sử Kết Quả Trắc Nghiệm
              </h3>
              <span style={{ fontSize: 12.5, color: '#64748b' }}>
                Toàn bộ các lần thực hiện đánh giá được ghi nhận và lưu trữ an toàn trong CSDL
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={loadHistory}
                disabled={loadingHistory}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {loadingHistory ? 'Đang tải...' : 'Làm mới'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Làm bài trắc nghiệm mới
              </button>
            </div>
          </div>

          {/* Trạng thái danh sách rỗng */}
          {historyList.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>
                Chưa có lịch sử làm bài trắc nghiệm nào được lưu.
              </p>
              <span style={{ fontSize: 12.5, color: '#94a3b8', display: 'block', marginBottom: 16 }}>
                Hãy chuyển qua khung "Làm bài trắc nghiệm WHO-5" để hoàn thành bài đánh giá đầu tiên của bạn!
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Bắt đầu làm bài ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {historyList.map((item, idx) => {
                // Xác định điểm thô và % theo WHO-5 hoặc DASS-21
                const isWho5 = item.testCode === 'WHO5' || (item.totalScore <= 100 && (item.depressionScore <= 25 || !item.anxietyScore));
                const percentScore = isWho5 ? item.totalScore : (item.resilienceRate || 50);
                const rawScore = item.depressionScore ?? Math.round(percentScore / 4);
                const evalInfo = evaluateWho5(rawScore);

                const completedDate = item.completedAt ? new Date(item.completedAt) : new Date();

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${evalInfo.border}`,
                      borderLeft: `4px solid ${evalInfo.color}`,
                      borderRadius: 14,
                      padding: '18px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: evalInfo.color,
                            background: evalInfo.bg,
                            padding: '2px 8px',
                            borderRadius: 4
                          }}>
                            {evalInfo.levelText}
                          </span>
                          <span style={{ fontSize: 11, color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {item.testTitle || 'Thang đo WHO-5'}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: 10.5, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          Thời gian hoàn thành: {completedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} lúc {completedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Điểm số */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: evalInfo.color }}>
                          {percentScore}%
                        </div>
                        <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                          Điểm thô: {rawScore}/25
                        </span>
                      </div>
                    </div>

                    {/* Nhận định chi tiết */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: 10,
                      padding: '10px 14px',
                      border: '1px solid #f1f5f9',
                      fontSize: 12.5,
                      color: '#334155',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: '#0f766e', display: 'block', marginBottom: 2 }}>
                        Lời khuyên cho bạn:
                      </strong>
                      <span>{item.aiInterpretation || evalInfo.advice}</span>
                    </div>

                    {item.needsConsultation && (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>• Hệ thống khuyến nghị đặt lịch tư vấn bảo mật 1-1 với Chuyên viên tâm lý trường học (Phòng P.302 hoặc SafeRoom Online).</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
