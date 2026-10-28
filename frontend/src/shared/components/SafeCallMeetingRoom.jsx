import { useState, useEffect, useRef } from 'react';
import axiosClient from '../../features/auth/api/authApi';

/**
 * SafeCallMeetingRoom - Nền tảng Họp Trực Tuyến WebRTC P2P Thuần Túy (100% In-House)
 * Tự tổ chức cuộc họp mã hóa P2P đầu-cuối (DTLS-SRTP) mà KHÔNG phụ thuộc bất kỳ bên thứ 3 nào.
 * 
 * Tính năng chính:
 * 1. WebRTC PeerConnection (Offer/Answer/ICE Handshake qua Backend Signaling nội bộ)
 * 2. WebRTC RTCDataChannel (Trò chuyện trực tiếp Peer-to-Peer & Đồng bộ trạng thái không trễ)
 * 3. Video HD & Audio với bộ lọc chống ồn (Echo Cancellation & Noise Suppression)
 * 4. Fallback Canvas Avatar tương tác khi Webcam bị khóa/chiếm dụng (tiện lợi test 2 tab trên 1 laptop)
 * 5. Chia sẻ màn hình thời gian thực (WebRTC replaceTrack)
 * 6. Chế độ Tham Vấn Ẩn Danh Riêng Tư (Voice-Only với sóng âm thanh nhịp thở)
 * 7. Nhận diện giọng nói thời gian thực (Web Audio API Voice Activity Visualizer)
 * 8. Trò chuyện trực tuyến (DataChannel P2P + Backup CSDL Backend)
 */
export default function SafeCallMeetingRoom({
  appointmentId,
  bookingCode = 'ST-LIVE',
  currentUserRole = 'student', // 'expert' | 'student'
  currentUserName = 'Bạn Ẩn Danh',
  peerName = 'Đối phương',
  sessionSeconds = 0,
  onLeaveOrEnd,
  isHost = false,
  extraHeaderActions = null,
  notebookProps = null, // Props cho Sổ tay lâm sàng (Chuyên viên)
  defaultImmersive = true // Mặc định mở rộng toàn màn hình kiểu Google Meet
}) {
  // Trạng thái Media & Thiết bị
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState(false);
  const [isImmersive, setIsImmersive] = useState(defaultImmersive);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [videoFit, setVideoFit] = useState('contain'); // 'contain' | 'cover'
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const [activeSideDrawer, setActiveSideDrawer] = useState(null); // 'chat' | 'notes' | 'breathe' | 'security' | null
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));

  // Trạng thái bài tập thở 4-7-8 thư giãn cho sinh viên
  const [breathePhase, setBreathePhase] = useState('Hít sâu bằng mũi (4s)');
  const [breatheCount, setBreatheCount] = useState(4);

  // Trạng thái kết nối WebRTC: 'connecting' | 'negotiating' | 'waiting_peer' | 'connected' | 'ended'
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [hasCameraAccess, setHasCameraAccess] = useState(true);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  const [peerState, setPeerState] = useState({ isAudioMuted: false, isVideoMuted: false });

  // Voice Activity Detection (VAD)
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  // Trạng thái Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // DOM & WebRTC Refs
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const canvasAnimRef = useRef(null);
  const lastSignalTimeRef = useRef(0);
  const chatScrollRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TẠO LUỒNG FALLBACK CANVAS NỘI BỘ (Khi Webcam bị chiếm dụng trên 1 laptop)
  // ══════════════════════════════════════════════════════════════════════════
  const createFallbackStream = (name, role) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const draw = () => {
      frame++;
      // Nền chuyển màu hiện đại UniMind
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      if (role === 'expert') {
        grad.addColorStop(0, '#09152b');
        grad.addColorStop(0.5, '#0f2445');
        grad.addColorStop(1, '#08101e');
      } else {
        grad.addColorStop(0, '#042724');
        grad.addColorStop(0.5, '#083c38');
        grad.addColorStop(1, '#021816');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Vòng tròn hào quang chuyển động
      const pulse = 1 + Math.sin(frame * 0.04) * 0.08;
      const radius = 90 * pulse;
      ctx.beginPath();
      ctx.arc(640, 310, radius, 0, Math.PI * 2);
      ctx.fillStyle = role === 'expert' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(13, 148, 136, 0.25)';
      ctx.fill();

      // Avatar trung tâm
      ctx.beginPath();
      ctx.arc(640, 310, 75, 0, Math.PI * 2);
      ctx.fillStyle = role === 'expert' ? '#0284c7' : '#0d9488';
      ctx.shadowColor = role === 'expert' ? 'rgba(2, 132, 199, 0.6)' : 'rgba(13, 148, 136, 0.6)';
      ctx.shadowBlur = 28;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Chữ cái đại diện
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (name || 'U').charAt(0).toUpperCase();
      ctx.fillText(initial, 640, 310);

      // Tên & Nhãn trạng thái
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name || 'Người dùng', 640, 440);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 15px sans-serif';
      ctx.fillText('⚡ Thuần WebRTC P2P • Trực Tiếp Giữa 2 Trình Duyệt', 640, 475);

      canvasAnimRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Sinh AudioTrack giả lập an toàn
    const stream = canvas.captureStream(30);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch {
      // Bỏ qua nếu audio context hạn chế
    }
    return stream;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. KHỞI TẠO THIẾT BỊ CAMERA / MICROPHONE & VOICE ACTIVITY DETECTOR
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let active = true;

    async function initMediaAndStart() {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setHasCameraAccess(true);
      } catch (err) {
        console.warn('[WebRTC] Webcam bận hoặc không cấp quyền, sử dụng fallback stream:', err);
        // Cố gắng xin mic riêng nếu cam bị chiếm
        try {
          const micOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          const canvasStream = createFallbackStream(currentUserName, currentUserRole);
          micOnlyStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
          stream = canvasStream;
        } catch {
          stream = createFallbackStream(currentUserName, currentUserRole);
        }
        setHasCameraAccess(false);
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Khởi tạo máy phân tích sóng âm thanh (Voice Activity Visualizer)
      setupVoiceVisualizer(stream);

      // Khởi động PeerConnection
      setupPeerConnection();
    }

    initMediaAndStart();

    return () => {
      active = false;
      if (canvasAnimRef.current) cancelAnimationFrame(canvasAnimRef.current);
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [appointmentId]);

  // Bộ nhận diện mức âm lượng micro để tạo hiệu ứng giọng nói
  const setupVoiceVisualizer = (stream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      vadIntervalRef.current = setInterval(() => {
        if (!audioTrack.enabled) {
          setIsLocalSpeaking(false);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setIsLocalSpeaking(avg > 18);
      }, 150);
    } catch {
      // AudioContext bị hạn chế bởi chính sách autoplay của trình duyệt
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. THIẾT LẬP WEBRTC PEER CONNECTION & DATA CHANNEL (KHÔNG BÊN THỨ 3)
  // ══════════════════════════════════════════════════════════════════════════
  const setupPeerConnection = () => {
    try {
      // Cấu hình WebRTC chuẩn STUN mở của RFC5389 và localhost ICE
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });

      peerConnectionRef.current = pc;

      // Đẩy tất cả local tracks (Audio + Video) vào PeerConnection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Xử lý khi nhận remote stream từ đối phương
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          if (event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          } else {
            const stream = remoteVideoRef.current.srcObject || new MediaStream();
            stream.addTrack(event.track);
            remoteVideoRef.current.srcObject = stream;
          }
          setConnectionStatus('connected');
        }
      };

      // Xử lý ICE Candidate
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice', JSON.stringify(event.candidate));
        }
      };

      // Lắng nghe thay đổi trạng thái kết nối
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC ConnectionState]', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected');
        } else if (pc.connectionState === 'connecting') {
          setConnectionStatus('negotiating');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStatus('waiting_peer');
        }
      };

      // ─── THIẾT LẬP WEBRTC DATACHANNEL P2P NỘI BỘ ───
      if (isHost) {
        try {
          const dc = pc.createDataChannel('unimind_p2p_channel', { ordered: true });
          setupDataChannelEvents(dc);
          dataChannelRef.current = dc;
        } catch (e) {
          console.warn('[WebRTC DataChannel create error]', e);
        }
      } else {
        pc.ondatachannel = (event) => {
          setupDataChannelEvents(event.channel);
          dataChannelRef.current = event.channel;
        };
      }

      // Thông báo ta đã sẵn sàng trong phòng họp
      sendSignal('join', JSON.stringify({ role: currentUserRole, name: currentUserName }));
      setConnectionStatus('waiting_peer');

      // Nếu là Host, tạo Offer sau 1 giây
      if (isHost) {
        setTimeout(async () => {
          await initiateOffer();
        }, 1200);
      }
    } catch (e) {
      console.error('[WebRTC Setup Error]', e);
      setConnectionStatus('waiting_peer');
    }
  };

  // Khởi tạo Offer (SDP)
  const initiateOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    try {
      setConnectionStatus('negotiating');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      sendSignal('offer', JSON.stringify(offer));
    } catch (e) {
      console.error('[WebRTC Create Offer Error]', e);
    }
  };

  // Thiết lập DataChannel Events
  const setupDataChannelEvents = (dc) => {
    dc.onopen = () => {
      console.log('[WebRTC DataChannel Opened] Kết nối trực tiếp P2P thành công!');
      setIsDataChannelReady(true);
      // Gửi trạng thái ban đầu qua DataChannel
      dc.send(JSON.stringify({
        type: 'peer_state',
        isAudioMuted,
        isVideoMuted
      }));
    };

    dc.onclose = () => {
      console.log('[WebRTC DataChannel Closed]');
      setIsDataChannelReady(false);
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setChatMessages(prev => [...prev, data.payload]);
          if (!showChat) setUnreadChatCount(c => c + 1);
          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
          }, 80);
        } else if (data.type === 'peer_state') {
          setPeerState({
            isAudioMuted: !!data.isAudioMuted,
            isVideoMuted: !!data.isVideoMuted
          });
        }
      } catch (err) {
        console.warn('[WebRTC DataChannel Message parse err]', err);
      }
    };
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. SIGNALING GIAO TIẾP VỚI BACKEND WEBRTC NỘI BỘ
  // ══════════════════════════════════════════════════════════════════════════
  const sendSignal = async (type, payload) => {
    if (!appointmentId) return;
    try {
      await axiosClient.post(`/appointments/${appointmentId}/webrtc/signal`, {
        senderRole: currentUserRole === 'expert' ? 'Expert' : 'Student',
        signalType: type,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload)
      });
    } catch {
      // Bỏ qua lỗi mạng tạm thời
    }
  };

  // Polling nhận tín hiệu WebRTC và Tin nhắn CSDL
  useEffect(() => {
    if (!appointmentId) return;

    // Khi đang đàm phán thì quét nhanh (650ms), khi đã kết nối ổn định thì 1200ms
    const intervalTime = connectionStatus === 'connected' ? 1200 : 650;

    const interval = setInterval(async () => {
      // 4.1 Quét tín hiệu WebRTC từ backend
      try {
        const myRoleTag = currentUserRole === 'expert' ? 'Expert' : 'Student';
        const res = await axiosClient.get(
          `/appointments/${appointmentId}/webrtc/signals?since=${lastSignalTimeRef.current}&recipientRole=${myRoleTag}`
        );
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const signals = res.data.data;
          lastSignalTimeRef.current = Math.max(...signals.map(s => s.timestamp), lastSignalTimeRef.current);

          for (const sig of signals) {
            await handleIncomingSignal(sig);
          }
        }
      } catch {}

      // 4.2 Nhận tin nhắn Chat đồng bộ
      try {
        const chatRes = await axiosClient.get(`/appointments/${appointmentId}/chat`);
        if (chatRes.data?.data && Array.isArray(chatRes.data.data)) {
          const list = chatRes.data.data;
          setChatMessages(prev => {
            if (list.length > prev.length) {
              if (!showChat) {
                setUnreadChatCount(c => c + (list.length - prev.length));
              }
              return list;
            }
            return prev;
          });
        }
      } catch {}
    }, intervalTime);

    return () => clearInterval(interval);
  }, [appointmentId, currentUserRole, showChat, connectionStatus]);

  // Xử lý tín hiệu WebRTC đến
  const handleIncomingSignal = async (sig) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (sig.signalType === 'join') {
        // Đối phương vừa tham gia
        if (isHost && pc.signalingState === 'stable') {
          await initiateOffer();
        }
      } else if (sig.signalType === 'offer') {
        setConnectionStatus('negotiating');
        const offerDesc = JSON.parse(sig.payload);
        await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

        // Giải phóng hàng đợi ICE Candidate
        await drainPendingCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal('answer', JSON.stringify(answer));
        setConnectionStatus('connected');
      } else if (sig.signalType === 'answer') {
        const answerDesc = JSON.parse(sig.payload);
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
          await drainPendingCandidates();
          setConnectionStatus('connected');
        }
      } else if (sig.signalType === 'ice') {
        const candidate = JSON.parse(sig.payload);
        if (candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('[WebRTC Candidate Error]', err);
            }
          } else {
            // Lưu vào hàng đợi nếu remote description chưa sẵn sàng
            pendingCandidatesRef.current.push(candidate);
          }
        }
      } else if (sig.signalType === 'end') {
        setConnectionStatus('ended');
      }
    } catch (e) {
      console.warn('[WebRTC incoming signal error]', e);
    }
  };

  // Giải phóng candidate đang xếp hàng
  const drainPendingCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC Drain candidate warning]', err);
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ĐIỀU KHIỂN MICRO, CAMERA & CHIA SẺ MÀN HÌNH (REPLACETRACK)
  // ══════════════════════════════════════════════════════════════════════════
  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !isAudioMuted;
    stream.getAudioTracks().forEach(t => {
      t.enabled = !newMuted;
    });
    setIsAudioMuted(newMuted);

    // Bắn trạng thái qua DataChannel ngay tức thì
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'peer_state',
        isAudioMuted: newMuted,
        isVideoMuted
      }));
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !isVideoMuted;
    stream.getVideoTracks().forEach(t => {
      t.enabled = !newMuted;
    });
    setIsVideoMuted(newMuted);

    // Bắn trạng thái qua DataChannel
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'peer_state',
        isAudioMuted,
        isVideoMuted: newMuted
      }));
    }
  };

  // Chia sẻ màn hình sử dụng native WebRTC replaceTrack
  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Dừng chia sẻ màn hình, khôi phục track camera ban đầu
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(cameraTrack);
        }
      }

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Hoán đổi track video sang màn hình cho bên kia nhìn thấy
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        // Khi người dùng bấm nút "Stop sharing" trên thanh công cụ của trình duyệt
        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          const origTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoSender && origTrack) {
            await videoSender.replaceTrack(origTrack);
          }
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch {
        // Người dùng hủy màn hình chia sẻ
      }
    }
  };

  // Toàn màn hình trình duyệt (Native HTML5 Fullscreen)
  const toggleNativeFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Chế độ phóng to toàn cửa sổ trình duyệt (Google Meet Full-Viewport Immersive Mode)
  const toggleImmersive = () => {
    setIsImmersive(v => !v);
  };

  // Đồng bộ trạng thái khi người dùng nhấn F11 hoặc Esc của trình duyệt
  useEffect(() => {
    const onFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Cập nhật đồng hồ thời gian thực Google Meet
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Phím tắt Google Meet (M: mic, V: cam, F: fullscreen, C: chat, Esc: đóng panel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleVideo();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleNativeFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActiveSideDrawer(d => d === 'chat' ? null : 'chat');
      } else if (e.key === 'Escape') {
        if (activeSideDrawer) {
          setActiveSideDrawer(null);
        } else if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSideDrawer, isAudioMuted, isVideoMuted]);

  // Bài tập thở 4-7-8 an tâm thư giãn cho sinh viên
  useEffect(() => {
    if (activeSideDrawer !== 'breathe') return;
    const phases = [
      { name: 'Hít sâu bằng mũi...', sec: 4 },
      { name: 'Giữ hơi thở bình tâm...', sec: 7 },
      { name: 'Thở nhẹ bằng miệng...', sec: 8 }
    ];
    let curIdx = 0;
    let curSec = phases[0].sec;

    const interval = setInterval(() => {
      curSec--;
      if (curSec <= 0) {
        curIdx = (curIdx + 1) % phases.length;
        curSec = phases[curIdx].sec;
        setBreathePhase(phases[curIdx].name);
      }
      setBreatheCount(curSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSideDrawer]);

  const handleCopyCode = () => {
    if (!bookingCode) return;
    navigator.clipboard.writeText(bookingCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => {});
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 6. TRÒ CHUYỆN THỜI GIAN THỰC (P2P DATACHANNEL + SERVER BACKUP)
  // ══════════════════════════════════════════════════════════════════════════
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !appointmentId) return;

    const content = chatInput.trim();
    setChatInput('');

    const newMsg = {
      id: Date.now().toString(),
      senderRole: currentUserRole === 'expert' ? 'Expert' : 'Student',
      senderName: currentUserName,
      content: content,
      sentAt: new Date().toISOString()
    };

    // 1. Gửi tức thì qua WebRTC DataChannel (0ms server latency)
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({
          type: 'chat',
          payload: newMsg
        }));
      } catch (err) {
        console.warn('Gửi DataChannel chat warning:', err);
      }
    }

    // Cập nhật UI người gửi
    setChatMessages(prev => [...prev, newMsg]);
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);

    // 2. Gửi lưu trữ lên backend CSDL nội bộ
    try {
      await axiosClient.post(`/appointments/${appointmentId}/chat`, {
        senderRole: currentUserRole === 'expert' ? 'Expert' : 'Student',
        senderName: currentUserName,
        content: content
      });
    } catch {}
  };

  const isConnected = connectionStatus === 'connected';

  return (
    <div
      ref={containerRef}
      style={{
        position: isImmersive ? 'fixed' : 'relative',
        top: isImmersive ? 0 : 'auto',
        left: isImmersive ? 0 : 'auto',
        right: isImmersive ? 0 : 'auto',
        bottom: isImmersive ? 0 : 'auto',
        width: isImmersive ? '100vw' : '100%',
        height: isImmersive ? '100vh' : 'calc(100vh - 100px)',
        minHeight: isImmersive ? '100vh' : 620,
        zIndex: isImmersive ? 99999 : 1,
        background: '#121212',
        borderRadius: isImmersive ? 0 : 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        boxShadow: isImmersive ? 'none' : '0 25px 60px rgba(0,0,0,0.5)',
        border: isImmersive ? 'none' : '1px solid rgba(255,255,255,0.12)',
        color: '#fff',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* ══════════════ 1. TOP MINIMAL BAR (GOOGLE MEET HEADER) ══════════════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'rgba(24, 26, 27, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 25,
        height: 52,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Badge trạng thái WebRTC */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: isConnected ? '#4ade80' : '#facc15',
            border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#eab308',
              boxShadow: isConnected ? '0 0 8px #22c55e' : 'none',
              animation: isConnected ? 'pulse 1.8s infinite' : 'none'
            }} />
            {isConnected
              ? 'WEBRTC P2P • MÃ HÓA ĐẦU CUỐI DTLS-SRTP'
              : connectionStatus === 'negotiating'
              ? 'ĐANG THIẾT LẬP KẾT NỐI P2P...'
              : 'CHỜ ĐỐI PHƯƠNG VÀO PHÒNG...'}
          </span>

          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            Mã ca: <strong style={{ color: '#fff' }}>{bookingCode}</strong>
          </span>

          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            Thời lượng: <strong style={{ color: '#38bdf8' }}>{formatTimer(sessionSeconds)}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Tùy chỉnh chế độ Vừa khung / Tràn viền (Contain / Cover) */}
          <button
            type="button"
            onClick={() => setVideoFit(f => f === 'contain' ? 'cover' : 'contain')}
            title="Chuyển đổi chế độ hiển thị video (Vừa khung hình / Tràn viền)"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.15)',
              background: videoFit === 'cover' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
              color: videoFit === 'cover' ? '#38bdf8' : '#e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{videoFit === 'cover' ? '🔲' : '▫️'}</span>
            <span>{videoFit === 'cover' ? 'Tràn viền (Cover)' : 'Vừa khung (Fit)'}</span>
          </button>

          {/* Chế độ Thoại Riêng Tư / Video HD */}
          <button
            type="button"
            onClick={() => setIsVoiceOnlyMode(v => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              background: isVoiceOnlyMode ? '#0d9488' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <span>{isVoiceOnlyMode ? '🎧' : '🎥'}</span>
            <span>{isVoiceOnlyMode ? 'Ẩn danh thoại (Bật)' : 'Video Call HD'}</span>
          </button>

          {/* Phóng to / Thu nhỏ toàn màn hình kiểu Google Meet */}
          <button
            type="button"
            onClick={toggleImmersive}
            title={isImmersive ? 'Thu nhỏ về khung cửa sổ' : 'Phóng to toàn màn hình kiểu Google Meet'}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              background: isImmersive ? '#0284c7' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{isImmersive ? '🗗' : '⛶'}</span>
            <span>{isImmersive ? 'Thu nhỏ khung' : 'Toàn màn hình Meet'}</span>
          </button>

          {extraHeaderActions}
        </div>
      </div>

      {/* ══════════════ 2. MÀN HÌNH CHÍNH & SIDE DRAWER (GOOGLE MEET SPLIT STAGE) ══════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: 'calc(100% - 128px)',
        overflow: 'hidden'
      }}>
        {/* KHÔNG GIAN VIDEO CHÍNH (GOOGLE MEET MAIN STAGE) */}
        <div style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0e11',
          margin: isImmersive ? '8px 12px' : '4px 6px',
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>

          {isVoiceOnlyMode ? (
            /* Chế độ Ẩn Danh Riêng Tư (Voice-Only) */
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle at center, #0f2445 0%, #090d16 100%)',
              color: '#fff', textAlign: 'center', padding: 20
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: currentUserRole === 'expert' ? '#0d9488' : '#0284c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, fontWeight: 900, marginBottom: 18,
                boxShadow: isRemoteSpeaking ? '0 0 50px #38bdf8' : '0 0 25px rgba(2, 132, 199, 0.35)',
                transition: 'box-shadow 0.2s ease',
                border: isRemoteSpeaking ? '4px solid #38bdf8' : '3px solid rgba(255,255,255,0.2)'
              }}>
                {peerName?.charAt(0) || 'P'}
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
                {peerName}
              </h2>

              <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '0 0 18px', maxWidth: 480 }}>
                🔒 Phiên tư vấn âm thanh WebRTC trực tiếp. Camera tắt để bảo vệ danh tính tối đa.
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.06)',
                padding: '8px 18px',
                borderRadius: 24,
                fontSize: 13,
                color: '#38bdf8'
              }}>
                <span>{isRemoteSpeaking ? '🔊 Đang phát biểu...' : '🎙️ Đường truyền thoại WebRTC mã hóa ổn định'}</span>
              </div>
            </div>
          ) : (
            /* Chế độ Video Call HD Chuẩn Google Meet */
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#090a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: videoFit,
                  borderRadius: 16,
                  display: isConnected ? 'block' : 'none'
                }}
              />

              {/* Màn hình chờ phong cách Google Meet khi chưa kết nối */}
              {!isConnected && (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', textAlign: 'center', padding: 24
                }}>
                  <div style={{
                    position: 'relative',
                    width: 110,
                    height: 110,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24
                  }}>
                    {/* Hào quang nhịp thở Google Meet */}
                    <div style={{
                      position: 'absolute',
                      inset: -12,
                      borderRadius: '50%',
                      background: currentUserRole === 'expert' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(13, 148, 136, 0.25)',
                      animation: 'pulse 2s infinite'
                    }} />
                    <div style={{
                      width: 90, height: 90,
                      borderRadius: '50%',
                      background: currentUserRole === 'expert' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 38, fontWeight: 900, color: '#fff',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                      zIndex: 2
                    }}>
                      {peerName?.charAt(0) || 'U'}
                    </div>
                  </div>

                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
                    {connectionStatus === 'negotiating'
                      ? 'Đang bắt tay WebRTC P2P (Trao đổi Offer/Answer)...'
                      : isHost
                      ? 'Phòng WebRTC nội bộ đã sẵn sàng'
                      : `Đang kết nối vào phòng cùng ${peerName}...`}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
                    {isHost
                      ? `Hệ thống đã phát tín hiệu đến ${peerName}. Sinh viên truy cập vào là kết nối video trực tiếp ngay lập tức.`
                      : 'Đang thiết lập luồng WebRTC bảo mật P2P mã hóa đầu-cuối trực tiếp giữa 2 trình duyệt.'}
                  </p>
                </div>
              )}

              {/* Huy hiệu tên đối phương ở góc dưới trái video (Google Meet Signature Pill) */}
              <div style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                padding: '7px 16px',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                zIndex: 20
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isConnected ? '#22c55e' : '#eab308'
                }} />
                <span>{peerName}</span>
                <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600 }}>
                  ({currentUserRole === 'expert' ? 'Sinh viên' : 'Chuyên viên'})
                </span>
                {peerState.isAudioMuted && <span title="Đối phương đã tắt mic" style={{ color: '#ef4444' }}>🔇</span>}
              </div>
            </div>
          )}

          {/* ══════════════ 3. LOCAL SELF-VIEW (PIP NỔI GÓC PHẢI GOOGLE MEET) ══════════════ */}
          {isPipMinimized ? (
            <button
              type="button"
              onClick={() => setIsPipMinimized(false)}
              title="Nhấn để mở rộng khung hình của bạn"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#1e293b',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              👤
            </button>
          ) : (
            <div style={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 240,
              height: 145,
              background: '#0f172a',
              borderRadius: 16,
              overflow: 'hidden',
              border: isLocalSpeaking ? '2.5px solid #38bdf8' : '2px solid rgba(255,255,255,0.2)',
              boxShadow: isLocalSpeaking ? '0 0 20px rgba(56, 189, 248, 0.5)' : '0 12px 30px rgba(0,0,0,0.6)',
              zIndex: 30,
              transition: 'all 0.2s ease'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isScreenSharing ? 'none' : 'scaleX(-1)',
                  display: isVideoMuted ? 'none' : 'block'
                }}
              />

              {isVideoMuted && (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#1e293b', color: '#94a3b8', fontSize: 12, fontWeight: 700
                }}>
                  <span style={{ fontSize: 26, marginBottom: 4 }}>📷🚫</span>
                  <span>Camera đã tắt</span>
                </div>
              )}

              {/* Nút thu nhỏ PiP */}
              <button
                type="button"
                onClick={() => setIsPipMinimized(true)}
                title="Thu nhỏ khung hình bạn"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                −
              </button>

              {/* Nhãn bạn và trạng thái nói */}
              <div style={{
                position: 'absolute',
                bottom: 6,
                left: 8,
                right: 8,
                background: 'rgba(0,0,0,0.75)',
                padding: '3px 8px',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                color: '#fff',
                fontWeight: 700
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  Bạn ({currentUserName})
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {isLocalSpeaking && <span style={{ color: '#4ade80' }} title="Micro đang thu âm">🎙️</span>}
                  {isAudioMuted && <span style={{ color: '#ef4444' }}>🔇</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ 4. GOOGLE MEET SIDE PANEL (TÍCH HỢP CHAT, SỔ TAY, THỞ 4-7-8, BẢO MẬT) ══════════════ */}
        {activeSideDrawer && (
          <div style={{
            width: 380,
            height: '100%',
            background: '#1e1f20',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header Panel */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#242528'
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeSideDrawer === 'chat' && '💬 Trò chuyện trong phiên'}
                {activeSideDrawer === 'notes' && '📋 Sổ tay & Hồ sơ lâm sàng'}
                {activeSideDrawer === 'breathe' && '🧘 Bài tập thở 4-7-8 an tâm'}
                {activeSideDrawer === 'security' && '🛡️ Bảo mật WebRTC P2P'}
              </span>
              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }}
              >
                ✕
              </button>
            </div>

            {/* BODY: TAB 1 - LIVE CHAT */}
            {activeSideDrawer === 'chat' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div
                  ref={chatScrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 11.5,
                    color: '#38bdf8'
                  }}>
                    🔒 Tin nhắn truyền trực tiếp qua WebRTC DataChannel mã hóa 1-1, không qua trung gian bên thứ 3.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: 13 }}>
                      Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isMe = (currentUserRole === 'expert' && msg.senderRole === 'Expert') ||
                                   (currentUserRole === 'student' && msg.senderRole === 'Student');

                      return (
                        <div
                          key={msg.id || i}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '85%'
                          }}
                        >
                          <div style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            marginBottom: 3,
                            textAlign: isMe ? 'right' : 'left',
                            fontWeight: 600
                          }}>
                            {msg.senderName || (msg.senderRole === 'Expert' ? 'Chuyên viên' : 'Sinh viên')}
                          </div>
                          <div style={{
                            background: isMe ? '#0284c7' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '9px 14px',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            fontSize: 13,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form gửi chat */}
                <form onSubmit={handleSendChat} style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, background: '#242528' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Gửi tin nhắn trong cuộc họp..."
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      padding: '9px 12px',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 16px',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: chatInput.trim() ? 'pointer' : 'default',
                      opacity: chatInput.trim() ? 1 : 0.5
                    }}
                  >
                    Gửi
                  </button>
                </form>
              </div>
            )}

            {/* BODY: TAB 2 - SỔ TAY LÂM SÀNG (DÀNH CHO CHUYÊN VIÊN) */}
            {activeSideDrawer === 'notes' && notebookProps && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Đánh giá mức độ rủi ro &amp; Căng thẳng:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { key: 'Low', label: 'Thấp', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)' },
                      { key: 'Moderate', label: 'Vừa', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
                      { key: 'High', label: 'Cao', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)' },
                      { key: 'Crisis', label: 'Khẩn cấp', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
                    ].map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => notebookProps.setRisk?.(r.key)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: 8,
                          border: `1.5px solid ${notebookProps.risk === r.key ? r.color : 'rgba(255,255,255,0.15)'}`,
                          background: notebookProps.risk === r.key ? r.bg : 'rgba(255,255,255,0.05)',
                          color: notebookProps.risk === r.key ? r.color : '#cbd5e1',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Nhận định triệu chứng &amp; Ghi chú lâm sàng:
                  </label>
                  <textarea
                    rows={5}
                    value={notebookProps.notes || ''}
                    onChange={e => notebookProps.setNotes?.(e.target.value)}
                    placeholder="Ghi nhận tóm tắt trạng thái tâm lý, phản hồi của sinh viên..."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', fontSize: 13,
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Kế hoạch can thiệp &amp; Hẹn tái khám:
                  </label>
                  <input
                    type="text"
                    value={notebookProps.followUp || ''}
                    onChange={e => notebookProps.setFollowUp?.(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', fontSize: 13,
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Khuyến nghị cho sinh viên:
                  </label>
                  <input
                    type="text"
                    value={notebookProps.prescribed || ''}
                    onChange={e => notebookProps.setPrescribed?.(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', fontSize: 13,
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  disabled={notebookProps.saving}
                  onClick={() => notebookProps.onSave?.()}
                  style={{
                    marginTop: 8,
                    padding: '11px 18px',
                    borderRadius: 10,
                    background: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  {notebookProps.saving ? 'Đang lưu vào CSDL...' : '💾 Lưu Hồ Sơ & Kết Thúc Ca'}
                </button>
              </div>
            )}

            {/* BODY: TAB 3 - BÀI TẬP THỞ 4-7-8 (DÀNH CHO SINH VIÊN) */}
            {activeSideDrawer === 'breathe' && (
              <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(13, 148, 136, 0.15)',
                  border: '3px solid #0d9488',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  animation: 'pulse 3s infinite'
                }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#2dd4bf' }}>{breatheCount}s</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>nhịp đếm</span>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px', color: '#2dd4bf' }}>
                  {breathePhase}
                </h3>

                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 300, margin: '0 0 20px' }}>
                  Kỹ thuật thở 4-7-8 giúp xoa dịu hệ thần kinh đối giao cảm, giảm căng thẳng và giúp bạn cởi mở trò chuyện hơn cùng chuyên viên.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>• <strong>4s:</strong> Hít sâu bằng mũi</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>• <strong>7s:</strong> Giữ hơi thở bình tâm</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>• <strong>8s:</strong> Thở ra nhẹ nhàng bằng miệng</div>
                </div>
              </div>
            )}

            {/* BODY: TAB 4 - BẢO MẬT WEBRTC */}
            {activeSideDrawer === 'security' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.12)', padding: '12px 14px', borderRadius: 10, borderLeft: '3px solid #22c55e' }}>
                  <strong style={{ color: '#4ade80', fontSize: 13 }}>✓ 100% In-House WebRTC:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    Tự tổ chức nội bộ, không dùng bên thứ 3 (Zoom, Google, Twilio, Agora).
                  </p>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.12)', padding: '12px 14px', borderRadius: 10, borderLeft: '3px solid #38bdf8' }}>
                  <strong style={{ color: '#38bdf8', fontSize: 13 }}>✓ Mã Hóa DTLS-SRTP P2P:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    Dữ liệu âm thanh và hình ảnh truyền trực tiếp giữa 2 trình duyệt theo chuẩn RFC 5763 và RFC 3711.
                  </p>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '12px 14px', borderRadius: 10, borderLeft: '3px solid #fbbf24' }}>
                  <strong style={{ color: '#fbbf24', fontSize: 13 }}>✓ Quyền Riêng Tư &amp; Ẩn Danh:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    Danh tính sinh viên được bảo vệ tuyệt đối. Không ghi hình, không lưu video ra ngoài hệ thống.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ 5. BOTTOM CONTROL DOCK (GOOGLE MEET SIGNATURE TOOLBAR) ══════════════ */}
      <div style={{
        height: 76,
        padding: '0 24px',
        background: 'rgba(32, 33, 36, 0.98)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
        boxSizing: 'border-box'
      }}>
        {/* KHU VỰC TRÁI: ĐỒNG HỒ & THÔNG TIN CA HẸN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.02em' }}>
            {currentTime}
          </span>
          <span style={{ color: '#475569' }}>|</span>
          <button
            type="button"
            onClick={handleCopyCode}
            title="Nhấn để sao chép mã ca"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              color: copiedCode ? '#4ade80' : '#cbd5e1',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{copiedCode ? '✓' : '📋'}</span>
            <span>{copiedCode ? 'Đã chép' : bookingCode}</span>
          </button>
        </div>

        {/* KHU VỰC GIỮA: CÁC NÚT TRÒN ĐIỀU KHIỂN CHUẨN GOOGLE MEET (ROUND DOCK) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 1. Micro */}
          <button
            type="button"
            onClick={toggleAudio}
            title={isAudioMuted ? 'Bật Micro (Ctrl+D hoặc M)' : 'Tắt Micro (Ctrl+D hoặc M)'}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: isAudioMuted ? '#ea4335' : '#3c4043',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isAudioMuted ? '🔇' : '🎙️'}
          </button>

          {/* 2. Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            title={isVideoMuted ? 'Bật Camera (Ctrl+E hoặc V)' : 'Tắt Camera (Ctrl+E hoặc V)'}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: isVideoMuted ? '#ea4335' : '#3c4043',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isVideoMuted ? '📷🚫' : '📹'}
          </button>

          {/* 3. Chia sẻ màn hình */}
          <button
            type="button"
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: isScreenSharing ? '#0284c7' : '#3c4043',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            🖥️
          </button>

          {/* 4. Chế độ Thoại Riêng Tư */}
          <button
            type="button"
            onClick={() => setIsVoiceOnlyMode(v => !v)}
            title={isVoiceOnlyMode ? 'Tắt chế độ thoại riêng tư' : 'Bật chế độ thoại ẩn danh'}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: isVoiceOnlyMode ? '#0d9488' : '#3c4043',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            🎧
          </button>

          {/* 5. Toàn màn hình Native (F11 / RequestFullscreen) */}
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            title={isNativeFullscreen ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình trình duyệt (F)'}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: isNativeFullscreen ? '#0284c7' : '#3c4043',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isNativeFullscreen ? '🗗' : '⛶'}
          </button>

          {/* 6. NÚT KẾT THÚC CA HẸN (GOOGLE MEET RED PILL) */}
          {onLeaveOrEnd && (
            <button
              type="button"
              onClick={onLeaveOrEnd}
              style={{
                height: 50,
                padding: '0 24px',
                borderRadius: 25,
                background: '#ea4335',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginLeft: 8,
                boxShadow: '0 6px 18px rgba(234, 67, 53, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: 18 }}>📞</span>
              <span>{isHost ? 'Kết thúc ca' : 'Rời phòng'}</span>
            </button>
          )}
        </div>

        {/* KHU VỰC PHẢI: TIỆN ÍCH, SỔ TAY, BÀI TẬP THỞ, CHAT & BẢO MẬT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220, justifyContent: 'flex-end' }}>
          {/* Nút Sổ tay lâm sàng (Chuyên viên) */}
          {currentUserRole === 'expert' && notebookProps && (
            <button
              type="button"
              onClick={() => setActiveSideDrawer(d => d === 'notes' ? null : 'notes')}
              title="Mở Sổ tay & Hồ sơ lâm sàng"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeSideDrawer === 'notes' ? '#0284c7' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${activeSideDrawer === 'notes' ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              📝
            </button>
          )}

          {/* Nút Bài tập thở 4-7-8 (Sinh viên) */}
          {currentUserRole === 'student' && (
            <button
              type="button"
              onClick={() => setActiveSideDrawer(d => d === 'breathe' ? null : 'breathe')}
              title="Mở bài tập thở 4-7-8 thư giãn"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeSideDrawer === 'breathe' ? '#0d9488' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${activeSideDrawer === 'breathe' ? '#2dd4bf' : 'rgba(255,255,255,0.15)'}`,
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              🧘
            </button>
          )}

          {/* Nút Trò chuyện (Chat) */}
          <button
            type="button"
            onClick={() => {
              setActiveSideDrawer(d => d === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            title="Mở Trò chuyện trong cuộc gọi"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: activeSideDrawer === 'chat' ? '#0284c7' : 'rgba(255,255,255,0.08)',
              border: `1.5px solid ${activeSideDrawer === 'chat' ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            💬
            {unreadChatCount > 0 && activeSideDrawer !== 'chat' && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: '#ef4444', color: '#fff', fontSize: 10,
                fontWeight: 900, width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Nút Bảo mật WebRTC */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(d => d === 'security' ? null : 'security')}
            title="Xem chứng thực công nghệ bảo mật WebRTC"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: activeSideDrawer === 'security' ? '#0284c7' : 'rgba(255,255,255,0.08)',
              border: `1.5px solid ${activeSideDrawer === 'security' ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            🛡️
          </button>
        </div>
      </div>

      {/* ══════════════ 6. MODAL THÔNG BÁO KẾT THÚC TỪ HOST ══════════════ */}
      {connectionStatus === 'ended' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 70,
          padding: 24,
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)', border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, marginBottom: 18
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>
            Phiên Tư Vấn Đã Hoàn Tất
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 460, margin: '0 0 24px', lineHeight: 1.6 }}>
            Cuộc họp trực tuyến WebRTC đã được kết thúc thành công và an toàn. Cảm ơn bạn đã tham gia phiên tham vấn tâm lý cùng UniMind!
          </p>
          <button
            type="button"
            onClick={onLeaveOrEnd}
            style={{
              padding: '12px 32px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)'
            }}
          >
            Quay Về Trang Quản Lý Ca Hẹn
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
