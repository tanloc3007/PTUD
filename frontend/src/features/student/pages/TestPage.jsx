import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

// Bộ 21 câu hỏi chuẩn hóa quốc tế DASS-21 (Lovibond & Lovibond 1995)
// Phân bố chuẩn xác: 7 câu Trầm cảm, 7 câu Lo âu, 7 câu Căng thẳng
const QUESTIONS = [
  { id: 1,  cat: 'Stress',     text: 'Tôi thấy khó mà dứt ra khỏi tình trạng căng thẳng.' },
  { id: 2,  cat: 'Anxiety',    text: 'Tôi thấy khô môi hoặc khô miệng khi hồi hộp.' },
  { id: 3,  cat: 'Depression', text: 'Tôi không thấy có bất kỳ cảm xúc tích cực nào.' },
  { id: 4,  cat: 'Anxiety',    text: 'Tôi bị khó thở (thở gấp, hụt hơi dù không gắng sức).' },
  { id: 5,  cat: 'Depression', text: 'Tôi thấy khó bắt tay vào làm việc gì đó.' },
  { id: 6,  cat: 'Stress',     text: 'Tôi có xu hướng phản ứng thái quá với các tình huống.' },
  { id: 7,  cat: 'Anxiety',    text: 'Tôi có cảm giác run rẩy tay chân khi cảm thấy lo lắng.' },
  { id: 8,  cat: 'Stress',     text: 'Tôi cảm thấy mình hao tổn rất nhiều năng lượng tinh thần.' },
  { id: 9,  cat: 'Anxiety',    text: 'Tôi lo lắng mình sẽ rơi vào trạng thái hoảng sợ và bối rối.' },
  { id: 10, cat: 'Depression', text: 'Tôi cảm thấy không có gì để hào hứng mong đợi ở tương lai.' },
  { id: 11, cat: 'Stress',    text: 'Tôi thấy mình dễ bị bực bội, khó chịu hoặc kích động.' },
  { id: 12, cat: 'Stress',    text: 'Tôi thấy khó thư giãn hoặc bồn chồn đứng ngồi không yên.' },
  { id: 13, cat: 'Depression', text: 'Tôi cảm thấy buồn nản, thất vọng và u sầu.' },
  { id: 14, cat: 'Stress',    text: 'Tôi thấy sốt ruột và không chịu được khi việc gì đó bị chậm trễ.' },
  { id: 15, cat: 'Anxiety',   text: 'Tôi cảm thấy gần như hoảng loạn hoặc tim đập thình thịch.' },
  { id: 16, cat: 'Depression', text: 'Tôi không thể cảm thấy nhiệt tình hay hào hứng với bất cứ việc gì.' },
  { id: 17, cat: 'Depression', text: 'Tôi cảm thấy mình không có giá trị với tư cách là một con người.' },
  { id: 18, cat: 'Stress',    text: 'Tôi cảm thấy mình khá dễ nổi cáu hoặc nhạy cảm quá mức.' },
  { id: 19, cat: 'Anxiety',   text: 'Tôi nhận thấy tim mình đập nhanh hoặc loạn nhịp dù không tập thể dục.' },
  { id: 20, cat: 'Anxiety',   text: 'Tôi cảm thấy sợ hãi vô cớ mà không hiểu nguyên do.' },
  { id: 21, cat: 'Depression', text: 'Tôi cảm thấy cuộc sống dường như vô nghĩa và tuyệt vọng.' },
];

const OPTIONS = [
  { value: 0, label: 'Không đúng chút nào (0)' },
  { value: 1, label: 'Đúng một phần (1)' },
  { value: 2, label: 'Đúng phần nhiều (2)' },
  { value: 3, label: 'Hầu như luôn đúng (3)' },
];

// Thang phân loại lâm sàng DASS-21 chuẩn Lovibond (1995) sau khi nhân hệ số 2:
function calcLevel(score, thresholds) {
  if (score <= thresholds[0]) return { level: 'Bình thường', severityKey: 'Normal', color: '#10b981', bg: '#f0fdf4' };
  if (score <= thresholds[1]) return { level: 'Nhẹ',         severityKey: 'Mild', color: '#fbbf24', bg: '#fffbeb' };
  if (score <= thresholds[2]) return { level: 'Vừa',         severityKey: 'Moderate', color: '#f97316', bg: '#fff7ed' };
  if (score <= thresholds[3]) return { level: 'Nặng',        severityKey: 'Severe', color: '#ef4444', bg: '#fef2f2' };
  return { level: 'Rất nặng', severityKey: 'ExtremelySevere', color: '#b91c1c', bg: '#fff1f2' };
}

export default function TestPage() {
  const { user } = useAuthStore();
  const [answers, setAnswers] = useState(Array(21).fill(null));
  const [step, setStep]       = useState('intro'); // 'intro' | 'quiz' | 'result'
  const [result, setResult]   = useState(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const url = user?.id ? `/psychological-tests/student/${user.id}/latest` : '/psychological-tests/latest';
    axiosClient.get(url)
      .then(r => {
        if (r.data?.data) {
          const d = r.data.data;
          const prevRes = {
            depression: { score: d.depressionScore ?? 0, ...calcLevel(d.depressionScore ?? 0, [9, 13, 20, 27]) },
            anxiety:    { score: d.anxietyScore ?? 0,    ...calcLevel(d.anxietyScore ?? 0,    [7, 9,  14, 19]) },
            stress:     { score: d.stressScore ?? 0,     ...calcLevel(d.stressScore ?? 0,     [14, 18, 25, 33]) },
            aiInterpretation: d.aiInterpretation,
            completedAt: new Date(d.completedAt || Date.now()),
            isPrevious: true
          };
          setResult(prevRes);
          setHasPrevious(true);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const answered = answers.filter(a => a !== null).length;
  const progress = Math.round((answered / 21) * 100);

  const handleAnswer = (idx, val) => {
    setAnswers(prev => { const next = [...prev]; next[idx] = val; return next; });
  };

  const handleSubmit = async () => {
    if (answered < 21) {
      setNotification({
        type: 'warning',
        title: 'Chưa hoàn thành câu hỏi',
        message: `Bạn mới hoàn thành ${answered}/21 câu hỏi. Vui lòng trả lời đủ các câu để đảm bảo tính chuẩn xác lâm sàng.`
      });
      return;
    }

    const depressionScore = answers.filter((_, i) => QUESTIONS[i].cat === 'Depression').reduce((s, v) => s + (v||0)*2, 0);
    const anxietyScore    = answers.filter((_, i) => QUESTIONS[i].cat === 'Anxiety').reduce((s, v) => s + (v||0)*2, 0);
    const stressScore     = answers.filter((_, i) => QUESTIONS[i].cat === 'Stress').reduce((s, v) => s + (v||0)*2, 0);

    const needsConsultation = depressionScore >= 14 || anxietyScore >= 10 || stressScore >= 19;

    const res = {
      depression: { score: depressionScore, ...calcLevel(depressionScore, [9, 13, 20, 27]) },
      anxiety:    { score: anxietyScore,    ...calcLevel(anxietyScore,    [7, 9,  14, 19]) },
      stress:     { score: stressScore,     ...calcLevel(stressScore,     [14, 18, 25, 33]) },
      needsConsultation,
      completedAt: new Date(),
    };
    setResult(res);
    setStep('result');

    try {
      const resp = await axiosClient.post('/psychological-tests/submit', {
        testType: 'DASS21',
        rawAnswers: answers,
        answers: answers.map((a, i) => ({ index: i, score: a ?? 0 })),
        depressionScore,
        anxietyScore,
        stressScore,
        totalScore: depressionScore + anxietyScore + stressScore,
        studentId: user?.id
      });
      if (resp.data?.data) {
        setResult(prev => ({
          ...prev,
          aiInterpretation: resp.data.data.aiInterpretation || prev.aiInterpretation,
          needsConsultation: resp.data.data.needsConsultation ?? prev.needsConsultation
        }));
      }
      setNotification({
        type: 'success',
        title: 'Đã hoàn thành đánh giá DASS-21 chuẩn Lovibond',
        message: 'Kết quả trắc nghiệm đã được ghi nhận vào hồ sơ sức khỏe tâm thần cá nhân.'
      });
    } catch {}
  };

  if (step === 'intro') return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', paddingTop: 10 }}>
        
        {/* Banner hình ảnh minh họa trực quan */}
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #042f2e 100%)',
          borderRadius: 20,
          padding: '28px 24px',
          color: '#ffffff',
          marginBottom: 26,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(13,148,136,0.18)'
        }}>
          <div style={{
            position: 'absolute', right: -20, top: -20, width: 140, height: 140,
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', right: 40, bottom: -30, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
          }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            CHUẨN HÓA LÂM SÀNG QUỐC TẾ
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '0 0 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Đánh Giá Sức Khỏe Tinh Thần DASS-21
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 auto', maxWidth: 540 }}>
            Bộ công cụ trắc nghiệm gồm 21 câu hỏi giúp nhận diện sớm và định lượng khách quan 3 trạng thái cảm xúc của bạn trong tuần qua.
          </p>
        </div>

        {hasPrevious && result && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kết quả gần nhất ({result.completedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })})
              </span>
              <button
                type="button"
                className="s-btn s-btn-outline"
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => setStep('result')}
              >
                Xem chi tiết kết quả
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#334155' }}>
              <span>Trầm cảm: <strong>{result.depression.level}</strong></span>
              <span>Lo âu: <strong>{result.anxiety.level}</strong></span>
              <span>Căng thẳng: <strong>{result.stress.level}</strong></span>
            </div>
          </div>
        )}

        {/* 3 Thẻ đánh giá tâm lý */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 26 }}>
          {[
            {
              label: 'Trầm cảm',
              desc: 'Đánh giá mức độ mất hứng thú, buồn bã và cảm giác vô vọng',
              color: '#3b82f6',
              bg: '#eff6ff',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 15s1.5-2 4-2 4 2 4 2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              )
            },
            {
              label: 'Lo âu',
              desc: 'Đánh giá phản ứng cơ thể, hồi hộp và cảm giác bất an',
              color: '#f59e0b',
              bg: '#fffbeb',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              )
            },
            {
              label: 'Căng thẳng',
              desc: 'Đánh giá mức độ quá tải, dễ kích động và khó thư giãn',
              color: '#ef4444',
              bg: '#fef2f2',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )
            },
          ].map(c => (
            <div
              key={c.label}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '22px 18px',
                textAlign: 'left',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {c.icon}
              </div>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.label}</p>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Khung hướng dẫn bảo mật & thời gian */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
            Thời gian hoàn thành: <strong>5 - 7 phút</strong> • Dữ liệu được mã hóa bảo mật tuyệt đối
          </span>
        </div>

        <button
          className="s-btn s-btn-primary"
          style={{ fontSize: 15, padding: '12px 32px', borderRadius: 10, boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
          onClick={() => setStep('quiz')}
        >
          {hasPrevious ? 'Làm lại bài trắc nghiệm' : 'Bắt đầu làm bài trắc nghiệm'}
        </button>
      </div>
    </div>
  );

  if (step === 'result' && result) return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {notification && (
          <InPageNotification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Kết Quả Trắc Nghiệm Tâm Lý DASS-21
          </h1>
          <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
            Thời điểm thực hiện: {result.completedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {[
          { key: 'depression', label: 'Chỉ số Trầm cảm' },
          { key: 'anxiety',    label: 'Chỉ số Lo âu' },
          { key: 'stress',     label: 'Chỉ số Căng thẳng' },
        ].map(r => {
          const d = result[r.key];
          return (
            <div key={r.key} style={{ background: d.bg, border: `1.5px solid ${d.color}35`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--s-text)' }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4b5563' }}>Điểm: {d.score}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: d.color + '20', color: d.color, fontSize: 12, fontWeight: 800 }}>
                    {d.level}
                  </span>
                </div>
              </div>
              <div className="s-progress-bar">
                <div className="s-progress-fill" style={{ width: `${Math.min(d.score / 42 * 100, 100)}%`, background: d.color }} />
              </div>
            </div>
          );
        })}

        {result.needsConsultation && (
          <div style={{
            background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: 14,
            padding: '18px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffedd5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 20, color: '#ea580c'
            }}>
              ⚠️
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 800, color: '#9a3412' }}>
                Khuyến nghị: Bạn cần được hỗ trợ tư vấn tâm lý
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#7c2d12', lineHeight: 1.55 }}>
                Chỉ số đánh giá của bạn cho thấy dấu hiệu căng thẳng hoặc bất an ở mức đáng chú ý. Đừng gánh vác một mình! Hãy kết nối với chuyên viên tâm lý tại trường để được lắng nghe và đồng hành trong không gian an toàn, hoàn toàn ẩn danh.
              </p>
            </div>
          </div>
        )}

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f766e', margin: '0 0 6px' }}>
            Khuyến nghị lâm sàng &amp; Nhận định AI
          </p>
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>
            {result.aiInterpretation || (
              result.depression.level === 'Bình thường' && result.anxiety.level === 'Bình thường' && result.stress.level === 'Bình thường'
                ? 'Tuyệt vời! Sức khỏe tinh thần của bạn đang ở mức cân bằng ổn định. Hãy duy trì lối sống lành mạnh và thời gian nghỉ ngơi hợp lý.'
                : 'Kết quả của bạn cho thấy một số dấu hiệu quá tải tâm lý. Bạn nên cân nhắc đặt lịch trò chuyện 1-1 với chuyên viên tâm lý tại trường để được hỗ trợ kịp thời.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="s-btn s-btn-outline" onClick={() => { setStep('intro'); setAnswers(Array(21).fill(null)); setResult(null); setNotification(null); }}>
            Làm lại trắc nghiệm
          </button>
          <a href="/student/booking" className="s-btn s-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Đặt lịch tư vấn với chuyên gia
          </a>
        </div>
      </div>
    </div>
  );

  // Quiz questions
  return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {notification && (
          <InPageNotification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--s-text)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Trắc nghiệm DASS-21
          </h1>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
            {answered}/21 câu hoàn thành
          </span>
        </div>

        <div className="s-progress-bar" style={{ marginBottom: 22 }}>
          <div className="s-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {QUESTIONS.map((q, idx) => (
            <div key={q.id} className="s-card" style={{ borderLeft: `3px solid ${answers[idx] !== null ? '#0f766e' : '#e5e7eb'}` }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--s-text)', margin: '0 0 12px', lineHeight: 1.5 }}>
                <span style={{ color: '#0f766e', fontWeight: 800 }}>{idx + 1}.</span> {q.text}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(idx, opt.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${answers[idx] === opt.value ? '#0f766e' : '#e5e7eb'}`,
                      background: answers[idx] === opt.value ? '#f0fdfa' : '#ffffff',
                      color: answers[idx] === opt.value ? '#0f766e' : '#4b5563',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="s-btn s-btn-outline" onClick={() => setStep('intro')}>
            Quay lại
          </button>
          <button
            className="s-btn s-btn-primary"
            onClick={handleSubmit}
            style={{ opacity: answered < 21 ? 0.6 : 1 }}
          >
            Nộp kết quả ({answered}/21)
          </button>
        </div>
      </div>
    </div>
  );
}
