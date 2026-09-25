import { useState, useEffect, useRef } from 'react';

const PHASES = [
  { name: 'Hít vào', duration: 4, instruction: 'Hít vào từ từ bằng mũi...', class: 'inhale' },
  { name: 'Giữ',    duration: 7, instruction: 'Giữ nhẹ hơi thở...', class: 'hold' },
  { name: 'Thở ra', duration: 8, instruction: 'Thở ra chậm rãi bằng miệng...', class: 'exhale' },
];

const AFFIRMATIONS = [
  'Bạn đủ tốt. Bạn đủ mạnh. Bạn xứng đáng được yêu thương và tôn trọng.',
  'Hơi thở là cầu nối giữa tâm trí và cơ thể. Hãy tin tưởng vào quá trình tự chữa lành.',
  'Mỗi ngày bạn vẫn kiên trì cố gắng là một chiến thắng đáng tự hào.',
  'Cảm xúc của bạn là hoàn toàn hợp lý. Hãy đón nhận và dịu dàng với chính mình.',
  'Bầu trời sau cơn mưa bao giờ cũng trong sáng hơn.',
];

const WELLNESS_PRACTICES = [
  { tag: 'Âm thanh', title: 'Âm nhạc trị liệu', desc: 'Lắng nghe giai điệu êm dịu, tiếng mưa hoặc sóng biển trong 10 phút để giảm cortisol.' },
  { tag: 'Tâm trí', title: 'Đọc sách 10 phút', desc: 'Đọc vài trang sách tích cực giúp tâm trí phân tán khỏi căng thẳng tức thời.' },
  { tag: 'Thể chất', title: 'Vận động nhẹ nhàng', desc: 'Thực hiện động tác duỗi cơ hoặc đi bộ chậm giúp giải phóng endorphin tự nhiên.' },
  { tag: 'Thư giãn', title: 'Uống một ngụm nước ấm', desc: 'Cấp nước ấm và thả lỏng cơ mặt, hạ vai để cơ thể nhận tín hiệu an toàn.' },
  { tag: 'Ghi chép', title: 'Viết nhật ký cảm xúc', desc: 'Ghi lại suy nghĩ trong đầu hoặc 3 điều biết ơn hôm nay để giải tỏa áp lực.' },
  { tag: 'Không gian', title: 'Nhìn xa thư giãn mắt', desc: 'Hướng tầm mắt ra cửa sổ hoặc cây xanh trong 3-5 phút để mắt và não bộ nghỉ ngơi.' },
];

export default function SafeRoomPage() {
  const [isRunning, setRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [affIdx, setAffIdx]       = useState(0);
  const intervalRef               = useRef(null);
  const countRef                  = useRef(4);
  const phaseRef                  = useRef(0);

  const currentPhase = PHASES[phaseIdx];

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        countRef.current -= 1;
        setCountdown(countRef.current);
        if (countRef.current <= 0) {
          const next = (phaseRef.current + 1) % PHASES.length;
          phaseRef.current = next;
          setPhaseIdx(next);
          countRef.current = PHASES[next].duration;
          setCountdown(PHASES[next].duration);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Rotate affirmations
  useEffect(() => {
    const t = setInterval(() => setAffIdx(i => (i + 1) % AFFIRMATIONS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const handleToggle = () => {
    if (!isRunning) {
      phaseRef.current = 0; setPhaseIdx(0);
      countRef.current = 4; setCountdown(4);
    }
    setRunning(v => !v);
  };

  return (
    <div className="student-page-shell">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Phòng An Yên
        </h1>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
          Không gian thư giãn, hít thở và tái tạo năng lượng cho tâm trí
        </p>
      </div>

      {/* Breathing exercise */}
      <div className="s-card" style={{ textAlign: 'center', marginBottom: 20, padding: '36px 24px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 6px' }}>
          Bài Hít Thở 4-7-8
        </h2>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: '0 0 28px' }}>
          Kỹ thuật điều hòa nhịp tim và thần kinh phó giao cảm — giúp giảm bớt căng thẳng tức thời
        </p>

        {/* Breathing circle */}
        <div className={`s-breath-circle${isRunning ? ` ${currentPhase.class}` : ''}`}>
          <div style={{ textAlign: 'center' }}>
            {isRunning ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4, fontWeight: 700 }}>{currentPhase.name}</div>
              </>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700 }}>Bắt đầu</div>
            )}
          </div>
        </div>

        {isRunning && (
          <p style={{ fontSize: 15, color: 'var(--s-primary)', fontWeight: 700, margin: '20px 0 0', animation: 'pulse 1s ease infinite' }}>
            {currentPhase.instruction}
          </p>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            className={`s-btn ${isRunning ? 's-btn-outline' : 's-btn-primary'}`}
            onClick={handleToggle}
            style={{ minWidth: 160 }}
          >
            {isRunning ? 'Dừng bài tập' : 'Bắt đầu bài tập'}
          </button>
        </div>

        {/* Phase guide */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {PHASES.map((p, i) => (
            <div key={p.name} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: isRunning && phaseIdx === i ? 'var(--s-primary-soft)' : 'var(--s-bg-soft)',
              color: isRunning && phaseIdx === i ? 'var(--s-primary)' : 'var(--s-text-muted)',
              border: `1.5px solid ${isRunning && phaseIdx === i ? 'var(--s-primary)' : 'var(--s-border)'}`,
            }}>
              {p.name}: {p.duration} giây
            </div>
          ))}
        </div>
      </div>

      {/* Affirmation card */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800, display: 'block', marginBottom: 8 }}>
          Thông điệp chánh niệm hôm nay
        </span>
        <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
          "{AFFIRMATIONS[affIdx]}"
        </p>
      </div>

      {/* Practices grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {WELLNESS_PRACTICES.map(item => (
          <div key={item.title} className="s-card" style={{ textAlign: 'left', padding: '18px 20px' }}>
            <span style={{ fontSize: 11, background: 'var(--s-primary-soft)', color: 'var(--s-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 800, display: 'inline-block', marginBottom: 8 }}>
              {item.tag}
            </span>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 6px' }}>{item.title}</p>
            <p style={{ fontSize: 12.5, color: 'var(--s-text-muted)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
    </div>
  );
}
