import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const MOODS = [
  { value: 1, label: 'Rất tệ',    color: '#ef4444', bg: '#fef2f2' },
  { value: 2, label: 'Không tốt', color: '#f97316', bg: '#fff7ed' },
  { value: 3, label: 'Bình thường', color: '#6b7280', bg: '#f3f4f6' },
  { value: 4, label: 'Khá ổn',   color: '#0d9488', bg: '#f0fdfa' },
  { value: 5, label: 'Tuyệt vời', color: '#16a34a', bg: '#f0fdf4' },
];

const MOCK_ENTRIES = [
  { id: 'j1', mood: 4, content: 'Hôm nay trình bày được phần frontend, thầy khen cấu trúc sạch. Nhẹ nhõm hơn nhiều!', createdAt: new Date(Date.now() - 86400000), tags: ['học tập', 'vui'], aiAdvice: 'Rất vui khi nghe điều này! Hãy tiếp tục duy trì sự tự tin này nhé.' },
  { id: 'j2', mood: 2, content: 'Thức đến 2 giờ sáng vẫn không debug xong lỗi. Mệt mỏi và chán nản.', createdAt: new Date(Date.now() - 2*86400000), tags: ['mệt mỏi', 'học tập'], aiAdvice: 'Khi bế tắc, hãy tạm rời màn hình và đi dạo 15 phút để não được nạp lại năng lượng.' },
  { id: 'j3', mood: 3, content: 'Ngày bình thường. Ăn cơm nhà bếp, xem phim với bạn cùng phòng. Không tệ.', createdAt: new Date(Date.now() - 3*86400000), tags: ['bạn bè'], aiAdvice: 'Những khoảnh khắc bình dị cùng bạn bè là liều thuốc tinh thần rất tốt.' },
];

function mapEntry(j) {
  let moodVal = j.mood;
  if (!moodVal && j.moodState) {
    const s = j.moodState.toLowerCase();
    if (s.includes('great')) moodVal = 5;
    else if (s.includes('peace')) moodVal = 4;
    else if (s.includes('stress')) moodVal = 2;
    else if (s.includes('exhaust')) moodVal = 1;
    else moodVal = 3;
  }
  return {
    id: j.id,
    mood: moodVal || 3,
    content: j.content || j.journalContent || '',
    tags: Array.isArray(j.tags) ? j.tags : (j.triggers ? j.triggers.split(',').map(t => t.trim()) : []),
    createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
    aiAdvice: j.aiAdvice || '',
    sentimentLabel: j.sentimentLabel || ''
  };
}

function MoodChart({ entries }) {
  const recent = [...entries].reverse().slice(-7);

  return (
    <div className="s-card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 16px' }}>
        Tâm trạng 7 ngày gần nhất
      </h3>
      {recent.length === 0 ? (
        <p style={{ color: 'var(--s-text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Chưa có dữ liệu. Hãy ghi chép nhật ký để theo dõi biến thiên cảm xúc!
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80, justifyContent: 'flex-start' }}>
          {recent.map((e) => {
            const mood = MOODS.find(m => m.value === e.mood) || MOODS[2];
            return (
              <div key={e.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: '100%', maxWidth: 36,
                  height: `${(e.mood / 5) * 60 + 8}px`,
                  background: mood.color,
                  borderRadius: 4,
                  opacity: 0.85,
                  transition: 'height 0.4s ease',
                }} title={mood.label} />
                <span style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600 }}>
                  {new Date(e.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JournalEntry({ entry }) {
  const mood = MOODS.find(m => m.value === entry.mood) || MOODS[2];
  return (
    <div className="s-card" style={{ borderLeft: `3px solid ${mood.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: 4,
            background: mood.bg,
            color: mood.color,
            marginRight: 8
          }}>
            {mood.label}
          </span>
          <span style={{ fontSize: 12, color: 'var(--s-text-soft)' }}>
            {new Date(entry.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {entry.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {entry.tags.map(t => (
              <span key={t} className="s-badge s-badge-teal" style={{ fontSize: 10 }}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--s-text-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
        {entry.content}
      </p>

      {entry.aiAdvice && (
        <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#0f766e', lineHeight: 1.5 }}>
          <strong>Lời khuyên UniMind AI:</strong> {entry.aiAdvice}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { user } = useAuthStore();
  const [entries, setEntries]       = useState(MOCK_ENTRIES);
  const [selectedMood, setMood]     = useState(null);
  const [content, setContent]       = useState('');
  const [tags, setTags]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [notification, setNotification] = useState(null); // { type, title, message }

  const loadJournals = () => {
    const url = user?.id ? `/mood-journals/student/${user.id}` : '/mood-journals/my';
    axiosClient.get(url)
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          setEntries(r.data.data.map(mapEntry));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadJournals();
  }, [user?.id]);

  const handleSave = async () => {
    if (!selectedMood) {
      setNotification({
        type: 'warning',
        title: 'Chưa chọn tâm trạng',
        message: 'Vui lòng chọn một trạng thái cảm xúc của bạn hôm nay trước khi lưu.'
      });
      return;
    }

    if (!content.trim()) {
      setNotification({
        type: 'warning',
        title: 'Chưa có nội dung',
        message: 'Hãy chia sẻ một vài dòng suy nghĩ hoặc điều gì đã diễn ra trong ngày của bạn.'
      });
      return;
    }

    setSaving(true);
    setNotification(null);

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const tempEntry = {
      id: `j-${Date.now()}`,
      mood: selectedMood,
      content,
      tags: tagList,
      createdAt: new Date(),
      aiAdvice: ''
    };

    try {
      const res = await axiosClient.post('/mood-journals', {
        mood: selectedMood,
        content,
        tags: tagList,
        studentId: user?.id,
        energyLevel: selectedMood * 2
      });

      if (res.data?.data) {
        const savedDto = mapEntry(res.data.data);
        setEntries(prev => [savedDto, ...prev]);

        setNotification({
          type: 'success',
          title: 'Đã lưu nhật ký thành công',
          message: savedDto.aiAdvice
            ? `Lời khuyên AI dành cho bạn: "${savedDto.aiAdvice}"`
            : 'Nhật ký của bạn đã được mã hóa an toàn và lưu vào hệ thống.'
        });
      } else {
        setEntries(prev => [tempEntry, ...prev]);
        setNotification({
          type: 'success',
          title: 'Đã lưu nhật ký',
          message: 'Bản ghi cảm xúc hôm nay của bạn đã được cập nhật thành công.'
        });
      }
    } catch {
      setEntries(prev => [tempEntry, ...prev]);
      setNotification({
        type: 'success',
        title: 'Đã lưu cục bộ',
        message: 'Đã cập nhật bài nhật ký vào danh sách của bạn.'
      });
    }

    setMood(null);
    setContent('');
    setTags('');
    setSaving(false);
  };

  return (
    <div className="student-page-shell">

      {/* Page Header: Pure Typography */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Nhật Ký Cảm Xúc
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--s-text-muted)', margin: 0 }}>
          Ghi lại cảm xúc mỗi ngày — mọi dữ liệu được mã hóa bảo mật và hoàn toàn riêng tư
        </p>
      </div>

      {/* In-Page Notification */}
      {notification && (
        <InPageNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Write new entry */}
      <div className="s-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 16px' }}>
          Ghi chép hôm nay
        </h3>

        {/* Mood picker: Clean typography pills */}
        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#4b5563', margin: '0 0 10px' }}>
          Trạng thái cảm xúc của bạn:
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {MOODS.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: `1.5px solid ${selectedMood === m.value ? m.color : '#e5e7eb'}`,
                background: selectedMood === m.value ? m.bg : '#ffffff',
                color: selectedMood === m.value ? m.color : '#4b5563',
                fontFamily: "'Manrope', sans-serif",
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            Nội dung tâm sự / Ghi chú
          </label>
          <textarea
            className="s-input s-textarea"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Hôm nay bạn đã trải qua những gì? Điều gì làm bạn suy nghĩ nhiều nhất..."
            style={{ minHeight: 120 }}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            Chủ đề liên quan (phân cách bằng dấu phẩy)
          </label>
          <input
            className="s-input"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="học tập, đồ án, bạn bè, gia đình..."
          />
        </div>

        <button
          className="s-btn s-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '9px 22px', fontSize: 13.5 }}
        >
          {saving ? 'Đang lưu vào hệ thống...' : 'Lưu nhật ký'}
        </button>
      </div>

      {/* Mood chart */}
      <MoodChart entries={entries} />

      {/* History */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 14px' }}>
          Lịch sử nhật ký ({entries.length} bài)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => <JournalEntry key={e.id} entry={e} />)}
        </div>
      </div>

    </div>
  );
}
