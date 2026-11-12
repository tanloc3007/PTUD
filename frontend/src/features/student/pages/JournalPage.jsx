import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';
import './StudentJournalPage.css';

const MOODS = [
  { value: 1, label: 'Rất tệ',      badgeClass: 'terrible', color: '#ef4444', bg: '#fef2f2' },
  { value: 2, label: 'Không tốt',   badgeClass: 'bad',      color: '#f97316', bg: '#fff7ed' },
  { value: 3, label: 'Bình thường', badgeClass: 'normal',   color: '#6b7280', bg: '#f3f4f6' },
  { value: 4, label: 'Khá ổn',     badgeClass: 'good',     color: '#0d9488', bg: '#f0fdfa' },
  { value: 5, label: 'Tuyệt vời',   badgeClass: 'great',    color: '#16a34a', bg: '#f0fdf4' },
];

/**
 * Thuật toán phân tích tâm lý ngôn ngữ dự phòng dựa trên
 * Khung Tâm lý học Ngôn ngữ LIWC (Linguistic Inquiry and Word Count - James W. Pennebaker)
 */
function getFallbackAdvice(content) {
  const text = (content || '').toLowerCase();

  // 1. LIWC Crisis Ideation Lexicon (Tự hại / Buông xuôi)
  const liwcCrisis = [
    'reset lại cuộc đời', 'reset cuộc đời', 'muốn chết', 'tự tử', 'không muốn sống',
    'rạch tay', 'chấm dứt tất cả', 'bế tắc cùng cực', 'kết liễu', 'end my life', 'want to die'
  ];
  if (liwcCrisis.some(w => text.includes(w))) {
    return {
      mood: 1,
      advice: 'UniMind nhận thấy bạn đang trải qua những cảm xúc bế tắc cùng cực. Bạn hoàn toàn không phải vượt qua điều này một mình. Hãy cho phép bản thân nghỉ ngơi và đừng ngần ngại kết nối ngay với chuyên viên tư vấn tâm lý UniMind hoặc người thân nhé.'
    };
  }

  // 2. LIWC Dimensions Lexicon:
  // - posemo: Positive Emotion (Cảm xúc tích cực)
  const liwcPosemo = [
    'vui', 'hạnh phúc', 'tuyệt vời', 'hào hứng', 'nhẹ nhõm', 'bình yên', 'thư thái',
    'tốt', 'thành công', 'tự tin', 'biết ơn', 'hài lòng', 'may mắn', 'yêu đời',
    'siêu vui', 'cực kỳ vui', 'quá đã', 'ngập tràn', 'rực rỡ', 'peaceful', 'relaxed',
    'happy', 'great', 'wonderful', 'amazing', 'grateful'
  ];

  // - negemo_anx: Negative Emotion - Anxiety (Lo âu, căng thẳng, áp lực)
  const liwcAnx = [
    'áp lực', 'stress', 'lo lắng', 'lo âu', 'căng thẳng', 'bất an', 'bồn chồn',
    'sợ', 'quá tải', 'deadline', 'đồ án', 'thi cử', 'điểm kém', 'thất bại',
    'anxious', 'nervous', 'pressure', 'overwhelmed'
  ];

  // - negemo_sad: Negative Emotion - Sadness / Exhaustion (Buồn bã, kiệt sức, mất mát)
  const liwcSad = [
    'buồn', 'chán', 'mệt', 'mệt mỏi', 'tuyệt vọng', 'khóc', 'cô đơn', 'lạc lõng',
    'không làm được', 'nghỉ luôn', 'kiệt sức', 'u sầu', 'trống rỗng', 'chán nản',
    'thức đến 2 giờ', 'sad', 'tired', 'exhausted', 'lonely', 'depressed'
  ];

  let posemoCount = 0;
  let anxCount = 0;
  let sadCount = 0;

  liwcPosemo.forEach(w => { if (text.includes(w)) posemoCount++; });
  liwcAnx.forEach(w => { if (text.includes(w)) anxCount++; });
  liwcSad.forEach(w => { if (text.includes(w)) sadCount++; });

  const negemoTotal = anxCount + sadCount;

  // Lượng hóa điểm mức cảm xúc (1 - 5) theo chuẩn LIWC
  if (sadCount >= 2 && negemoTotal >= 3) {
    return {
      mood: 1,
      advice: 'Có vẻ như sự mệt mỏi và cảm giác kiệt sức đang dồn nén khiến bạn cảm thấy quá tải. Hãy dừng lại một nhịp, cho phép bản thân nghỉ ngơi và chia sẻ cùng chuyên viên tư vấn tâm lý khi cần nhé.'
    };
  }

  if (negemoTotal > posemoCount) {
    if (anxCount >= sadCount) {
      return {
        mood: 2,
        advice: 'Những áp lực học tập và âu lo hiện tại dường như đang làm bạn căng thẳng. Hãy thử hít thở sâu, chia nhỏ khối lượng công việc và nhớ rằng bạn đang làm rất tốt trong khả năng của mình.'
      };
    } else {
      return {
        mood: 2,
        advice: 'Dường như bạn đang cảm thấy mệt mỏi và thiếu năng lượng hôm nay. Hãy cho phép bản thân nghỉ ngơi một chút, uống ngụm nước ấm và hồi phục sức khỏe nhé.'
      };
    }
  }

  if (posemoCount >= 2 && negemoTotal === 0) {
    return {
      mood: 5,
      advice: 'Thật tuyệt vời khi bạn có một ngày tràn ngập niềm vui và nguồn năng lượng tích cực! Hãy ghi nhớ và tận hưởng trọn vẹn khoảnh khắc này để tiếp thêm động lực cho chặng đường phía trước.'
    };
  }

  if (posemoCount > negemoTotal) {
    return {
      mood: 4,
      advice: 'Rất vui khi thấy bạn đang duy trì được tâm trạng tích cực và ổn định. Chúc bạn tiếp tục giữ được sự an yên và tự tin trên hành trình học tập!'
    };
  }

  // Mặc định: Mức 3 (Bình thường / Cân bằng tiến trình nhận thức)
  return {
    mood: 3,
    advice: 'Cảm ơn bạn đã dành thời gian ghi lại suy nghĩ và lắng nghe bản thân hôm nay. Chúc bạn luôn giữ vững sự cân bằng và bình an trong cuộc sống.'
  };
}

// ── Hàm gọi AI OpenRouter để phân tích tâm trạng theo Khung Tâm lý học Ngôn ngữ LIWC ──
async function fetchAIAdvice(content) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return getFallbackAdvice(content);
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://unimind.edu.vn',
        'X-Title': 'UniMind Student Wellness',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Bạn là hệ thống AI phân tích tâm lý học đường của UniMind dựa trên Khung Tâm lý học Ngôn ngữ LIWC (Linguistic Inquiry and Word Count - GS. James W. Pennebaker).

Nhiệm vụ của bạn:
1. Phân tích nội dung nhật ký của sinh viên theo các chiều kích ngôn ngữ chuẩn LIWC:
   - Affective Processes (Tiến trình cảm xúc):
     + posemo (Positive Emotion): từ ngữ tích cực, hy vọng, biết ơn, nhẹ nhõm, vui mừng, tự tin.
     + negemo (Negative Emotion): bóc tách rõ 3 nhánh:
       * anx (Anxiety): áp lực thi cử, lo âu, bồn chồn, căng thẳng, quá tải, deadline, đồ án.
       * sad (Sadness): buồn bã, mệt mỏi, chán nản, kiệt sức, tuyệt vọng, cô đơn, mất năng lượng.
       * anger (Anger): bực bội, khó chịu, ức chế.
   - Cognitive Processes (Nhận thức): insight (nhận thức sâu), cause (nhân quả), discrep (khoảng cách kỳ vọng: "ước gì", "lẽ ra").
   - Self-Focus & Rumination: tần suất đại từ ngôi thứ nhất ("tôi", "mình") khi đi kèm negemo phản ánh hiện tượng gặm nhấm cảm xúc.
   - Crisis Ideation: dấu hiệu buông xuôi, tự hại, reset cuộc đời, muốn chấm dứt.

2. Quy đổi sang Điểm Tâm trạng (Mood Score) từ 1 đến 5 theo chuẩn LIWC:
   - 1 ("Rất tệ"): negemo cực độ (đặc biệt là sad và anx vượt ngưỡng), xuất hiện từ chỉ dấu khủng hoảng/tự hại/buông xuôi, rumination cao.
   - 2 ("Không tốt"): negemo chiếm ưu thế so với posemo (áp lực học tập, mệt mỏi, stress, chán nản, kiệt sức nhẹ), chưa có ý định tự hại.
   - 3 ("Bình thường"): Cân bằng cảm xúc, ngôn từ trung tính, trần thuật sự việc thường nhật, tải lượng cảm xúc thấp.
   - 4 ("Khá ổn"): posemo chiếm ưu thế, thể hiện sự nhẹ nhõm, hoàn thành công việc, cảm giác an yên, tự tin.
   - 5 ("Tuyệt vời"): posemo đạt mức cao nhất, thể hiện niềm vui lớn, sự tự hào, biết ơn sâu sắc, tràn đầy năng lượng.

3. Đưa ra Lời khuyên cho bạn:
   - Ngắn gọn (2-3 câu), ấm áp, đồng cảm sâu sắc theo tâm lý học tích cực (Positive Psychology).
   - Nếu ở Mức 1 (khủng hoảng), khuyến khích sinh viên tìm sự hỗ trợ bảo mật từ chuyên viên tư vấn UniMind hoặc người đáng tin cậy.

BẮT BUỘC trả về định dạng JSON thuần túy (không markdown \`\`\`):
{
  "mood": <số nguyên từ 1 đến 5>,
  "advice": "<lời khuyên tâm lý ngắn gọn cho bạn>"
}`
          },
          {
            role: 'user',
            content: `Nội dung nhật ký của sinh viên:\n"${content}"\n\nHãy phân tích theo Khung Tâm lý học Ngôn ngữ LIWC và đưa ra điểm tâm trạng (1-5) cùng lời khuyên cho bạn.`
          }
        ],
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }),
    });

    if (!res.ok) return getFallbackAdvice(content);

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || '';
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);

    const moodVal = Math.min(5, Math.max(1, parseInt(parsed.mood, 10) || 3));
    const adviceText = parsed.advice || '';

    if (!adviceText) return getFallbackAdvice(content);

    return {
      mood: moodVal,
      advice: adviceText
    };
  } catch {
    return getFallbackAdvice(content);
  }
}

const MOCK_ENTRIES = [
  { id: 'j1', mood: 4, content: 'Hôm nay trình bày được phần frontend, thầy khen cấu trúc sạch. Nhẹ nhõm hơn nhiều!', createdAt: new Date(Date.now() - 86400000), tags: ['học tập', 'vui'], aiAdvice: 'Rất vui khi nghe điều này! Hãy tiếp tục duy trì sự tự tin này nhé.' },
  { id: 'j2', mood: 2, content: 'Thức đến 2 giờ sáng vẫn không debug xong lỗi. Mệt mỏi và chán nản.', createdAt: new Date(Date.now() - 2 * 86400000), tags: ['mệt mỏi', 'học tập'], aiAdvice: 'Khi bế tắc, hãy tạm rời màn hình và đi dạo 15 phút để não được nạp lại năng lượng.' },
  { id: 'j3', mood: 3, content: 'Ngày bình thường. Ăn cơm nhà bếp, xem phim với bạn cùng phòng. Không tệ.', createdAt: new Date(Date.now() - 3 * 86400000), tags: ['bạn bè'], aiAdvice: 'Những khoảnh khắc bình dị cùng bạn bè là liều thuốc tinh thần rất tốt.' },
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

  // Heuristic thông minh cho các bài viết lịch sử đã lưu trước đây (tránh tình trạng tất cả đều là "Bình thường")
  const text = (j.content || j.journalContent || '').toLowerCase();
  if (moodVal === 3 || !moodVal) {
    if (text.includes('siêu đẹp trời') || text.includes('10 triệu') || text.includes('tuyệt vời') || text.includes('hào hứng') || text.includes('mong chờ') || text.includes('vui vãi')) {
      moodVal = 5;
    } else if (text.includes('reset lại cuộc đời') || text.includes('reset cuộc đời') || text.includes('muốn chết') || text.includes('tự tử') || text.includes('nghỉ luôn')) {
      moodVal = 1;
    } else if (text.includes('buồn') || text.includes('chán') || text.includes('mệt') || text.includes('áp lực') || text.includes('không làm được') || text.includes('thức đến 2 giờ')) {
      moodVal = 2;
    } else if (text.includes('vui') || text.includes('nhẹ nhõm') || text.includes('bình yên') || text.includes('khen')) {
      moodVal = 4;
    }
  }

  return {
    id: j.id,
    mood: moodVal || 3,
    content: j.content || j.journalContent || '',
    tags: Array.isArray(j.tags) ? j.tags : (j.triggers ? j.triggers.split(',').map(t => t.trim()).filter(Boolean) : []),
    createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
    aiAdvice: j.aiAdvice || '',
    sentimentLabel: j.sentimentLabel || ''
  };
}

function computeStreakDays(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return 0;
  const dateSet = new Set(
    entries
      .map(e => e.createdAt)
      .filter(Boolean)
      .map(ts => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
  );

  const cursor = new Date();
  const todayKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
  if (!dateSet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!dateSet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function MoodChart({ entries }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [periodDays, setPeriodDays] = useState(7);

  // Lọc theo kỳ hạn và sắp xếp trình tự thời gian tăng dần
  const recent = [...entries]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-periodDays);

  const formatShortDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  // Kích thước hệ tọa độ SVG khớp với mẫu chart-wrapper
  const SVG_WIDTH = 700;
  const SVG_HEIGHT = 270;
  const PAD_X = 24;
  const TOP_Y = 25;
  const BOTTOM_Y = 237;
  const CHART_WIDTH = SVG_WIDTH - PAD_X * 2;
  const CHART_HEIGHT = BOTTOM_Y - TOP_Y;

  const getY = (moodVal) => {
    const val = Math.min(5, Math.max(1, Number(moodVal) || 3));
    return TOP_Y + ((5 - val) / 4) * CHART_HEIGHT;
  };

  const getX = (index, total) => {
    if (total <= 1) return SVG_WIDTH / 2;
    return PAD_X + (index / (total - 1)) * CHART_WIDTH;
  };

  const points = recent.map((e, idx) => {
    const moodObj = MOODS.find(m => m.value === e.mood) || MOODS[2];
    return {
      x: getX(idx, recent.length),
      y: getY(e.mood),
      entry: e,
      moodObj,
      index: idx
    };
  });

  const activePoint = hoveredIdx !== null && points[hoveredIdx]
    ? points[hoveredIdx]
    : (points.length > 0 ? points[points.length - 1] : null);

  // Thuật toán nội suy đường cong mượt mà (Smooth Cubic Bézier Spline)
  const buildSmoothCurve = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = points.length > 0 ? buildSmoothCurve(points) : '';
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${BOTTOM_Y} L ${points[0].x.toFixed(1)} ${BOTTOM_Y} Z`
    : '';

  const gridLevels = [
    { value: 5, label: 'Tuyệt vời',   y: getY(5) },
    { value: 4, label: 'Khá ổn',     y: getY(4) },
    { value: 3, label: 'Bình thường', y: getY(3) },
    { value: 2, label: 'Không tốt',   y: getY(2) },
    { value: 1, label: 'Rất tệ',      y: getY(1) },
  ];

  const avgMood = recent.length > 0
    ? (recent.reduce((sum, e) => sum + e.mood, 0) / recent.length).toFixed(1)
    : null;

  const latestMood = recent.length > 0 ? recent[recent.length - 1].mood : null;
  const trendLabel = latestMood
    ? latestMood >= 4
      ? 'Tích cực & Khởi sắc'
      : latestMood <= 2
        ? 'Cần nâng đỡ & Nghỉ ngơi'
        : 'Cân bằng & Ổn định'
    : null;

  return (
    <div className="chart-card">
      <div className="chart-heading">
        <div>
          <span className="section-label">YOUR EMOTIONAL JOURNEY</span>
          <h2>Tâm trạng {periodDays} ngày gần nhất</h2>
          <p>Theo dõi sự thay đổi cảm xúc qua từng ngày (Chuẩn LIWC).</p>
        </div>

        <select
          className="period-select"
          value={periodDays}
          onChange={e => {
            setPeriodDays(Number(e.target.value));
            setHoveredIdx(null);
          }}
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
        </select>
      </div>

      {recent.length === 0 ? (
        <div className="chart-empty-state">
          <p>Chưa có dữ liệu biến thiên cảm xúc.</p>
          <span>Hãy ghi chép nhật ký hôm nay để mở khóa biểu đồ theo dõi nhịp điệu tâm trạng theo chuẩn LIWC!</span>
        </div>
      ) : (
        <>
          {/* CURRENT MOOD / SELECTED NODE SUMMARY */}
          {activePoint && (
            <div className="mood-summary">
              <div className="mood-status">
                <span
                  className="status-dot"
                  style={{
                    background: activePoint.moodObj.color,
                    boxShadow: `0 0 0 5px ${activePoint.moodObj.color}22`
                  }}
                />
                <div>
                  <strong style={{ color: activePoint.moodObj.color }}>
                    {activePoint.moodObj.label} ({activePoint.entry.mood}/5)
                  </strong>
                  <small>
                    {hoveredIdx !== null ? 'Đang xem · ' : 'Ghi nhận gần nhất · '}
                    {formatShortDate(activePoint.entry.createdAt)} (
                    {new Date(activePoint.entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                  </small>
                </div>
              </div>

              <div className="mood-summary-right">
                {avgMood && trendLabel && (
                  <div className="mood-summary-badges">
                    <span className="mood-summary-badge">Điểm TB: <strong>{avgMood}/5.0</strong></span>
                    <span className="mood-summary-badge">{trendLabel}</span>
                  </div>
                )}
                <p className="mood-summary-advice">
                  {activePoint.entry.aiAdvice || `"${activePoint.entry.content}"`}
                </p>
              </div>
            </div>
          )}

          {/* SVG CHART */}
          <div className="chart-wrapper">
            <div className="chart-y-labels">
              {gridLevels.map(lvl => (
                <span key={lvl.value}>{lvl.label}</span>
              ))}
            </div>

            <div className="chart-area">
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="mood-chart">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31B7AD" stopOpacity=".28" />
                    <stop offset="100%" stopColor="#31B7AD" stopOpacity=".01" />
                  </linearGradient>

                  <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16A69D" />
                    <stop offset="100%" stopColor="#43C7A5" />
                  </linearGradient>
                </defs>

                {/* GRID */}
                <g className="chart-grid">
                  {gridLevels.map(lvl => (
                    <line key={lvl.value} x1="0" y1={lvl.y} x2={SVG_WIDTH} y2={lvl.y} />
                  ))}
                </g>

                {/* AREA */}
                {areaPath && <path className="chart-fill" d={areaPath} />}

                {/* SINGLE POINT GUIDE LINE */}
                {points.length === 1 && (
                  <line
                    x1="0"
                    y1={points[0].y}
                    x2={SVG_WIDTH}
                    y2={points[0].y}
                    stroke="#16A69D"
                    strokeDasharray="5 5"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                  />
                )}

                {/* ACTIVE VERTICAL GUIDE */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    y1={TOP_Y}
                    x2={activePoint.x}
                    y2={BOTTOM_Y}
                    stroke="#159c98"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    strokeOpacity="0.45"
                  />
                )}

                {/* CURVE LINE */}
                {points.length > 1 && <path className="chart-line" d={linePath} />}

                {/* POINTS + X-AXIS DATES */}
                {points.map((pt) => {
                  const isHovered = hoveredIdx === pt.index;
                  const isSelected = activePoint?.index === pt.index;

                  return (
                    <g
                      key={pt.entry.id || pt.index}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIdx(pt.index)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => setHoveredIdx(pt.index)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered || isSelected ? 13 : 9}
                        fill={pt.moodObj.color}
                        fillOpacity={isHovered ? 0.30 : isSelected ? 0.20 : 0.10}
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 7.5 : 6}
                        fill={pt.moodObj.color}
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      <text
                        x={pt.x}
                        y={BOTTOM_Y + 23}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isSelected || isHovered ? '800' : '600'}
                        fill={isSelected || isHovered ? '#159c7b' : '#71849b'}
                      >
                        {formatShortDate(pt.entry.createdAt)}
                      </text>
                      <circle cx={pt.x} cy={pt.y} r="22" fill="transparent" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="chart-legend">
            <div className="chart-legend-items">
              <span><i className="legend-dot great" />Tuyệt vời</span>
              <span><i className="legend-dot good" />Khá ổn</span>
              <span><i className="legend-dot normal" />Bình thường</span>
              <span><i className="legend-dot bad" />Không tốt</span>
              <span><i className="legend-dot terrible" />Rất tệ</span>
            </div>
            <span className="chart-hint">Chạm hoặc rê chuột vào các điểm tròn để xem chi tiết</span>
          </div>
        </>
      )}
    </div>
  );
}

function JournalEntry({ entry }) {
  const mood = MOODS.find(m => m.value === entry.mood) || MOODS[2];
  const isHighRisk = entry.mood === 1;
  const created = new Date(entry.createdAt);
  const dayStr = String(created.getDate()).padStart(2, '0');
  const monthStr = `THÁNG ${created.getMonth() + 1}`;
  const timeText = created.toLocaleDateString('vi-VN', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

  return (
    <article className="history-item">
      <div className="history-date">
        <strong>{dayStr}</strong>
        <span>{monthStr}</span>
      </div>

      <div className="history-content">
        <div className="history-meta">
          <span className={`mood-badge ${mood.badgeClass}`}>
            {mood.label}
          </span>
          <span className="liwc-tag">Chuẩn LIWC</span>
          <span>{timeText}</span>
          {entry.tags?.length > 0 && entry.tags.map(t => (
            <span key={t} className="entry-tag">#{t}</span>
          ))}
        </div>

        <p className="history-entry-text">
          {entry.content}
        </p>

        {isHighRisk && (
          <div className="history-crisis-alert">
            Nếu bạn đang cảm thấy quá tải hoặc bế tắc, hãy nhớ rằng UniMind luôn có chuyên viên tư vấn đồng hành cùng bạn (Hotline SOS 1900 1267).
          </div>
        )}

        {entry.aiAdvice && (
          <div className="history-advice-box">
            <strong>Lời khuyên cho bạn:</strong> {entry.aiAdvice}
          </div>
        )}
      </div>
    </article>
  );
}

export default function JournalPage() {
  const { user } = useAuthStore();

  const [entries, setEntries]   = useState(MOCK_ENTRIES);
  const [content, setContent]   = useState('');
  const [tags, setTags]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

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

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!content.trim()) {
      setNotification({
        type: 'warning',
        title: 'Chưa có nội dung',
        message: 'Hãy chia sẻ một vài dòng suy nghĩ hoặc điều gì đã diễn ra trong ngày của bạn.'
      });
      return;
    }

    setSaving(true);
    setAiLoading(true);
    setNotification(null);

    // 1. Gọi AI phân tích cảm xúc & mức tâm trạng (1-5)
    const aiResult = await fetchAIAdvice(content);
    const analyzedMood = aiResult.mood || 3;
    const aiAdvice = aiResult.advice || '';
    setAiLoading(false);

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const tempEntry = {
      id: `j-${Date.now()}`,
      mood: analyzedMood,
      content,
      tags: tagList,
      createdAt: new Date(),
      aiAdvice: aiAdvice
    };

    const moodStateMap = {
      5: 'Great',
      4: 'Peaceful',
      3: 'Sad',
      2: 'Stressed',
      1: 'Exhausted'
    };
    const energyMap = {
      5: 10,
      4: 8,
      3: 6,
      2: 4,
      1: 2
    };

    try {
      const res = await axiosClient.post('/mood-journals', {
        content,
        tags: tagList,
        studentId: user?.id,
        mood: analyzedMood,
        moodState: moodStateMap[analyzedMood] || 'Sad',
        energyLevel: energyMap[analyzedMood] || 6,
        aiAdvice: aiAdvice
      });

      if (res.data?.data) {
        const savedDto = mapEntry(res.data.data);
        savedDto.mood = analyzedMood;
        savedDto.aiAdvice = aiAdvice || savedDto.aiAdvice;
        setEntries(prev => [savedDto, ...prev]);
      } else {
        setEntries(prev => [tempEntry, ...prev]);
      }
    } catch {
      setEntries(prev => [tempEntry, ...prev]);
    }

    const moodObj = MOODS.find(m => m.value === analyzedMood) || MOODS[2];
    setNotification({
      type: 'success',
      title: `Đã phân tích tâm trạng: ${moodObj.label} (Chuẩn LIWC)`,
      message: aiAdvice
        ? `Lời khuyên cho bạn: "${aiAdvice}"`
        : 'Nhật ký của bạn đã được mã hóa an toàn và lưu vào hệ thống.'
    });

    setContent('');
    setTags('');
    setSaving(false);
  };

  const streakDays = computeStreakDays(entries);
  const displayedEntries = showAllHistory ? entries : entries.slice(0, 5);
  const latestReminder = entries[0]?.aiAdvice || 'Bạn không cần phải giải quyết mọi thứ trong một ngày. Hãy cho bản thân thời gian nghỉ ngơi và hồi phục.';

  return (
    <div className="journal-app">
      {/* MAIN */}
      <div className="main-content">
        <div className="page-container">

          {/* PAGE INTRO */}
          <section className="page-intro">
            <div className="intro-text">
              <span className="section-label">YOUR PERSONAL SPACE</span>
              <h1>Nhật Ký Cảm Xúc</h1>
              <p>
                Mỗi cảm xúc đều xứng đáng được lắng nghe.
                Hãy dành một chút thời gian để hiểu bản thân
                hơn qua từng dòng nhật ký.
              </p>
            </div>

            <div className="intro-art">
              <img
                src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=900&q=85"
                alt="Ánh nắng bình minh và thiên nhiên"
              />
            </div>
          </section>

          {/* In-Page Notification */}
          {notification && (
            <div style={{ marginBottom: 20 }}>
              <InPageNotification
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification(null)}
              />
            </div>
          )}

          {/* WRITING AREA + QUOTE */}
          <section className="writing-layout">

            {/* JOURNAL FORM */}
            <div className="journal-card">
              <div className="card-heading">
                <div>
                  <span className="section-label">MY DAILY JOURNAL</span>
                  <h2>Ghi chép hôm nay</h2>
                  <p>Hãy viết ra những điều đang ở trong tâm trí bạn.</p>
                </div>
                <span className="private-label">Riêng tư</span>
              </div>

              <form id="journalForm" onSubmit={handleSave}>
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="journalContent">
                      Nội dung tâm sự / Ghi chú
                    </label>
                    <span className="language-label">
                      Song ngữ Anh - Việt (Bilingual EN / VI)
                    </span>
                  </div>

                  <textarea
                    id="journalContent"
                    maxLength={1000}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Hôm nay bạn đã trải qua những gì? Hãy viết tự do bằng Tiếng Việt hoặc English (e.g. 'I feel completely overwhelmed with my thesis exams...')..."
                  />

                  <div className="textarea-footer">
                    <span>Không gian riêng tư của bạn</span>
                    <span>{content.length} / 1000</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="journalTags">
                    Chủ đề liên quan
                  </label>
                  <input
                    type="text"
                    id="journalTags"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="học tập, đồ án, deadline, feeling stressed, hopeful..."
                  />
                  <small className="input-hint">
                    Phân cách các chủ đề bằng dấu phẩy.
                  </small>
                </div>

                <div className="analysis-note">
                  {aiLoading ? (
                    <>
                      <div className="ai-spinner" />
                      <p style={{ color: '#0d9488', fontWeight: 600 }}>
                        Hệ thống đang phân tích tâm lý ngôn ngữ LIWC và chuẩn bị lời khuyên cho bạn...
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="note-dot" />
                      <p>
                        Sau khi lưu, hệ thống sẽ phân tích cảm xúc theo <strong>Khung Tâm lý học Ngôn ngữ LIWC</strong> (Linguistic Inquiry and Word Count) và đưa ra lời khuyên phù hợp.
                      </p>
                    </>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={saving || aiLoading}
                  >
                    <span>{saving ? 'Đang phân tích & lưu...' : 'Lưu nhật ký'}</span>
                    <span>→</span>
                  </button>
                  <span className="privacy-text">
                    Nội dung của bạn được bảo mật.
                  </span>
                </div>
              </form>
            </div>

            {/* QUOTE CARD */}
            <aside className="quote-card">
              <div className="quote-mark">“</div>
              <h3>
                Bạn không cần phải
                luôn mạnh mẽ.
              </h3>
              <p>
                Chỉ cần thành thật với
                cảm xúc của mình.
              </p>
              <div className="quote-bottom">
                Một ngày tại một thời điểm.
              </div>
              <img
                src="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=500&q=85"
                alt="Cây xanh thư giãn"
              />
            </aside>

          </section>

          {/* MOOD CHART + STATISTICS */}
          <section className="analytics-layout">
            <MoodChart entries={entries} />

            <aside className="statistics-card">
              <span className="section-label">YOUR PROGRESS</span>
              <h2>Thống kê nhanh</h2>

              <div className="stat-box stat-mint">
                <span className="stat-number">{String(streakDays).padStart(2, '0')}</span>
                <span className="stat-unit">ngày</span>
                <p>Chuỗi nhật ký liên tiếp</p>
              </div>

              <div className="stat-box stat-purple">
                <span className="stat-number">{String(entries.length).padStart(2, '0')}</span>
                <span className="stat-unit">bài viết</span>
                <p>Nhật ký đã lưu</p>
              </div>

              <div className="stat-footer">
                Mỗi ngày hiểu bản thân thêm một chút.
              </div>
            </aside>
          </section>

          {/* WELLNESS TIP */}
          <section className="wellness-card">
            <div className="wellness-image">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=85"
                alt="Người đang thiền giữa thiên nhiên"
              />
            </div>

            <div className="wellness-content">
              <span className="section-label">A LITTLE REMINDER</span>
              <h3>Một lời nhắn dành cho bạn</h3>
              <p>{latestReminder}</p>
            </div>

            <Link to="/student/saferoom" className="wellness-link">
              Khám phá thêm →
            </Link>
          </section>

          {/* JOURNAL HISTORY */}
          <section className="history-section">
            <div className="history-heading">
              <div>
                <span className="section-label">YOUR MEMORIES</span>
                <h2>Những dòng nhật ký gần đây ({entries.length} bài)</h2>
              </div>

              {entries.length > 5 && (
                <button
                  type="button"
                  className="view-all"
                  onClick={() => setShowAllHistory(v => !v)}
                >
                  {showAllHistory ? 'Thu gọn ↑' : 'Xem tất cả →'}
                </button>
              )}
            </div>

            {displayedEntries.map(e => (
              <JournalEntry key={e.id} entry={e} />
            ))}
          </section>

          <footer className="page-footer">
            UniMind · Một nơi để bạn được là chính mình.
          </footer>

        </div>
      </div>

    </div>
  );
}
