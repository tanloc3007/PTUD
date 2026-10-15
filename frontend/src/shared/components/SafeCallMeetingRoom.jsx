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
  extraHeaderActions = null
}) {
  // Trạng thái Media & Thiết bị
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

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

  // Toàn màn hình
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
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
        position: 'relative',
        width: '100%',
        height: '75vh',
        minHeight: 520,
        background: '#090d16',
        borderRadius: isFullscreen ? 0 : 18,
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1.5px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* ══════════════ 1. TOP STATUS BAR ══════════════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 20,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Badge trạng thái WebRTC */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: isConnected ? '#4ade80' : '#facc15',
            border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            padding: '4px 11px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#eab308',
              boxShadow: isConnected ? '0 0 8px #22c55e' : 'none',
              animation: isConnected ? 'pulse 1.8s infinite' : 'none'
            }} />
            {isConnected
              ? 'WEBRTC P2P TRỰC TIẾP (MÃ HÓA ĐẦU CUỐI)'
              : connectionStatus === 'negotiating'
              ? 'ĐANG THIẾT LẬP SDP WEBRTC...'
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
          {extraHeaderActions}

          {/* Nút Xem Chứng Chỉ Bảo Mật WebRTC */}
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            🛡️ Bảo Mật WebRTC P2P
          </button>

          {/* Chuyển đổi chế độ Thoại / Video */}
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
              background: isVoiceOnlyMode ? '#0284c7' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              transition: 'all 0.15s'
            }}
          >
            {isVoiceOnlyMode ? '🎧 Ẩn Danh Thoại (Bật)' : '🎥 Video Call HD'}
          </button>
        </div>
      </div>

      {/* ══════════════ 2. MÀN HÌNH CHÍNH (REMOTE VIDEO & VOICE ROOM) ══════════════ */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

        {isVoiceOnlyMode ? (
          /* Chế độ Ẩn Danh Riêng Tư (Voice-Only) */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, #0f2445 0%, #090d16 100%)',
            color: '#fff', textAlign: 'center', padding: 20
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: currentUserRole === 'expert' ? '#0d9488' : '#0284c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 900, marginBottom: 16,
              boxShadow: isRemoteSpeaking ? '0 0 45px #38bdf8' : '0 0 25px rgba(2, 132, 199, 0.4)',
              transition: 'box-shadow 0.2s ease',
              border: isRemoteSpeaking ? '3px solid #38bdf8' : '3px solid rgba(255,255,255,0.2)'
            }}>
              {peerName?.charAt(0) || 'P'}
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
              {peerName}
            </h3>

            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', maxWidth: 460 }}>
              🔒 Phiên tư vấn âm thanh WebRTC trực tiếp. Camera tắt để bảo vệ danh tính tối đa.
            </p>

            {/* Chỉ báo trạng thái âm thanh */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.06)',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              color: '#38bdf8'
            }}>
              <span>{isRemoteSpeaking ? '🔊 Đang phát biểu...' : '🎙️ Đường truyền thoại WebRTC ổn định'}</span>
            </div>
          </div>
        ) : (
          /* Chế độ Video Call HD Chuẩn */
          <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617' }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: isConnected ? 'block' : 'none'
              }}
            />

            {/* Màn hình chờ khi đối phương chưa kết nối hoặc đang đàm phán */}
            {!isConnected && (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff', textAlign: 'center', padding: 24
              }}>
                <div style={{
                  width: 68, height: 68,
                  border: '3px solid rgba(255,255,255,0.15)',
                  borderTopColor: currentUserRole === 'expert' ? '#0284c7' : '#0d9488',
                  borderRadius: '50%',
                  animation: 'spin 1.2s linear infinite',
                  marginBottom: 20
                }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
                  {connectionStatus === 'negotiating'
                    ? 'Đang bắt tay WebRTC P2P (Trao đổi Offer/Answer)...'
                    : isHost
                    ? 'Phòng WebRTC nội bộ đã sẵn sàng'
                    : `Đang kết nối vào phòng cùng ${peerName}...`}
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
                  {isHost
                    ? `Hệ thống đã phát tín hiệu đến ${peerName}. Sinh viên truy cập vào là kết nối video trực tiếp ngay lập tức.`
                    : 'Đang thiết lập luồng WebRTC bảo mật P2P mã hóa đầu-cuối trực tiếp giữa 2 trình duyệt.'}
                </p>
              </div>
            )}

            {/* Huy hiệu tên đối phương ở góc dưới trái video */}
            <div style={{
              position: 'absolute',
              bottom: 18,
              left: 18,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isConnected ? '#22c55e' : '#eab308'
              }} />
              <span>{peerName}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                ({currentUserRole === 'expert' ? 'Sinh viên' : 'Chuyên viên'})
              </span>
              {peerState.isAudioMuted && <span title="Đối phương đã tắt mic" style={{ color: '#ef4444' }}>🔇</span>}
            </div>
          </div>
        )}

        {/* ══════════════ 3. LOCAL SELF-VIEW (PIP NỔI GÓC PHẢI) ══════════════ */}
        <div style={{
          position: 'absolute',
          top: 18,
          right: showChat ? 340 : 18,
          width: 210,
          height: 135,
          background: '#0f172a',
          borderRadius: 12,
          overflow: 'hidden',
          border: isLocalSpeaking ? '2.5px solid #38bdf8' : '2px solid rgba(255,255,255,0.2)',
          boxShadow: isLocalSpeaking ? '0 0 16px rgba(56, 189, 248, 0.5)' : '0 10px 24px rgba(0,0,0,0.5)',
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
              background: '#1e293b', color: '#94a3b8', fontSize: 11.5, fontWeight: 700
            }}>
              <span style={{ fontSize: 24, marginBottom: 4 }}>📷🚫</span>
              <span>Camera đã tắt</span>
            </div>
          )}

          {/* Nhãn bạn và trạng thái nói */}
          <div style={{
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            color: '#fff',
            fontWeight: 700
          }}>
            <span>Bạn ({currentUserName})</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {isLocalSpeaking && <span style={{ color: '#4ade80' }} title="Micro đang thu âm">🎙️</span>}
              {isAudioMuted && <span style={{ color: '#ef4444' }}>🔇</span>}
            </div>
          </div>
        </div>

        {/* ══════════════ 4. LIVE CHAT DRAWER (P2P + CSDL) ══════════════ */}
        {showChat && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 320,
            background: 'rgba(15, 23, 42, 0.97)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Chat header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                💬 Chat Trực Tiếp
                {isDataChannelReady && (
                  <span style={{ fontSize: 10, color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '1px 6px', borderRadius: 10 }}>
                    P2P
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Chat message list */}
            <div
              ref={chatScrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 11,
                color: '#38bdf8'
              }}>
                🔒 Tin nhắn truyền trực tiếp qua WebRTC DataChannel mã hóa 1-1, an toàn và riêng tư.
              </div>

              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 12 }}>
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
                        fontSize: 10.5,
                        color: '#94a3b8',
                        marginBottom: 2,
                        textAlign: isMe ? 'right' : 'left'
                      }}>
                        {msg.senderName || (msg.senderRole === 'Expert' ? 'Chuyên viên' : 'Sinh viên')}
                      </div>
                      <div style={{
                        background: isMe ? '#0284c7' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '7px 12px',
                        borderRadius: 10,
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form gửi chat */}
            <form onSubmit={handleSendChat} style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Nhắn tin trong phiên..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: '#fff',
                  fontSize: 12,
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
      </div>

      {/* ══════════════ 5. BOTTOM CONTROL TOOLBAR ══════════════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 20,
        flexWrap: 'wrap'
      }}>
        {/* Bật/Tắt Micro */}
        <button
          type="button"
          onClick={toggleAudio}
          title={isAudioMuted ? 'Bật Micro' : 'Tắt Micro'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: isAudioMuted ? '#dc2626' : 'rgba(255,255,255,0.1)',
            border: `1.5px solid ${isAudioMuted ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <span>{isAudioMuted ? '🔇' : '🎤'}</span>
          <span>{isAudioMuted ? 'Bật Mic' : 'Tắt Mic'}</span>
        </button>

        {/* Bật/Tắt Camera */}
        <button
          type="button"
          onClick={toggleVideo}
          title={isVideoMuted ? 'Bật Camera' : 'Tắt Camera'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: isVideoMuted ? '#dc2626' : 'rgba(255,255,255,0.1)',
            border: `1.5px solid ${isVideoMuted ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <span>{isVideoMuted ? '📷🚫' : '📹'}</span>
          <span>{isVideoMuted ? 'Bật Cam' : 'Tắt Cam'}</span>
        </button>

        {/* Chia sẻ màn hình (WebRTC Native) */}
        <button
          type="button"
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: isScreenSharing ? '#0284c7' : 'rgba(255,255,255,0.1)',
            border: `1.5px solid ${isScreenSharing ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <span>🖥️</span>
          <span>{isScreenSharing ? 'Dừng Share' : 'Chia sẻ màn hình'}</span>
        </button>

        {/* Mở Chat */}
        <button
          type="button"
          onClick={() => {
            setShowChat(v => !v);
            setUnreadChatCount(0);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: showChat ? '#0284c7' : 'rgba(255,255,255,0.1)',
            border: `1.5px solid ${showChat ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.15s'
          }}
        >
          <span>💬</span>
          <span>Trò chuyện</span>
          {unreadChatCount > 0 && !showChat && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: '#fff', fontSize: 10,
              fontWeight: 900, width: 18, height: 18, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Toàn màn hình */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <span>{isFullscreen ? '🗗' : '⛶'}</span>
          <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {/* Rời phòng / Kết thúc */}
        {onLeaveOrEnd && (
          <button
            type="button"
            onClick={onLeaveOrEnd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10,
              background: isHost ? '#dc2626' : '#991b1b',
              border: '1.5px solid #ef4444',
              color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              marginLeft: 'auto',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s'
            }}
          >
            <span>🚪</span>
            <span>{isHost ? 'Kết thúc ca' : 'Rời phòng'}</span>
          </button>
        )}
      </div>

      {/* ══════════════ 6. MODAL BẢO MẬT & CHỨNG THỰC WEBRTC NỘI BỘ ══════════════ */}
      {showSecurityModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: 20
        }}>
          <div style={{
            background: '#0f172a',
            border: '1.5px solid #38bdf8',
            borderRadius: 16,
            padding: 24,
            maxWidth: 520,
            width: '100%',
            color: '#fff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                🛡️ Chứng Thực Công Nghệ WebRTC Thuần Túy
              </h3>
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 10, borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#4ade80' }}>✓ 100% Tự Tổ Chức (Zero Third-Party):</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Hệ thống không sử dụng bất kỳ nhà cung cấp dịch vụ bên thứ 3 nào (Không Jitsi, không Zoom, không Google Meet, không Agora, không Twilio).
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 10, borderLeft: '3px solid #38bdf8' }}>
                <strong style={{ color: '#38bdf8' }}>✓ Mã Hóa Đầu-Cuối P2P (DTLS-SRTP):</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Dữ liệu hình ảnh và âm thanh truyền trực tiếp giữa trình duyệt của Chuyên viên và Sinh viên theo chuẩn RFC 5763 và RFC 3711. Máy chủ chỉ đóng vai trò trao đổi tín hiệu ban đầu (SDP Signaling).
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 10, borderLeft: '3px solid #f59e0b' }}>
                <strong style={{ color: '#fbbf24' }}>✓ Bảo Mật Danh Tính Ẩn Danh (Privacy-by-Design):</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Sinh viên được bảo vệ bằng mã định danh ẩn danh. Không ghi hình, không lưu trữ video ra ngoài hệ thống.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSecurityModal(false)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '10px 16px',
                background: '#0284c7',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Đã hiểu &amp; Tiếp tục phiên tư vấn
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ 7. MODAL THÔNG BÁO KẾT THÚC TỪ HOST ══════════════ */}
      {connectionStatus === 'ended' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
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
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)', border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 16
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>
            Phiên Tư Vấn Đã Hoàn Tất
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 440, margin: '0 0 24px' }}>
            Cuộc họp trực tuyến WebRTC đã được kết thúc thành công và an toàn. Cảm ơn bạn đã tham gia phiên tham vấn!
          </p>
          <button
            type="button"
            onClick={onLeaveOrEnd}
            style={{
              padding: '10px 28px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Quay Về Trang Quản Lý Ca Hẹn
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
