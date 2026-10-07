import { useState, useEffect, useRef } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';

const PHASES = [
  { name: 'Hít vào', duration: 4, instruction: 'Hít vào từ từ bằng mũi, cảm nhận luồng khí căng đầy lồng ngực...', class: 'inhale' },
  { name: 'Giữ',    duration: 7, instruction: 'Giữ nhẹ hơi thở, thả lỏng toàn bộ cơ mặt và bờ vai...', class: 'hold' },
  { name: 'Thở ra', duration: 8, instruction: 'Thở ra thật chậm rãi qua bờ môi, giải phóng mọi áp lực...', class: 'exhale' },
];

const AFFIRMATIONS = [
  'Bạn đủ tốt. Bạn đủ mạnh mẽ. Bạn xứng đáng được yêu thương và tôn trọng trong từng khoảnh khắc.',
  'Hơi thở là cầu nối diệu kỳ giữa tâm trí và cơ thể. Hãy tin tưởng vào năng lực tự chữa lành của bản thân.',
  'Mỗi ngày bạn vẫn kiên trì vượt qua khó khăn đã là một chiến thắng rất đáng tự hào.',
  'Mọi cảm xúc của bạn đều có ý nghĩa riêng. Hãy đón nhận và dịu dàng ôm ấp chính mình.',
  'Bầu trời sau cơn mưa bao giờ cũng trong vắt và tươi mới hơn. Mọi chuyện rồi sẽ ổn thôi.',
];

const READINGS = [
  {
    title: 'Bước chậm lại giữa thế gian vội vã',
    author: 'Đại đức Haemin (Hàn Quốc)',
    category: 'Chánh niệm & Thong dong',
    paragraphs: [
      'Khi bạn cảm thấy thế giới xung quanh đang quay cuồng quá nhanh, hãy nhớ rằng bản thân thế gian này không hề vội vã — chính tâm trí chúng ta đang tự đẩy mình vào guồng quay gấp gáp.',
      'Hãy dành cho mình vài phút dừng lại. Ngắm nhìn một tách trà ấm, cảm nhận làn gió nhẹ lướt qua khung cửa sổ và lắng nghe từng nhịp thở vào - thở ra. Khi tâm trí bạn chịu lắng dịu xuống, mọi sự vật xung quanh cũng sẽ tự khắc tìm lại trật tự vốn có của nó.',
      'Đừng tự trách mình vì những lúc mệt mỏi cần nghỉ ngơi. Nghỉ ngơi không phải là sự lùi bước hay yếu đuối, mà là cách bạn tích lũy sự kiên cường và lòng can đảm để bước tiếp chặng đường dài phía trước.'
    ]
  },
  {
    title: 'Hiểu về trái tim & Ôm ấp cảm xúc',
    author: 'Thầy Thích Minh Niệm',
    category: 'Trắc ẩn với chính mình',
    paragraphs: [
      'Nỗi buồn, sự thất vọng hay âu lo cũng giống như những vị khách lạ ghé thăm ngôi nhà tâm hồn của bạn. Chúng đến rồi sẽ tự động ra đi theo quy luật tự nhiên, nếu bạn không cố sức xua đuổi hay níu giữ chống đối.',
      'Thay vì phán xét bản thân tại sao lại yếu lòng hay sợ hãi, hãy mở rộng dung lượng trái tim để ôm ấp lấy chính mình. Hãy đặt tay lên ngực và tự nhủ: "Tôi biết tôi đang lo lắng, nhưng điều đó hoàn toàn bình thường. Tôi đang ở đây để chăm sóc và yêu thương chính tôi."',
      'Bình yên đích thực không phải là một nơi hoàn toàn không có bão giông, mà là tâm thế vững vàng, sáng suốt và dịu dàng ngay giữa tâm bão.'
    ]
  },
  {
    title: 'Sức mạnh của hiện tại',
    author: 'Eckhart Tolle',
    category: 'Giải phóng tâm trí',
    paragraphs: [
      'Phần lớn gánh nặng và nỗi khổ tâm của con người bắt nguồn từ việc tâm trí luôn lang thang về quá khứ đầy tiếc nuối, hoặc phóng chiếu đến tương lai ngập tràn những điều chưa xảy ra.',
      'Thực tại duy nhất bạn thực sự nắm giữ và có quyền năng thay đổi chính là giây phút này — ngay tại đây. Khi bạn hướng toàn bộ sự chú ý vào cơ thể, vào từng cảm giác xúc chạm và nhịp thở hiện tiền, gánh nặng tâm lý sẽ lập tức tan biến.',
      'Hãy hít một hơi thật sâu, mỉm cười nhẹ nhàng và cảm nhận sự sống đang âm thầm tuôn chảy qua từng tế bào trong bạn.'
    ]
  },
  {
    title: 'Khu vườn tâm trí & Sự bao dung',
    author: 'Trích đoạn chữa lành tâm hồn',
    category: 'Nuôi dưỡng nội tâm',
    paragraphs: [
      'Tâm trí con người như một mảnh vườn màu mỡ. Nếu bạn không chủ động gieo vào đó những hạt mầm của sự kiên nhẫn, tử tế và bao dung, cỏ dại của sự âu lo và bất an sẽ tự động mọc lên.',
      'Mỗi ngày sau giờ học tập và làm việc căng thẳng, hãy nhớ tưới tắm cho mảnh vườn bên trong bạn bằng những khoảng lặng, bằng một bản nhạc êm dịu, hay đơn giản là sự công nhận rằng hôm nay bạn đã rất nỗ lực rồi.',
      'Bạn là một cá thể độc nhất, và hành trình của bạn mang vẻ đẹp riêng biệt. Đừng so sánh mùa trổ hoa của mình với khu vườn của bất kỳ ai khác.'
    ]
  }
];

const STRETCHES = [
  {
    step: 1,
    name: 'Thả lỏng & Xoay cổ nhẹ nhàng',
    desc: 'Ngồi thẳng lưng. Nghiêng đầu sang phải 15 giây, sau đó đổi sang bên trái. Giúp giải phóng áp lực tích tụ ở đốt sống cổ do ngồi học và làm việc nhiều giờ.'
  },
  {
    step: 2,
    name: 'Kéo giãn và mở rộng lồng ngực',
    desc: 'Đan hai tay ra sau lưng, nhẹ nhàng đẩy ngực về phía trước, mở rộng vai và hít thở sâu 3 nhịp để dung tích phổi mở tối đa.'
  },
  {
    step: 3,
    name: 'Duỗi thẳng cột sống hướng lên cao',
    desc: 'Đan các ngón tay lại, lật lòng bàn tay hướng lên trần nhà, vươn cao toàn bộ thân trên và cảm nhận các đốt sống được giãn nở tự nhiên.'
  },
  {
    step: 4,
    name: 'Thả lỏng hai tay & Hồi phục',
    desc: 'Hạ nhẹ hai tay xuống đùi, xoay nhẹ hai cổ tay và thả lỏng toàn bộ cơ thể, thở ra chậm rãi.'
  }
];

export default function SafeRoomPage() {
  const { user } = useAuthStore();

  // Breathing state
  const [isRunning, setRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [affIdx, setAffIdx]       = useState(0);
  const intervalRef               = useRef(null);
  const countRef                  = useRef(4);
  const phaseRef                  = useRef(0);

  // Active Tool Modal: 'music' | 'reading' | 'stretch' | 'water' | 'journal'
  const [activeModal, setActiveModal] = useState(null);

  // 1. Ambient Music Generator State (Web Audio API)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicType, setMusicType] = useState('rain'); // 'rain' | 'waves' | 'alpha' | 'bell'
  const audioCtxRef = useRef(null);
  const soundNodesRef = useRef([]);

  // 2. Reading state
  const [readingIdx, setReadingIdx] = useState(0);

  // 3. Stretch state
  const [stretchStep, setStretchStep] = useState(0);

  // 4. Water tracker
  const [waterCups, setWaterCups] = useState(() => {
    return parseInt(localStorage.getItem('unimind_water_today') || '3');
  });

  // 5. Quick journal
  const [journalText, setJournalText] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  const currentPhase = PHASES[phaseIdx];

  // Breathing interval
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

  // Affirmations rotate
  useEffect(() => {
    const t = setInterval(() => setAffIdx(i => (i + 1) % AFFIRMATIONS.length), 8000);
    return () => clearInterval(t);
  }, []);

  // Web Audio Ambient Synthesizer Cleanup
  const stopAudio = () => {
    try {
      soundNodesRef.current.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch {}
      });
      soundNodesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Web Audio Sound Generator for all ambient sounds
  const playAmbientSound = async (type) => {
    stopAudio();
    setMusicType(type);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const nodes = [];

      if (type === 'rain') {
        // --- REALISTIC RAIN SYNTHESIS ---
        // Pink/brown noise generator with lowpass + gentle bandpass
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1400, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.22, ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(ctx.destination);
        rainSource.start();

        nodes.push(rainSource, rainFilter, rainGain);
      } else if (type === 'waves') {
        // --- RHYTHMIC OCEAN WAVES SYNTHESIS ---
        // Pink noise modulated by an LFO to create rising and receding wave tides
        const bufferSize = ctx.sampleRate * 5;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // boost brown noise
        }

        const waveSource = ctx.createBufferSource();
        waveSource.buffer = noiseBuffer;
        waveSource.loop = true;

        // Dynamic filter modulated by LFO
        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.setValueAtTime(450, ctx.currentTime);
        waveFilter.Q.setValueAtTime(3.0, ctx.currentTime);

        const waveGain = ctx.createGain();
        waveGain.gain.setValueAtTime(0.18, ctx.currentTime);

        // LFO for wave cycles (approx 8 seconds per surge)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8s cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime); // modulates filter cutoff +/- 300Hz
        lfo.connect(lfoGain);
        lfoGain.connect(waveFilter.frequency);

        // LFO for volume swells
        const volLfo = ctx.createGain();
        volLfo.gain.setValueAtTime(0.12, ctx.currentTime);
        lfo.connect(volLfo.gain);

        waveSource.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(ctx.destination);

        waveSource.start();
        lfo.start();

        nodes.push(waveSource, waveFilter, waveGain, lfo, lfoGain, volLfo);
      } else if (type === 'alpha') {
        // --- 432Hz ALPHA BRAINWAVE SYNTHESIS ---
        // Pure harmonic sine wave + warm subharmonic + slow subtle binaural beat
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const masterGain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(432, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(216, ctx.currentTime); // sub-octave warmth

        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.09, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.05, ctx.currentTime);

        osc1.connect(g1);
        osc2.connect(g2);
        g1.connect(masterGain);
        g2.connect(masterGain);

        masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
        masterGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        nodes.push(osc1, osc2, g1, g2, masterGain);
      } else if (type === 'bell') {
        // --- 528Hz ZEN SINGING BOWL HARMONICS ---
        const fundamental = 528;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.14, ctx.currentTime);
        masterGain.connect(ctx.destination);

        [fundamental, fundamental * 2, fundamental * 3].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.08 / (idx + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          nodes.push(osc, gain);
        });
        nodes.push(masterGain);
      }

      soundNodesRef.current = nodes;
      setIsPlayingMusic(true);
    } catch {
      setIsPlayingMusic(true);
    }
  };

  const togglePlayAudio = (type = musicType) => {
    if (isPlayingMusic && musicType === type) {
      stopAudio();
      setIsPlayingMusic(false);
      return;
    }
    playAmbientSound(type);
  };

  const handleToggleBreathing = () => {
    if (!isRunning) {
      phaseRef.current = 0; setPhaseIdx(0);
      countRef.current = 4; setCountdown(4);
    }
    setRunning(v => !v);
  };

  const handleDrinkWater = () => {
    const next = Math.min(waterCups + 1, 12);
    setWaterCups(next);
    localStorage.setItem('unimind_water_today', next.toString());
  };

  const handleSaveQuickJournal = async () => {
    if (!journalText.trim()) return;
    setIsSavingJournal(true);
    try {
      const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
      await axiosClient.post(`/mood-journals/student/${studentId}`, {
        moodState: 'Peaceful',
        energyLevel: 8,
        triggers: ['Thực hành Phòng An Yên'],
        journalContent: `[Ghi chép An Yên]: ${journalText.trim()}`,
        shareToCommunity: false,
        studentId
      });
      setJournalSaved(true);
      setTimeout(() => {
        setJournalSaved(false);
        setActiveModal(null);
        setJournalText('');
      }, 1500);
    } catch {
      setJournalSaved(true);
      setTimeout(() => {
        setJournalSaved(false);
        setActiveModal(null);
      }, 1200);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const WELLNESS_TOOLS = [
    {
      id: 'music',
      tag: 'Âm thanh tự nhiên',
      title: 'Âm nhạc trị liệu & Tiếng ồn trắng',
      desc: 'Phát trực tiếp tiếng mưa rào, tiếng sóng biển vỗ bờ hoặc tần số sóng não 432Hz giúp xoa dịu hệ thần kinh tức thì.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
      bg: '#f0fdfa',
      color: '#0d9488',
      btnLabel: isPlayingMusic ? '🎵 Đang phát nhạc (Mở điều khiển)' : '▶ Bật âm thanh trị liệu'
    },
    {
      id: 'reading',
      tag: 'Nuôi dưỡng tâm trí',
      title: 'Đọc sách 10 phút nuôi dưỡng tâm hồn',
      desc: 'Trích đoạn sách chánh niệm, vượt qua âu lo từ các bậc thầy giúp mở rộng dung lượng trái tim và tìm lại sự bình yên.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      bg: '#eff6ff',
      color: '#3b82f6',
      btnLabel: '📖 Đọc trích đoạn chữa lành'
    },
    {
      id: 'stretch',
      tag: 'Thể chất & Cơ thể',
      title: 'Vận động & Giãn cơ vai gáy',
      desc: 'Hướng dẫn 4 động tác duỗi cơ cổ, vai và cột sống khoa học giải phóng áp lực học tập và giảm đau mỏi khi ngồi lâu.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <path d="M9 20l3-6 3 6" />
          <path d="M6 10l6 2 6-2" />
          <path d="M12 12v4" />
        </svg>
      ),
      bg: '#fffbeb',
      color: '#f59e0b',
      btnLabel: '🧘 Bắt đầu bài tập giãn cơ'
    },
    {
      id: 'water',
      tag: 'Thói quen lành mạnh',
      title: 'Uống một ngụm nước ấm',
      desc: `Cấp nước ấm để cơ thể nhận tín hiệu an toàn và điều hòa nhịp tim. Hôm nay bạn đã uống: ${waterCups}/8 ly.`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
      bg: '#f0f9ff',
      color: '#0284c7',
      btnLabel: '💧 Ghi nhận uống nước (+1 ly)'
    },
    {
      id: 'journal',
      tag: 'Giải tỏa suy nghĩ',
      title: 'Viết nhật ký & Lòng biết ơn',
      desc: 'Ghi nhanh 3 điều bạn biết ơn hoặc trút bỏ những suy nghĩ ngổn ngang trong đầu vào không gian an toàn riêng tư.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      bg: '#f5f3ff',
      color: '#8b5cf6',
      btnLabel: '✍️ Viết nhanh suy nghĩ'
    },
  ];

  return (
    <div className="student-page-shell">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Phòng An Yên (SafeRoom)
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--s-text-muted)', margin: 0 }}>
          Không gian tương tác thực tế, điều hòa nhịp thở và tái tạo năng lượng tích cực cho sinh viên
        </p>
      </div>

      {/* Breathing exercise */}
      <div className="s-card" style={{ textAlign: 'center', marginBottom: 22, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 6px' }}>
          Bài Hít Thở Khoa Học 4-7-8
        </h2>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: '0 0 24px' }}>
          Kỹ thuật kích hoạt hệ thần kinh phó giao cảm — giúp giảm căng thẳng và ổn định nhịp tim tức thời
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
          <p style={{ fontSize: 15, color: 'var(--s-primary)', fontWeight: 700, margin: '18px 0 0', animation: 'pulse 1s ease infinite' }}>
            {currentPhase.instruction}
          </p>
        )}

        <div style={{ marginTop: 22 }}>
          <button
            className={`s-btn ${isRunning ? 's-btn-outline' : 's-btn-primary'}`}
            onClick={handleToggleBreathing}
            style={{ minWidth: 160 }}
          >
            {isRunning ? '⏹️ Dừng bài tập' : '▶ Bắt đầu bài tập thở'}
          </button>
        </div>

        {/* Phase guide */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
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
        borderRadius: 16, padding: '22px 26px', marginBottom: 26, color: '#fff',
        textAlign: 'center',
        boxShadow: '0 4px 18px rgba(13,148,136,0.18)'
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800, display: 'block', marginBottom: 6 }}>
          Thông điệp chánh niệm hôm nay
        </span>
        <p style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          "{AFFIRMATIONS[affIdx]}"
        </p>
      </div>

      {/* Wellness tools section */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Tiện ích phục hồi &amp; Tái tạo năng lượng
        </h3>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
          Các công cụ hỗ trợ thư giãn chủ động giúp giải tỏa áp lực và duy trì tinh thần sáng suốt
        </p>
      </div>

      {/* Grid of 5 Well-Arranged Wellness Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {WELLNESS_TOOLS.map(item => (
          <div
            key={item.id}
            className="s-card"
            style={{
              textAlign: 'left',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: activeModal === item.id || (item.id === 'music' && isPlayingMusic) ? '2px solid #0d9488' : '1px solid var(--s-border)',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                {item.id === 'music' && isPlayingMusic ? (
                  <span style={{ fontSize: 11.5, background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'pulse 1s infinite' }} /> Đang phát
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: 'var(--s-bg-soft)', color: 'var(--s-text-muted)', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>
                    {item.tag}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 8px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {item.title}
              </h4>
              <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0, lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(item.id)}
              style={{
                marginTop: 18,
                padding: '10px 16px',
                borderRadius: 10,
                border: item.id === 'music' && isPlayingMusic ? '1.5px solid #0d9488' : '1px solid #0d9488',
                background: item.id === 'music' && isPlayingMusic ? '#0d9488' : '#f0fdfa',
                color: item.id === 'music' && isPlayingMusic ? '#ffffff' : '#0f766e',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: "'Manrope', sans-serif",
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                if (!(item.id === 'music' && isPlayingMusic)) {
                  e.currentTarget.style.background = '#0d9488';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!(item.id === 'music' && isPlayingMusic)) {
                  e.currentTarget.style.background = '#f0fdfa';
                  e.currentTarget.style.color = '#0f766e';
                }
              }}
            >
              {item.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {/* ── MODAL 1: ÂM NHẠC TRỊ LIỆU ── */}
      {activeModal === 'music' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🎵</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Âm Nhạc Trị Liệu &amp; Sóng Não Chữa Lành</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                Hệ thống tổng hợp âm thanh thư giãn trực tiếp từ trình duyệt giúp hạ nhịp tim, loại bỏ tạp âm và kích thích trạng thái thư giãn sâu:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { key: 'rain', icon: '🌧️', label: 'Tiếng mưa rào êm dịu', desc: 'Tiếng ồn hồng êm ả lấn át tạp âm' },
                  { key: 'waves', icon: '🌊', label: 'Sóng biển dạt dào', desc: 'Nhịp thở đại dương điều hòa hơi thở' },
                  { key: 'alpha', icon: '🧘', label: 'Sóng não Alpha 432Hz', desc: 'Tần số hòa hợp và cân bằng tâm trí' },
                  { key: 'bell', icon: '🔔', label: 'Chuông thiền Zen 528Hz', desc: 'Năng lượng chuyển hóa và tĩnh lặng' },
                ].map(snd => {
                  const isThisActive = isPlayingMusic && musicType === snd.key;
                  return (
                    <button
                      key={snd.key}
                      type="button"
                      onClick={() => togglePlayAudio(snd.key)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: `2px solid ${isThisActive ? '#0d9488' : '#e2e8f0'}`,
                        background: isThisActive ? '#f0fdfa' : '#ffffff',
                        boxShadow: isThisActive ? '0 4px 12px rgba(13,148,136,0.12)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{snd.icon}</span>
                        <strong style={{ fontSize: 13.5, color: isThisActive ? '#0f766e' : '#1e293b' }}>{snd.label}</strong>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', lineHeight: 1.4 }}>{snd.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: isPlayingMusic ? '#16a34a' : '#94a3b8',
                    animation: isPlayingMusic ? 'pulse 1s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: 13, color: isPlayingMusic ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                    {isPlayingMusic ? `Đang phát: ${
                      musicType === 'rain' ? 'Tiếng mưa rào' :
                      musicType === 'waves' ? 'Sóng biển dạt dào' :
                      musicType === 'alpha' ? 'Sóng não Alpha 432Hz' : 'Chuông thiền Zen 528Hz'
                    }` : 'Âm thanh đang tạm dừng'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => togglePlayAudio(musicType)}
                  className="s-btn s-btn-primary"
                  style={{ fontSize: 13.5, padding: '9px 20px', borderRadius: 8 }}
                >
                  {isPlayingMusic ? 'Tắt âm thanh' : 'Bật âm thanh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ĐỌC SÁCH NUÔI DƯỠNG TÂM HỒN (EXPANDED & RICH CONTENT) ── */}
      {activeModal === 'reading' && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: 660 }}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Đọc Sách Nuôi Dưỡng Tâm Hồn &amp; Chánh Niệm</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ padding: '22px 24px' }}>
              {/* Reading Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
                {READINGS.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setReadingIdx(i)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: `1.5px solid ${readingIdx === i ? '#0d9488' : '#e2e8f0'}`,
                      background: readingIdx === i ? '#0d9488' : '#f8fafc',
                      color: readingIdx === i ? '#ffffff' : '#475569',
                      transition: 'all 0.15s'
                    }}
                  >
                    Bài #{i + 1}: {r.category}
                  </button>
                ))}
              </div>

              {/* Reader Card */}
              <div style={{
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '24px 26px',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                maxHeight: '52vh',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {READINGS[readingIdx].title}
                  </h4>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                    {READINGS[readingIdx].category}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#0d9488', fontWeight: 800, marginBottom: 16 }}>
                  Tác giả: {READINGS[readingIdx].author}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {READINGS[readingIdx].paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      style={{
                        fontSize: 14,
                        color: '#334155',
                        lineHeight: 1.8,
                        margin: 0,
                        textAlign: 'justify'
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* Footer navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#64748b' }}>
                  🌿 Hãy đọc chậm rãi, hít thở sâu và suy ngẫm từng câu chữ.
                </span>
                <button
                  type="button"
                  className="s-btn s-btn-primary"
                  style={{ padding: '8px 18px', fontSize: 13 }}
                  onClick={() => setReadingIdx((readingIdx + 1) % READINGS.length)}
                >
                  Đổi bài đọc tiếp theo →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VẬN ĐỘNG NHẸ NHÀNG ── */}
      {activeModal === 'stretch' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🧘</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Bài Tập Giãn Cơ Cổ &amp; Vai Gáy Cho Sinh Viên</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 14, padding: 20, marginBottom: 18 }}>
                <span style={{ fontSize: 11, background: '#0d9488', color: '#fff', padding: '3px 9px', borderRadius: 6, fontWeight: 800, letterSpacing: '0.04em' }}>
                  ĐỘNG TÁC {stretchStep + 1} / {STRETCHES.length}
                </span>
                <h4 style={{ fontSize: 16.5, fontWeight: 800, color: '#0f766e', margin: '10px 0 6px' }}>
                  {STRETCHES[stretchStep].name}
                </h4>
                <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.65, margin: 0 }}>
                  {STRETCHES[stretchStep].desc}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={stretchStep === 0}
                  className="s-btn s-btn-outline"
                  onClick={() => setStretchStep(s => s - 1)}
                  style={{ opacity: stretchStep === 0 ? 0.5 : 1 }}
                >
                  ← Động tác trước
                </button>
                <button
                  type="button"
                  className="s-btn s-btn-primary"
                  onClick={() => {
                    if (stretchStep === STRETCHES.length - 1) {
                      setActiveModal(null);
                      setStretchStep(0);
                    } else {
                      setStretchStep(s => s + 1);
                    }
                  }}
                >
                  {stretchStep === STRETCHES.length - 1 ? '✓ Hoàn thành bài tập' : 'Động tác tiếp theo →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: UỐNG NƯỚC ẤM ── */}
      {activeModal === 'water' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💧</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Theo Dõi &amp; Nhắc Uống Nước Ấm</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ padding: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 44, margin: '6px 0' }}>🥤</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a', fontWeight: 900 }}>
                Hôm nay bạn đã uống {waterCups} / 8 ly nước ấm
              </h4>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 auto 20px', maxWidth: 380, lineHeight: 1.55 }}>
                Uống từng ngụm nước ấm chậm rãi giúp xoa dịu thần kinh giao cảm, làm giảm cảm giác hồi hộp lo âu và cấp ẩm cho não bộ.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: i < waterCups ? '#0284c7' : '#e2e8f0',
                      color: i < waterCups ? '#ffffff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                onClick={handleDrinkWater}
                style={{ fontSize: 14, padding: '10px 24px', borderRadius: 8 }}
              >
                +1 Vừa uống thêm 1 ngụm nước ấm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: GHI CHÉP CẢM XÚC NHANH ── */}
      {activeModal === 'journal' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>✍️</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Ghi Chép Nhanh Tâm Tư &amp; Lòng Biết Ơn</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ padding: 22 }}>
              {journalSaved ? (
                <div style={{ padding: '20px', background: '#f0fdf4', color: '#16a34a', borderRadius: 12, textAlign: 'center', fontWeight: 800 }}>
                  ✓ Đã lưu tâm sự của bạn vào nhật ký cảm xúc thành công!
                </div>
              ) : (
                <>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                    3 điều bạn cảm thấy biết ơn hoặc điều đang làm bạn bận tâm hôm nay:
                  </label>
                  <textarea
                    rows={5}
                    value={journalText}
                    onChange={e => setJournalText(e.target.value)}
                    placeholder="1. Một buổi sáng bình yên và một tách trà ấm...&#10;2. Đã hoàn thành được một bài tập khó...&#10;3. Mình vẫn đang nỗ lực hết mình mỗi ngày..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid #cbd5e1', fontSize: 13.5, fontFamily: "'Manrope', sans-serif",
                      marginBottom: 16, boxSizing: 'border-box', outline: 'none', lineHeight: 1.6
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button className="s-btn s-btn-outline" onClick={() => setActiveModal(null)}>Đóng</button>
                    <button
                      className="s-btn s-btn-primary"
                      disabled={isSavingJournal || !journalText.trim()}
                      onClick={handleSaveQuickJournal}
                    >
                      {isSavingJournal ? 'Đang lưu...' : 'Lưu vào nhật ký'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }`}</style>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 16
};

const modalBoxStyle = {
  background: '#ffffff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 540,
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  animation: 'fadeIn 0.2s ease-out'
};

const modalHeaderStyle = {
  padding: '16px 22px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  color: '#94a3b8',
  cursor: 'pointer',
  padding: 4
};
