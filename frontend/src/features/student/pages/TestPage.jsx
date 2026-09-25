import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const QUESTIONS = [
  { id: 1, cat: 'Stress',     text: 'Tôi thấy khó mà dứt ra khỏi tình trạng căng thẳng.' },
  { id: 2, cat: 'Anxiety',    text: 'Tôi thấy khô miệng khi hồi hộp.' },
  { id: 3, cat: 'Depression', text: 'Tôi không thấy có bất kỳ cảm xúc tích cực nào.' },
  { id: 4, cat: 'Anxiety',    text: 'Tôi bị khó thở dù không gắng sức.' },
  { id: 5, cat: 'Depression', text: 'Tôi thấy khó bắt tay vào làm việc gì đó.' },
  { id: 6, cat: 'Stress',     text: 'Tôi có xu hướng phản ứng thái quá với các tình huống.' },
  { id: 7, cat: 'Anxiety',    text: 'Tôi có cảm giác run (như run tay chân, rung nội tâm).' },
  { id: 8, cat: 'Stress',     text: 'Tôi thấy mình dễ bị kích động.' },
  { id: 9, cat: 'Depression', text: 'Tôi lo lắng về các tình huống có thể khiến tôi hoảng sợ.' },
  { id: 10, cat: 'Depression', text: 'Tôi thấy cuộc sống không có ý nghĩa gì.' },
  { id: 11, cat: 'Stress',    text: 'Tôi thấy mình dễ bực bội, dễ căng thẳng.' },
  { id: 12, cat: 'Anxiety',   text: 'Tôi cảm thấy không an toàn.' },
  { id: 13, cat: 'Depression', text: 'Tôi thấy mình chẳng có gì để mong đợi.' },
  { id: 14, cat: 'Stress',    text: 'Tôi thấy mình dễ bị kích thích.' },
  { id: 15, cat: 'Anxiety',   text: 'Tôi sắp mất khả năng kiểm soát bản thân.' },
  { id: 16, cat: 'Depression', text: 'Tôi thấy mình không có khả năng nhiệt tình.' },
  { id: 17, cat: 'Stress',    text: 'Tôi cảm thấy mình đang sống và làm việc không thực sự có giá trị.' },
  { id: 18, cat: 'Anxiety',   text: 'Tôi cảm thấy nhịp tim rất nhanh dù không gắng sức.' },
  { id: 19, cat: 'Depression', text: 'Tôi thấy mình buồn chán, tẻ nhạt, ít quan tâm đến mọi thứ.' },
  { id: 20, cat: 'Anxiety',   text: 'Tôi sợ hãi vô cớ.' },
  { id: 21, cat: 'Depression', text: 'Tôi thấy cuộc sống của mình là vô nghĩa.' },
];

const OPTIONS = [
  { value: 0, label: 'Không bao giờ' },
  { value: 1, label: 'Đôi khi' },
  { value: 2, label: 'Khá thường xuyên' },
  { value: 3, label: 'Hầu hết lúc nào' },
];

function calcLevel(score, thresholds) {
  if (score <= thresholds[0]) return { level: 'Bình thường', color: '#10b981', bg: '#f0fdf4' };
  if (score <= thresholds[1]) return { level: 'Nhẹ',         color: '#fbbf24', bg: '#fffbeb' };
  if (score <= thresholds[2]) return { level: 'Vừa',         color: '#f97316', bg: '#fff7ed' };
  if (score <= thresholds[3]) return { level: 'Nặng',        color: '#ef4444', bg: '#fef2f2' };
  return { level: 'Rất nặng', color: '#b91c1c', bg: '#fff1f2' };
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

    const res = {
      depression: { score: depressionScore, ...calcLevel(depressionScore, [9, 13, 20, 27]) },
      anxiety:    { score: anxietyScore,    ...calcLevel(anxietyScore,    [7, 9,  14, 19]) },
      stress:     { score: stressScore,     ...calcLevel(stressScore,     [14, 18, 25, 33]) },
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
      if (resp.data?.data?.aiInterpretation) {
        setResult(prev => ({ ...prev, aiInterpretation: resp.data.data.aiInterpretation }));
      }
      setNotification({
        type: 'success',
        title: 'Đã hoàn thành đánh giá',
        message: 'Kết quả trắc nghiệm DASS-21 của bạn đã được ghi nhận vào hồ sơ sức khỏe tâm thần cá nhân.'
      });
    } catch {}
  };

  if (step === 'intro') return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: 20 }}>
        
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Thang Đo Trắc Nghiệm Tâm Lý DASS-21
        </h1>
        <p style={{ fontSize: 14, color: 'var(--s-text-muted)', lineHeight: 1.65, margin: '0 0 24px' }}>
          Thang đo <strong>Depression Anxiety Stress Scale (DASS-21)</strong> gồm 21 câu hỏi chuẩn hóa quốc tế, 
          được sử dụng rộng rãi để đánh giá khách quan 3 chỉ số sức khỏe tinh thần trong 1 tuần vừa qua.
        </p>

        {hasPrevious && result && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
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
                Xem chi tiết
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#334155' }}>
              <span>Trầm cảm: <strong>{result.depression.level}</strong></span>
              <span>Lo âu: <strong>{result.anxiety.level}</strong></span>
              <span>Căng thẳng: <strong>{result.stress.level}</strong></span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 26 }}>
          {[
            { tag: 'Depression', label: 'Trầm cảm', desc: 'Đánh giá mức độ mất hứng thú, buồn bã và vô vọng' },
            { tag: 'Anxiety',    label: 'Lo âu',    desc: 'Đánh giá phản ứng cơ thể, hồi hộp và cảm giác bất an' },
            { tag: 'Stress',     label: 'Căng thẳng', desc: 'Đánh giá mức độ quá tải, dễ kích động và khó thư giãn' },
          ].map(c => (
            <div key={c.label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 14px', textAlign: 'left' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f766e', display: 'block', marginBottom: 6 }}>
                {c.tag}
              </span>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>{c.label}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{c.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 24 }}>
          Thời gian làm bài: 5-7 phút • Dữ liệu mã hóa và bảo mật hoàn toàn
        </p>

        <button className="s-btn s-btn-primary" style={{ fontSize: 14, padding: '10px 24px' }} onClick={() => setStep('quiz')}>
          {hasPrevious ? 'Làm lại trắc nghiệm' : 'Bắt đầu làm bài'}
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
            Kết Quả Trắc Nghiệm DASS-21
          </h1>
          <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
            Thời điểm thực hiện: {result.completedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {[
          { key: 'depression', label: 'Trầm cảm (Depression)' },
          { key: 'anxiety',    label: 'Lo âu (Anxiety)' },
          { key: 'stress',     label: 'Căng thẳng (Stress)' },
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
            Xem kết quả ({answered}/21)
          </button>
        </div>
      </div>
    </div>
  );
}
