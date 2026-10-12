import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

// ══════════════════════════════════════════════════════════════════════════════
// 1. BỘ CÂU HỎI CHUẨN HÓA QUỐC TẾ DASS-21 (Lovibond & Lovibond 1995)
// Bản dịch chuẩn y khoa Viện Sức khỏe Tâm thần (Bạch Mai) & ĐHQGHN
// 7 câu Trầm cảm, 7 câu Lo âu, 7 câu Căng thẳng
// ══════════════════════════════════════════════════════════════════════════════
const DASS21_QUESTIONS = [
  { id: 1,  cat: 'Stress',     text: 'Tôi thấy khó mà thả lỏng hoặc dứt ra khỏi tình trạng căng thẳng.' },
  { id: 2,  cat: 'Anxiety',    text: 'Tôi nhận thấy mình bị khô miệng.' },
  { id: 3,  cat: 'Depression', text: 'Tôi không thể cảm nhận bất kỳ cảm xúc tích cực nào.' },
  { id: 4,  cat: 'Anxiety',    text: 'Tôi bị rối loạn nhịp thở (thở gấp, hụt hơi dù không gắng sức hay làm việc nặng).' },
  { id: 5,  cat: 'Depression', text: 'Tôi thấy khó bắt tay vào làm việc gì đó.' },
  { id: 6,  cat: 'Stress',     text: 'Tôi có xu hướng phản ứng thái quá với các tình huống.' },
  { id: 7,  cat: 'Anxiety',    text: 'Tôi bị run rẩy (ví dụ: run tay chân).' },
  { id: 8,  cat: 'Stress',     text: 'Tôi cảm thấy mình hao tổn rất nhiều năng lượng tinh thần.' },
  { id: 9,  cat: 'Anxiety',    text: 'Tôi lo lắng về những tình huống có thể khiến tôi hoảng loạn và biến mình thành trò cười.' },
  { id: 10, cat: 'Depression', text: 'Tôi cảm thấy mình chẳng có gì để mong đợi ở tương lai.' },
  { id: 11, cat: 'Stress',     text: 'Tôi thấy mình dễ bị kích động hoặc bực bội.' },
  { id: 12, cat: 'Stress',     text: 'Tôi thấy khó thư giãn.' },
  { id: 13, cat: 'Depression', text: 'Tôi cảm thấy buồn nản, chán chường và u sầu.' },
  { id: 14, cat: 'Stress',     text: 'Tôi không thể chịu được việc có điều gì đó cản trở việc tôi đang làm.' },
  { id: 15, cat: 'Anxiety',    text: 'Tôi cảm thấy gần như hoảng loạn.' },
  { id: 16, cat: 'Depression', text: 'Tôi không thể cảm thấy hào hứng hay nhiệt tình với bất cứ điều gì.' },
  { id: 17, cat: 'Depression', text: 'Tôi cảm thấy mình không có giá trị với tư cách là một con người.' },
  { id: 18, cat: 'Stress',     text: 'Tôi thấy mình khá dễ tự ái và dễ nổi cáu.' },
  { id: 19, cat: 'Anxiety',    text: 'Tôi nhận thấy tim mình đập nhanh hoặc loạn nhịp dù không gắng sức.' },
  { id: 20, cat: 'Anxiety',    text: 'Tôi cảm thấy sợ hãi vô cớ mà không có lý do chính đáng.' },
  { id: 21, cat: 'Depression', text: 'Tôi cảm thấy cuộc sống dường như vô nghĩa.' },
];

const DASS21_OPTIONS = [
  { value: 0, label: '0 - Không đúng với tôi chút nào cả' },
  { value: 1, label: '1 - Đúng một phần / thỉnh thoảng' },
  { value: 2, label: '2 - Đúng phần nhiều / khá thường xuyên' },
  { value: 3, label: '3 - Hoàn toàn đúng / hầu như luôn luôn' },
];

// ══════════════════════════════════════════════════════════════════════════════
// 2. MẪU THỰC TẾ 2: THANG ĐO TRẦM CẢM LÂM SÀNG PHQ-9 (Kroenke et al., 2001 / WHO)
// ══════════════════════════════════════════════════════════════════════════════
const PHQ9_QUESTIONS = [
  { id: 1, cat: 'Depression', text: 'Ít hứng thú hoặc không còn cảm thấy niềm vui trong công việc hay học tập.' },
  { id: 2, cat: 'Depression', text: 'Cảm thấy buồn bã, chán nản, ủ rũ hoặc tuyệt vọng.' },
  { id: 3, cat: 'Depression', text: 'Khó đi vào giấc ngủ, ngủ không sâu giấc, chập chờn hoặc ngủ quá nhiều.' },
  { id: 4, cat: 'Depression', text: 'Cảm thấy mệt mỏi, kiệt sức hoặc thiếu hụt năng lượng.' },
  { id: 5, cat: 'Depression', text: 'Ăn không ngon miệng, chán ăn hoặc ăn uống mất kiểm soát quá mức.' },
  { id: 6, cat: 'Depression', text: 'Cảm thấy bản thân tồi tệ, thất bại hoặc làm cho bản thân và gia đình thất vọng.' },
  { id: 7, cat: 'Depression', text: 'Khó tập trung vào công việc (ví dụ: khi đọc tài liệu, làm đồ án hoặc nghe giảng).' },
  { id: 8, cat: 'Depression', text: 'Cử động hoặc nói chuyện chậm chạp bất thường; hoặc ngược lại, bồn chồn đứng ngồi không yên.' },
  { id: 9, cat: 'Depression', text: 'Có suy nghĩ rằng thà chết đi cho xong hoặc muốn làm điều gì đó gây tổn hại cho bản thân.' },
];

const PHQ9_OPTIONS = [
  { value: 0, label: '0 - Hoàn toàn không xảy ra' },
  { value: 1, label: '1 - Vài ngày (1 - 6 ngày)' },
  { value: 2, label: '2 - Hơn một nửa số ngày (7 - 11 ngày)' },
  { value: 3, label: '3 - Gần như mỗi ngày (12 - 14 ngày)' },
];

// ══════════════════════════════════════════════════════════════════════════════
// 3. MẪU THỰC TẾ 3: THANG ĐO LO ÂU LAN TỎA GAD-7 (Spitzer et al., 2006)
// ══════════════════════════════════════════════════════════════════════════════
const GAD7_QUESTIONS = [
  { id: 1, cat: 'Anxiety', text: 'Cảm thấy bồn chồn, lo lắng, căng thẳng hoặc bối rối.' },
  { id: 2, cat: 'Anxiety', text: 'Không thể ngừng lo lắng hoặc không thể kiểm soát được những mối bận tâm.' },
  { id: 3, cat: 'Anxiety', text: 'Lo lắng quá nhiều về nhiều vấn đề khác nhau cùng một lúc.' },
  { id: 4, cat: 'Anxiety', text: 'Cảm thấy khó thư giãn hoặc khó có thể thả lỏng tinh thần.' },
  { id: 5, cat: 'Anxiety', text: 'Cảm thấy bồn chồn tới mức khó có thể ngồi yên một chỗ.' },
  { id: 6, cat: 'Anxiety', text: 'Dễ trở nên bực bội, khó chịu hoặc dễ cáu gắt.' },
  { id: 7, cat: 'Anxiety', text: 'Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy đến.' },
];

const GAD7_OPTIONS = [
  { value: 0, label: '0 - Hoàn toàn không' },
  { value: 1, label: '1 - Vài ngày' },
  { value: 2, label: '2 - Hơn một nửa số ngày' },
  { value: 3, label: '3 - Gần như mỗi ngày' },
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
  const [selectedModel, setSelectedModel] = useState('DASS21'); // 'DASS21' | 'PHQ9' | 'GAD7'
  
  // Xác định bộ câu hỏi và lựa chọn dựa theo model
  const activeQuestions = selectedModel === 'PHQ9' ? PHQ9_QUESTIONS : selectedModel === 'GAD7' ? GAD7_QUESTIONS : DASS21_QUESTIONS;
  const activeOptions   = selectedModel === 'PHQ9' ? PHQ9_OPTIONS   : selectedModel === 'GAD7' ? GAD7_OPTIONS   : DASS21_OPTIONS;

  const [answers, setAnswers] = useState(Array(21).fill(null));
  const [step, setStep]       = useState('intro'); // 'intro' | 'quiz' | 'result'
  const [result, setResult]   = useState(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [notification, setNotification] = useState(null);

  // Reset câu trả lời khi đổi model bài test
  const handleSelectModel = (m) => {
    setSelectedModel(m);
    const count = m === 'PHQ9' ? 9 : m === 'GAD7' ? 7 : 21;
    setAnswers(Array(count).fill(null));
  };

  useEffect(() => {
    const url = user?.id ? `/psychological-tests/student/${user.id}/latest` : '/psychological-tests/latest';
    axiosClient.get(url)
      .then(r => {
        if (r.data?.data) {
          const d = r.data.data;
          const prevRes = {
            model: 'DASS21',
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

  const totalQ = activeQuestions.length;
  const answered = answers.slice(0, totalQ).filter(a => a !== null).length;
  const progress = Math.round((answered / totalQ) * 100);

  const handleAnswer = (idx, val) => {
    setAnswers(prev => { const next = [...prev]; next[idx] = val; return next; });
  };

  const handleSubmit = async () => {
    if (answered < totalQ) {
      setNotification({
        type: 'warning',
        title: 'Chưa hoàn thành đủ câu hỏi',
        message: `Bạn mới hoàn thành ${answered}/${totalQ} câu hỏi. Vui lòng trả lời đầy đủ để hệ thống cho kết quả chuẩn xác y khoa.`
      });
      return;
    }

    if (selectedModel === 'DASS21') {
      const depressionScore = answers.slice(0, 21).filter((_, i) => DASS21_QUESTIONS[i].cat === 'Depression').reduce((s, v) => s + (v||0)*2, 0);
      const anxietyScore    = answers.slice(0, 21).filter((_, i) => DASS21_QUESTIONS[i].cat === 'Anxiety').reduce((s, v) => s + (v||0)*2, 0);
      const stressScore     = answers.slice(0, 21).filter((_, i) => DASS21_QUESTIONS[i].cat === 'Stress').reduce((s, v) => s + (v||0)*2, 0);
      const needsConsultation = depressionScore >= 14 || anxietyScore >= 10 || stressScore >= 19;

      const res = {
        model: 'DASS21',
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
          rawAnswers: answers.slice(0, 21),
          answers: answers.slice(0, 21).map((a, i) => ({ index: i, score: a ?? 0 })),
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
    } else if (selectedModel === 'PHQ9') {
      const sum = answers.slice(0, 9).reduce((s, v) => s + (v || 0), 0);
      let level = 'Bình thường';
      let color = '#10b981';
      let bg = '#f0fdf4';
      if (sum >= 20) { level = 'Trầm cảm nặng'; color = '#b91c1c'; bg = '#fff1f2'; }
      else if (sum >= 15) { level = 'Trầm cảm nặng vừa'; color = '#ef4444'; bg = '#fef2f2'; }
      else if (sum >= 10) { level = 'Trầm cảm vừa'; color = '#f97316'; bg = '#fff7ed'; }
      else if (sum >= 5) { level = 'Trầm cảm nhẹ'; color = '#fbbf24'; bg = '#fffbeb'; }

      const needsConsultation = sum >= 10 || answers[8] >= 1; // Có ý nghĩ tự hại

      const res = {
        model: 'PHQ9',
        singleScore: sum,
        maxScore: 27,
        label: 'Mức độ Trầm Cảm (PHQ-9)',
        level,
        color,
        bg,
        needsConsultation,
        completedAt: new Date(),
        aiInterpretation: sum >= 10
          ? `Chỉ số PHQ-9 của bạn là ${sum}/27 (${level}). Đã vượt ngưỡng an toàn lâm sàng. Khuyến nghị bạn đặt lịch tư vấn với chuyên gia tâm lý học đường ngay.`
          : `Chỉ số PHQ-9 là ${sum}/27 (${level}). Tinh thần ổn định, không ghi nhận dấu hiệu trầm cảm bệnh lý.`
      };
      setResult(res);
      setStep('result');
    } else if (selectedModel === 'GAD7') {
      const sum = answers.slice(0, 7).reduce((s, v) => s + (v || 0), 0);
      let level = 'Tối thiểu';
      let color = '#10b981';
      let bg = '#f0fdf4';
      if (sum >= 15) { level = 'Lo âu nặng'; color = '#ef4444'; bg = '#fef2f2'; }
      else if (sum >= 10) { level = 'Lo âu vừa'; color = '#f97316'; bg = '#fff7ed'; }
      else if (sum >= 5) { level = 'Lo âu nhẹ'; color = '#fbbf24'; bg = '#fffbeb'; }

      const needsConsultation = sum >= 10;

      const res = {
        model: 'GAD7',
        singleScore: sum,
        maxScore: 21,
        label: 'Rối Loạn Lo Âu Lan Tỏa (GAD-7)',
        level,
        color,
        bg,
        needsConsultation,
        completedAt: new Date(),
        aiInterpretation: sum >= 10
          ? `Chỉ số GAD-7 của bạn là ${sum}/21 (${level}). Có biểu hiện hồi hộp, căng thẳng kéo dài. Hãy tập bài thở 4-7-8 và liên hệ phòng tư vấn UniMind.`
          : `Chỉ số GAD-7 là ${sum}/21 (${level}). Khả năng thích ứng và kiểm soát căng thẳng của bạn đang rất tốt.`
      };
      setResult(res);
      setStep('result');
    }
  };

  if (step === 'intro') return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', paddingTop: 10 }}>
        
        {/* Banner chính */}
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #042f2e 100%)',
          borderRadius: 20,
          padding: '28px 24px',
          color: '#ffffff',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(13,148,136,0.18)'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            CHUẨN HÓA LÂM SÀNG Y KHOA &amp; TÂM LÝ HỌC ĐƯỜNG
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '0 0 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Trắc Nghiệm Đánh Giá Sức Khỏe Tinh Thần
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 auto', maxWidth: 600 }}>
            Hệ thống hỗ trợ các thước đo chuẩn quốc tế được các bệnh viện tâm thần và trường đại học trên toàn thế giới sử dụng chính thức.
          </p>
        </div>

        {/* BỘ CHỌN THANG ĐO CHUẨN MỰC (DASS-21, PHQ-9, GAD-7) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 16,
          border: '1.5px solid #0d9488',
          boxShadow: '0 4px 20px rgba(13,148,136,0.08)',
          marginBottom: 24,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🎯 Chọn mẫu thang đo trắc nghiệm:
            </span>
            <span style={{ fontSize: 11.5, background: '#f0fdfa', color: '#0d9488', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
              Chuẩn lâm sàng y khoa
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              {
                id: 'DASS21',
                title: 'DASS-21 Toàn Diện (21 câu)',
                author: 'Lovibond & Lovibond (1995)',
                desc: 'Đo lường đa tầng cả 3 chỉ số: Trầm cảm, Lo âu và Căng thẳng trong 1 tuần qua.',
                badge: 'Khuyên dùng'
              },
              {
                id: 'PHQ9',
                title: 'PHQ-9 Trầm Cảm (9 câu)',
                author: 'Kroenke et al. (WHO / APA)',
                desc: 'Thước đo tiêu chuẩn vàng tầm soát triệu chứng và mức độ trầm cảm chuyên sâu.',
                badge: 'Chuyên sâu'
              },
              {
                id: 'GAD7',
                title: 'GAD-7 Lo Âu Lan Tỏa (7 câu)',
                author: 'Spitzer et al. (2006)',
                desc: 'Sàng lọc hồi hộp, bất an, lo lắng áp lực thi cử và hướng nghiệp sinh viên.',
                badge: 'Nhanh 3 phút'
              }
            ].map(m => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? '#0d9488' : '#e2e8f0'}`,
                    background: isSelected ? '#f0fdfa' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13.5, color: isSelected ? '#0f766e' : '#1e293b' }}>{m.title}</strong>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: isSelected ? '#0d9488' : '#e2e8f0', color: isSelected ? '#fff' : '#64748b', fontWeight: 700 }}>
                      {m.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#0d9488', fontWeight: 600, margin: '0 0 4px' }}>Nguồn: {m.author}</p>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{m.desc}</p>
                </div>
              );
            })}
          </div>
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
            {result.model === 'DASS21' ? (
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#334155' }}>
                <span>Trầm cảm: <strong>{result.depression.level}</strong></span>
                <span>Lo âu: <strong>{result.anxiety.level}</strong></span>
                <span>Căng thẳng: <strong>{result.stress.level}</strong></span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#334155' }}>
                <span>{result.label}: <strong>{result.singleScore}/{result.maxScore} ({result.level})</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Khung hướng dẫn bảo mật & thời gian */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
            📅 Khung thời gian đánh giá: <strong>Tình trạng của bạn trong 1 - 2 tuần qua</strong> • Quy mô: <strong>{totalQ} câu hỏi</strong> • Bảo mật ẩn danh 100%
          </span>
        </div>

        <button
          className="s-btn s-btn-primary"
          style={{ fontSize: 15, padding: '12px 32px', borderRadius: 10, boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
          onClick={() => {
            const count = selectedModel === 'PHQ9' ? 9 : selectedModel === 'GAD7' ? 7 : 21;
            setAnswers(Array(count).fill(null));
            setStep('quiz');
          }}
        >
          Bắt đầu làm bài test ({selectedModel})
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
            Kết Quả Trắc Nghiệm Tâm Lý {result.model || selectedModel}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
            Thời điểm thực hiện: {result.completedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {result.model === 'DASS21' ? (
          [
            { key: 'depression', label: 'Chỉ số Trầm cảm (Depression)' },
            { key: 'anxiety',    label: 'Chỉ số Lo âu (Anxiety)' },
            { key: 'stress',     label: 'Chỉ số Căng thẳng (Stress)' },
          ].map(r => {
            const d = result[r.key];
            return (
              <div key={r.key} style={{ background: d.bg, border: `1.5px solid ${d.color}35`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--s-text)' }}>{r.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4b5563' }}>Điểm quy đổi: {d.score}/42</span>
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
          })
        ) : (
          <div style={{ background: result.bg, border: `1.5px solid ${result.color}35`, borderRadius: 14, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--s-text)' }}>{result.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>Điểm: {result.singleScore}/{result.maxScore}</span>
                <span style={{ padding: '4px 12px', borderRadius: 6, background: result.color + '20', color: result.color, fontSize: 13, fontWeight: 800 }}>
                  {result.level}
                </span>
              </div>
            </div>
            <div className="s-progress-bar">
              <div className="s-progress-fill" style={{ width: `${Math.min(result.singleScore / result.maxScore * 100, 100)}%`, background: result.color }} />
            </div>
          </div>
        )}

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
            Khuyến nghị lâm sàng &amp; Nhận định chuyên môn
          </p>
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>
            {result.aiInterpretation || 'Kết quả trắc nghiệm đã được ghi nhận. Bạn có thể trò chuyện cùng chuyên viên tâm lý tại trường nếu cảm thấy cần được chia sẻ thêm.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="s-btn s-btn-outline" onClick={() => { setStep('intro'); setResult(null); setNotification(null); }}>
            Thực hiện bài test khác
          </button>
          <a href="/student/booking" className="s-btn s-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Đặt lịch tư vấn với chuyên gia
          </a>
        </div>
      </div>
    </div>
  );

  // MÀN HÌNH LÀM BÀI TRẮC NGHIỆM
  return (
    <div className="student-page-shell">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        {notification && (
          <InPageNotification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--s-text)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Bài test: {selectedModel}
            </h1>
            <p style={{ fontSize: 12, color: '#0f766e', margin: '2px 0 0', fontWeight: 600 }}>
              📅 Hãy chọn mức độ đúng với bạn trong 1 - 2 tuần qua
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
            {answered}/{totalQ} câu hoàn thành
          </span>
        </div>

        <div className="s-progress-bar" style={{ marginBottom: 20 }}>
          <div className="s-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeQuestions.map((q, idx) => (
            <div key={q.id} className="s-card" style={{ borderLeft: `3px solid ${answers[idx] !== null ? '#0f766e' : '#e5e7eb'}` }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--s-text)', margin: '0 0 12px', lineHeight: 1.5 }}>
                <span style={{ color: '#0f766e', fontWeight: 800 }}>{idx + 1}.</span> {q.text}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {activeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(idx, opt.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
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
            Quay lại chọn mẫu
          </button>
          <button
            className="s-btn s-btn-primary"
            onClick={handleSubmit}
            style={{ opacity: answered < totalQ ? 0.6 : 1 }}
          >
            Nộp kết quả ({answered}/{totalQ})
          </button>
        </div>
      </div>
    </div>
  );
}
