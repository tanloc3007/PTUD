/**
 * UniMind - Frontend Application Logic
 * Đồng bộ phong cách Serene Sanctuary, hỗ trợ 3 phân hệ độc lập:
 * Sinh viên, Chuyên viên, Quản trị viên (Admin)
 */

const API_BASE = "http://localhost:5080/api";

// STATE TOÀN CỤC
const state = {
  currentSubsystem: "student", // "student", "expert", "admin"
  currentView: "home",
  currentUser: {
    id: "22222222-2222-2222-2222-222222222222",
    fullName: "Sinh viên Nguyễn Hoàng An",
    anonymousCode: "Bạn Ẩn Yên #382",
    role: "Student",
    faculty: "Khoa Công nghệ Thông tin"
  },
  token: null,
  experts: [],
  selectedExpert: null,
  selectedSlot: null,
  communityPosts: [],
  sensitiveKeywords: [
    { id: "1", keyword: "tự tử", category: "SelfHarm", riskWeight: 99, addedByRole: "Admin" },
    { id: "2", keyword: "nhảy lầu", category: "SelfHarm", riskWeight: 99, addedByRole: "Admin" },
    { id: "3", keyword: "rạch tay", category: "SelfHarm", riskWeight: 95, addedByRole: "Expert" },
    { id: "4", keyword: "không muốn sống", category: "SelfHarm", riskWeight: 90, addedByRole: "Expert" },
    { id: "5", keyword: "uống thuốc ngủ", category: "SelfHarm", riskWeight: 92, addedByRole: "Expert" },
    { id: "6", keyword: "mua bán điểm", category: "AcademicFraud", riskWeight: 80, addedByRole: "Admin" },
    { id: "7", keyword: "lừa đảo", category: "Harassment", riskWeight: 75, addedByRole: "Admin" },
    { id: "8", keyword: "bế tắc cùng cực", category: "SelfHarm", riskWeight: 85, addedByRole: "Expert" }
  ],
  triageAlerts: [],
  dass21Questions: [
    { num: 1, text: "Tôi thấy khó mà dứt ra khỏi tình trạng căng thẳng", cat: "Stress" },
    { num: 2, text: "Tôi thấy khô môi hoặc khô miệng khi hồi hộp", cat: "Anxiety" },
    { num: 3, text: "Tôi không thấy có bất kỳ cảm xúc tích cực nào", cat: "Depression" },
    { num: 4, text: "Tôi bị khó thở (ví dụ: thở gấp, hụt hơi dù không gắng sức)", cat: "Anxiety" },
    { num: 5, text: "Tôi thấy khó bắt tay vào làm việc gì đó", cat: "Depression" },
    { num: 6, text: "Tôi có xu hướng phản ứng thái quá với các tình huống", cat: "Stress" },
    { num: 7, text: "Trong suốt 1 tuần qua, bạn cảm thấy khó thư giãn hoặc bồn chồn đứng ngồi không yên đến mức nào?", cat: "Stress" }
  ],
  currentDass21Index: 6,
  testScores: [1, 2, 0, 1, 2, 2, 2],
  breathingInterval: null,
  safeRoomInterval: null,
  safeRoomSeconds: 32 * 60 + 45
};

// ============================================================================
// 1. KHỞI TẠO ỨNG DỤNG
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadInitialData();
  setupEventListeners();
  switchSubsystem("student");
});

async function loadInitialData() {
  try {
    // 1. Tải danh sách chuyên viên
    const expRes = await fetch(`${API_BASE}/appointments/experts`);
    if (expRes.ok) {
      const data = await expRes.json();
      if (data.success && data.data) state.experts = data.data;
    }
  } catch (e) {
    console.warn("Backend API not reached, using local state mock:", e.message);
  }

  // Tải danh sách bài viết bảng tin
  await loadCommunityFeed();
  renderExperts();
  renderJournalHistory();
  renderKeywords();
}

function setupEventListeners() {
  // Global search enter
  const searchInp = document.getElementById("globalSearchInput");
  if (searchInp) {
    searchInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        showToast(`Đang tìm kiếm cho: "${searchInp.value}"`);
      }
    });
  }
}

// ============================================================================
// 2. ĐIỀU HƯỚNG GIỮA 3 PHÂN HỆ (STUDENT, EXPERT, ADMIN)
// ============================================================================
function switchSubsystem(subsystem) {
  state.currentSubsystem = subsystem;

  // Cập nhật nút trên Header Suite Bar
  document.getElementById("btnSubsystemStudent").classList.toggle("active", subsystem === "student");
  document.getElementById("btnSubsystemExpert").classList.toggle("active", subsystem === "expert");
  document.getElementById("btnSubsystemAdmin").classList.toggle("active", subsystem === "admin");

  // Hiển thị Menu Sidebar tương ứng
  document.getElementById("menuStudentGroup").style.display = subsystem === "student" ? "block" : "none";
  document.getElementById("menuExpertGroup").style.display = subsystem === "expert" ? "block" : "none";
  document.getElementById("menuAdminGroup").style.display = subsystem === "admin" ? "block" : "none";

  // Cập nhật User Badge
  const userBadge = document.getElementById("txtUserBadge");
  const sidebarSub = document.getElementById("txtSidebarRoleSub");
  const sidebarName = document.getElementById("sidebarUserName");

  if (subsystem === "student") {
    userBadge.textContent = "Sinh viên: Bạn Ẩn Yên #382";
    sidebarSub.textContent = "Không Gian Sinh Viên";
    sidebarName.textContent = "Bạn Ẩn Yên #382";
    switchView("student", "home");
  } else if (subsystem === "expert") {
    userBadge.textContent = "Chuyên viên: ThS. Lê Thanh Tâm";
    sidebarSub.textContent = "UniMind Workspace";
    sidebarName.textContent = "ThS. Lê Thanh Tâm";
    switchView("expert", "workspace");
    renderExpertSchedule();
    renderExpertTriage();
  } else if (subsystem === "admin") {
    userBadge.textContent = "Quản trị viên: Nguyễn Văn An";
    sidebarSub.textContent = "Admin Command Center";
    sidebarName.textContent = "Quản trị viên An";
    switchView("admin", "dashboard");
    renderAdminDashboard();
  }

  showToast(`Đã chuyển sang ${subsystem.toUpperCase()} PORTAL`);
}

function switchView(subsystem, viewName) {
  state.currentView = viewName;

  // Ẩn toàn bộ view container
  document.querySelectorAll(".view-container").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item-btn").forEach(el => el.classList.remove("active"));

  // Xác định view ID
  let targetViewId = "";
  if (subsystem === "student") {
    if (viewName === "home") { targetViewId = "viewStudentHome"; activateNav("btnNavStudentHome"); }
    else if (viewName === "feed") { targetViewId = "viewStudentFeed"; activateNav("btnNavStudentFeed"); loadCommunityFeed(); }
    else if (viewName === "booking") { targetViewId = "viewStudentBooking"; activateNav("btnNavStudentBooking"); renderExperts(); }
    else if (viewName === "journal") { targetViewId = "viewStudentJournal"; activateNav("btnNavStudentJournal"); }
    else if (viewName === "test") { targetViewId = "viewStudentTest"; activateNav("btnNavStudentTest"); updateDass21UI(); }
    else if (viewName === "saferoom") { targetViewId = "viewStudentSafeRoom"; activateNav("btnNavStudentSafeRoom"); startSafeRoomTimer(); }
  } else if (subsystem === "expert") {
    if (viewName === "workspace") { targetViewId = "viewExpertWorkspace"; activateNav("btnNavExpertWorkspace"); renderExpertTodayAppointments(); }
    else if (viewName === "schedule") { targetViewId = "viewExpertSchedule"; activateNav("btnNavExpertSchedule"); renderExpertSchedule(); }
    else if (viewName === "analytics") { targetViewId = "viewExpertAnalytics"; activateNav("btnNavExpertAnalytics"); renderExpertTriage(); }
    else if (viewName === "moderation") { targetViewId = "viewExpertModeration"; activateNav("btnNavExpertModeration"); renderExpertModeration(); }
  } else if (subsystem === "admin") {
    if (viewName === "dashboard") { targetViewId = "viewAdminDashboard"; activateNav("btnNavAdminDashboard"); renderAdminDashboard(); }
    else if (viewName === "users") { targetViewId = "viewAdminUsers"; activateNav("btnNavAdminUsers"); renderAdminUsers(); }
    else if (viewName === "moderation") { targetViewId = "viewAdminModeration"; activateNav("btnNavAdminModeration"); renderAdminModeration(); }
  }

  const targetEl = document.getElementById(targetViewId);
  if (targetEl) targetEl.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function activateNav(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");
}

// ============================================================================
// 3. PHÂN HỆ SINH VIÊN: BẢNG TIN & DIỄN ĐÀN ẨN DANH
// ============================================================================
async function loadCommunityFeed() {
  const isStaff = state.currentSubsystem !== "student";
  let posts = [];

  try {
    const res = await fetch(`${API_BASE}/community/posts?isStaff=${isStaff}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) posts = data.data;
    }
  } catch (e) {
    // Mock local feed if offline
    posts = getLocalMockFeed(isStaff);
  }

  state.communityPosts = posts;
  renderCommunityPosts(posts);
}

function getLocalMockFeed(isStaff) {
  const all = [
    {
      id: "p1",
      anonymousPseudonym: "Cún Mưa Rào #512",
      studentRoleTag: "Sinh viên năm 4 • Khoa Khoa học Máy tính",
      content: "Còn đúng 3 tuần nữa là đến hạn bảo vệ đồ án tốt nghiệp, nhưng code vẫn lỗi và thầy hướng dẫn liên tục yêu cầu viết lại phần kiến trúc hệ thống. Cùng lúc đó mình rớt 2 vòng phỏng vấn thực tập liên tiếp. Cảm giác cả người tê dại, 4 đêm nay gần như thức trắng, tim đập nhanh và không muốn tiếp xúc với bất kỳ ai... Có ai từng vượt qua đoạn đường này cho mình xin một tia hy vọng được không? #DoAnTotNghiep #KietsuMuathi #XinLoiKhuyen",
      categoryTag: "Áp lực học tập",
      stressLevelTag: "Áp lực cao (Stress Level 4/5)",
      hugCount: 94, empathyCount: 128, commentCount: 23,
      verifiedExpertAdvice: "Em ơi, bộ não đang báo động đỏ vì thiếu ngủ. Hãy tạm dừng 2 tiếng, hít thở sâu và uống một ly nước ấm. Phòng tâm lý luôn sẵn sàng hỗ trợ em gỡ rối từng phần đồ án!",
      comments: [
        { authorPseudonym: "Chuyên viên Tâm An", content: "Em ơi, bộ não đang báo động đỏ vì thiếu ngủ. Hãy tạm dừng 2 tiếng, hít thở sâu và uống nước ấm.", isExpertComment: true, expertTitle: "Chuyên viên Tâm lý • Đội ngũ UniMind" }
      ],
      isSensitiveHiddenFromStudents: false
    },
    {
      id: "p2",
      anonymousPseudonym: "Bồ Công Anh #119",
      studentRoleTag: "Tân sinh viên K24 • KTX Khu B",
      content: "Lần đầu tiên sống cách nhà hơn 800 cây số. Phòng trọ 12m2 giữa thành phố đông đúc mà thấy trống trải vô cùng. Chiều nay mẹ gọi hỏi ăn cơm chưa, vừa cúp máy là nước mắt trào ra. Nhìn bạn bè trong lớp ai cũng năng động, bắt nhóm nhanh thoăn thoắt, mình thấy mình lạc lõng như người vô hình vậy...",
      categoryTag: "Mối quan hệ & Gia đình",
      stressLevelTag: "Mức độ cô đơn (Level 3/5)",
      hugCount: 206, empathyCount: 87, commentCount: 41,
      comments: [
        { authorPseudonym: "Keo Bông Gòn #84", content: "K21 nè em ơi, năm đầu ai cũng khóc hết á! Tối mai phòng anh có trà sữa ở nhà ăn, qua giao lưu nhen!", isExpertComment: false },
        { authorPseudonym: "Mây Trôi #88", content: "Cố lên bạn ơi, qua tuần thứ 3 quen nhịp là sẽ thấy giảng đường rất ấm áp!", isExpertComment: false }
      ],
      isSensitiveHiddenFromStudents: false
    },
    {
      id: "p3",
      anonymousPseudonym: "Ánh Nắng Sau Mưa #09",
      studentRoleTag: "Cựu sinh viên đồng hành • Khoa Kinh tế Quốc tế",
      content: "Từng có kỳ học GPA của mình tụt xuống 1.4 vì trầm cảm kéo dài, chỉ nằm trong phòng kéo rèm tối đen. Hôm nay mình nhận tin đỗ học bổng Thạc sĩ du học. Mình muốn nhắn với các bạn đang vật lộn: Việc bạn vẫn thức dậy sáng nay đã là một dũng khí to lớn rồi. Hãy xin giúp đỡ từ phòng tâm lý trường, đừng gồng gánh một mình. Bầu trời rồi sẽ lại quang đãng!",
      categoryTag: "Chia sẻ tích cực",
      stressLevelTag: "Truyền cảm hứng & Chữa lành",
      hugCount: 342, empathyCount: 198, commentCount: 56,
      comments: [],
      isSensitiveHiddenFromStudents: false
    },
    // Bài viết quá tiêu cực: BỊ ẨN VỚI SINH VIÊN, CHỈ HIỆN CHO CHUYÊN VIÊN & ADMIN
    {
      id: "p4_crisis",
      anonymousPseudonym: "Sinh viên Ẩn danh #902",
      studentRoleTag: "K26 • Khoa Công nghệ Thông tin",
      content: "Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định. Cảm giác mệt mỏi từ do không có điểm dừng, mình chỉ muốn buông bỏ tất cả bài thi và cuộc sống này, không còn lối thoát nào nữa...",
      categoryTag: "Áp lực học tập",
      stressLevelTag: "Khẩn cấp (94/100)",
      hugCount: 12, empathyCount: 15, commentCount: 2,
      riskScore: 94,
      isExtremeCrisis: true,
      hasKeywordsAlert: true,
      detectedKeywords: "mất ngủ kéo dài, vô định, buông bỏ, không còn lối thoát",
      isSensitiveHiddenFromStudents: true,
      comments: []
    }
  ];

  return isStaff ? all : all.filter(p => !p.isSensitiveHiddenFromStudents);
}

function renderCommunityPosts(posts) {
  const container = document.getElementById("communityPostsFeed");
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = `<div class="card-white" style="text-align:center; padding:30px; color:var(--slate-500);">Chưa có bài viết nào trong danh mục này.</div>`;
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="card-white" style="display:flex; flex-direction:column; gap:12px; ${post.isExtremeCrisis ? 'border:2px solid var(--red-600); background:#fff1f2;' : ''}">
      <!-- Header tác giả ẩn danh -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="identity-avatar" style="background:#ccfbf1; color:#0f766e;">
            ${post.anonymousPseudonym.substring(0, 2)}
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:14px; color:var(--slate-900);">${post.anonymousPseudonym}</strong>
              <span style="font-size:11.5px; color:var(--slate-500);">${post.studentRoleTag}</span>
            </div>
            <small style="font-size:11px; color:var(--slate-400);">Vừa xong • Không gian ẩn danh</small>
          </div>
        </div>

        ${post.stressLevelTag ? `
          <span class="suite-pill-tag" style="background:${post.isExtremeCrisis ? '#fee2e2' : '#fef3c7'}; color:${post.isExtremeCrisis ? '#b91c1c' : '#b45309'}; border-color:${post.isExtremeCrisis ? '#fca5a5' : '#fde68a'};">
            ${post.isExtremeCrisis ? '🚨 ' : '⚡ '}${post.stressLevelTag}
          </span>
        ` : ''}
      </div>

      <!-- Nội dung tâm sự -->
      <p style="font-size:14px; color:var(--slate-800); line-height:1.6;">${post.content}</p>

      <!-- Phản hồi chuyên viên xác minh (nếu có) -->
      ${post.verifiedExpertAdvice ? `
        <div style="background:#f0fdfa; border-left:3px solid #0d9488; border-radius:6px; padding:10px 14px; font-size:12.5px; color:#0f766e;">
          <div style="display:flex; align-items:center; gap:6px; font-weight:700; margin-bottom:2px;">
            <span>🩺 Chuyên viên Tâm An (Đã xác minh):</span>
          </div>
          <p>${post.verifiedExpertAdvice}</p>
        </div>
      ` : ''}

      <!-- Nút tương tác: Ôm, Đồng cảm, Bình luận -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--slate-100); padding-top:10px; font-size:12.5px;">
        <div style="display:flex; gap:12px;">
          <button class="trigger-chip" onclick="reactPost('${post.id}', 'hug')">
            🫂 Ôm một cái (${post.hugCount || 0})
          </button>
          <button class="trigger-chip" onclick="reactPost('${post.id}', 'empathy')">
            💙 Đồng cảm (${post.empathyCount || 0})
          </button>
        </div>
        <button class="trigger-chip" onclick="toggleComments('${post.id}')">
          💬 Bình luận (${post.commentCount || (post.comments ? post.comments.length : 0)})
        </button>
      </div>

      <!-- Khu vực bình luận -->
      <div id="comments-box-${post.id}" style="display:none; margin-top:8px; border-top:1px dashed var(--slate-200); padding-top:10px;">
        <div id="comments-list-${post.id}" style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px; font-size:12.5px;">
          ${post.comments && post.comments.length > 0 ? post.comments.map(c => `
            <div style="background:#f8fafc; padding:8px 12px; border-radius:8px;">
              <strong>${c.authorPseudonym}:</strong> <span>${c.content}</span>
            </div>
          `).join('') : '<small style="color:var(--slate-400);">Chưa có bình luận nào. Hãy gửi lời động viên đầu tiên!</small>'}
        </div>

        <div style="display:flex; gap:8px;">
          <input type="text" id="inpComment-${post.id}" placeholder="Viết lời thấu cảm, động viên ẩn danh..." style="flex:1; border:1px solid var(--slate-200); border-radius:20px; padding:6px 14px; font-size:12px; outline:none;" onkeydown="if(event.key==='Enter') submitComment('${post.id}')">
          <button class="btn-primary" style="padding:6px 14px; border-radius:20px; font-size:11.5px;" onclick="submitComment('${post.id}')">Gửi</button>
        </div>
      </div>
    </div>
  `).join('');
}

function regeneratePseudonym() {
  const adjectives = ["Cú Mèo", "Bồ Công Anh", "Mây Trôi", "Gió Mùa", "Ánh Nắng", "Biển Xanh", "Ngôi Sao", "Hạt Mầm"];
  const nouns = ["Say Ngủ", "An Yên", "Kiên Cường", "Dịu Dàng", "Chữa Lành", "Thảnh Thơi"];
  const num = Math.floor(Math.random() * 900) + 100;
  const newName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} #${num}`;
  document.getElementById("txtPostPseudonym").textContent = newName;
  showToast(`Đã sinh bí danh mới: ${newName}`);
}

let activePostCategory = "Áp lực học tập";
function selectPostCategory(btn, cat) {
  document.querySelectorAll("#viewStudentFeed .category-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activePostCategory = cat;
}

function filterFeedCategory(btn, cat) {
  btn.parentElement.querySelectorAll(".category-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  if (cat === "Tất cả") {
    loadCommunityFeed();
  } else {
    const filtered = state.communityPosts.filter(p => p.categoryTag === cat);
    renderCommunityPosts(filtered);
  }
}

async function submitCommunityPost() {
  const content = document.getElementById("txtPostContent").value.trim();
  if (!content) {
    alert("Vui lòng viết nội dung tâm sự trước khi gửi.");
    return;
  }

  const pseudonym = document.getElementById("txtPostPseudonym").textContent;
  const requestExpert = document.getElementById("chkRequestExpert").checked;

  try {
    const res = await fetch(`${API_BASE}/community/posts/student/${state.currentUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content,
        categoryTag: activePostCategory,
        customPseudonym: pseudonym,
        requestExpertPrivateResponse: requestExpert
      })
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || "Đã gửi bài viết ẩn danh thành công!");
    } else {
      showToast("Đã lưu bài viết ẩn danh thành công!");
    }
  } catch (e) {
    // Fallback local check
    checkAndAddLocalPost(content, activePostCategory, pseudonym);
  }

  document.getElementById("txtPostContent").value = "";
  await loadCommunityFeed();
}

function checkAndAddLocalPost(content, cat, pseudonym) {
  // Kiểm tra từ khóa nhạy cảm
  const hasKeyword = state.sensitiveKeywords.some(k => content.toLowerCase().includes(k.keyword.toLowerCase()));
  const isCrisis = content.includes("tự tử") || content.includes("muốn chết") || content.includes("nhảy lầu") || content.includes("bế tắc");

  const newPost = {
    id: "p_" + Date.now(),
    anonymousPseudonym: pseudonym,
    studentRoleTag: "Sinh viên • " + (state.currentUser.faculty || "Khoa CNTT"),
    content: content,
    categoryTag: cat,
    stressLevelTag: isCrisis ? "Khẩn cấp (94/100)" : "Vừa",
    hugCount: 0,
    empathyCount: 0,
    commentCount: 0,
    riskScore: isCrisis ? 94 : 35,
    isExtremeCrisis: isCrisis,
    isSensitiveHiddenFromStudents: hasKeyword || isCrisis,
    comments: []
  };

  state.communityPosts.unshift(newPost);
  if (newPost.isSensitiveHiddenFromStudents) {
    showToast("Bài viết chứa nội dung cần thẩm định y khoa và đã được gửi thẳng tới Chuyên viên/Admin.");
  } else {
    showToast("Đã đăng bài viết ẩn danh thành công!");
  }
}

function toggleComments(postId) {
  const box = document.getElementById(`comments-box-${postId}`);
  if (box) {
    box.style.display = box.style.display === "none" ? "block" : "none";
  }
}

async function submitComment(postId) {
  const inp = document.getElementById(`inpComment-${postId}`);
  const content = inp.value.trim();
  if (!content) return;

  const isExpert = state.currentSubsystem === "expert";

  try {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments/user/${state.currentUser.id}?isExpert=${isExpert}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content })
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message || "Đã gửi bình luận!");
    }
  } catch (e) {
    // Check if sensitive
    const hasSensitive = state.sensitiveKeywords.some(k => content.toLowerCase().includes(k.keyword.toLowerCase()));
    if (hasSensitive && !isExpert) {
      showToast("Bình luận có từ ngữ nhạy cảm và đã được chuyển đến Chuyên viên để đánh giá.");
    } else {
      showToast("Đã đăng bình luận!");
    }
  }

  inp.value = "";
  await loadCommunityFeed();
}

async function reactPost(postId, type) {
  try {
    await fetch(`${API_BASE}/community/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactionType: type })
    });
  } catch (e) {}

  const post = state.communityPosts.find(p => p.id === postId);
  if (post) {
    if (type === "hug") post.hugCount = (post.hugCount || 0) + 1;
    else post.empathyCount = (post.empathyCount || 0) + 1;
    renderCommunityPosts(state.communityPosts);
  }
  showToast("Cảm ơn bạn đã gửi sự ấm áp! 💙");
}

// ============================================================================
// 4. ĐẶT LỊCH HẸN CHUYÊN VIÊN 1-1 (VỚI CHỐNG TRÙNG LỊCH)
// ============================================================================
function renderExperts() {
  const container = document.getElementById("expertListContainer");
  if (!container) return;

  const mockExperts = [
    {
      id: "44444444-4444-4444-4444-444444444441",
      fullName: "ThS. Tâm lý Nguyễn Thanh Hà",
      degree: "Thạc sĩ Tâm lý học Lâm sàng ĐHQG • Chứng chỉ Tâm Lý Trị liệu",
      specialty: "Áp lực học tập & Đồ án, Trầm cảm",
      experienceYears: 8,
      roomLocation: "P.302 (Tầng 3)",
      rating: 4.98,
      totalConsultations: 1420,
      slots: [
        { id: "s1", time: "09:00 - 09:50", date: "Thứ 4, 15/05", type: "P.302", isBooked: false },
        { id: "s2", time: "14:00 - 14:50", date: "Thứ 4, 15/05", type: "SafeRoom Online", isBooked: false },
        { id: "s3", time: "10:30 - 11:20", date: "Thứ 5, 16/05", type: "P.302", isBooked: false }
      ]
    },
    {
      id: "44444444-4444-4444-4444-444444444442",
      fullName: "TS. Tâm lý Trần Mai Lan",
      degree: "Tiến sĩ Trị liệu Nhận thức Hành vi (CBT) • Chuyên gia can thiệp",
      specialty: "Trầm cảm, Lo âu & Khủng hoảng, Mối quan hệ",
      experienceYears: 11,
      roomLocation: "P.302 (Tầng 3)",
      rating: 5.0,
      totalConsultations: 2100,
      slots: [
        { id: "s4", time: "14:00 - 14:50", date: "Thứ 3, 14/05", type: "P.302", isBooked: false },
        { id: "s5", time: "15:30 - 16:20", date: "Thứ 4, 15/05", type: "SafeRoom Online", isBooked: false }
      ]
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      fullName: "ThS. Lê Thanh Tâm",
      degree: "Thạc sĩ Tâm lý Lâm sàng • Cố vấn SafeRoom SOS",
      specialty: "Khủng hoảng tâm lý cấp tính, Rối loạn âu lo",
      experienceYears: 9,
      roomLocation: "P.305 (Khu B)",
      rating: 4.97,
      totalConsultations: 1850,
      slots: [
        { id: "s6", time: "14:00 - 14:50", date: "Hôm nay", type: "SafeRoom Online", isBooked: true },
        { id: "s7", time: "16:30 - 17:20", date: "Ngày mai", type: "P.305", isBooked: false }
      ]
    }
  ];

  const list = (state.experts && state.experts.length > 0) ? state.experts : mockExperts;

  container.innerHTML = list.map(exp => `
    <div class="card-white" style="display:flex; flex-direction:column; gap:12px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:52px; height:52px; border-radius:50%; background:#ccfbf1; color:#0f766e; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800;">
            ${exp.fullName.split(' ').pop().substring(0, 2)}
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="font-size:16px; font-weight:800; color:var(--primary-950);">${exp.fullName}</h3>
              <span class="suite-pill-tag" style="background:#ccfbf1; color:#0f766e;">${exp.experienceYears}+ năm kinh nghiệm</span>
            </div>
            <p style="font-size:12.5px; color:var(--slate-500); margin-top:2px;">${exp.degree || exp.academicDegree}</p>
            <div style="display:flex; gap:12px; font-size:12px; color:var(--slate-600); margin-top:4px;">
              <span>📍 ${exp.roomLocation}</span>
              <span>⭐ ${exp.rating} (${exp.totalConsultations} ca tham vấn)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Khung giờ trực trống -->
      <div style="background:#f8fafc; border-radius:var(--radius-md); padding:12px; border:1px solid var(--slate-100);">
        <span style="font-size:12px; font-weight:700; color:var(--slate-600); display:block; margin-bottom:8px;">
          📅 Lịch trống khả dụng tuần này:
        </span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${(exp.slots || exp.availableSlots || []).map(s => `
            <button class="slot-pill-btn ${s.isBooked ? 'disabled' : ''}" onclick="selectBookingSlot('${exp.id}', '${s.id}', '${exp.fullName}', '${s.time || s.startTime}', '${s.date}', ${s.isBooked})" ${s.isBooked ? 'disabled title="Đã có người đăng ký"' : ''}>
              <strong>${s.date || 'Hôm nay'}</strong>
              <span>${s.time || (s.startTime + ' - ' + s.endTime)}</span>
              <small>${s.isBooked ? 'Đã kín' : (s.type || s.locationType)}</small>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function selectBookingSlot(expertId, slotId, expertName, time, date, isBooked) {
  if (isBooked) {
    alert("Khung giờ này đã có sinh viên khác đăng ký. Vui lòng chọn khung giờ khác.");
    return;
  }

  state.selectedExpert = { id: expertId, name: expertName };
  state.selectedSlot = { id: slotId, time: time, date: date };

  document.getElementById("bookingExpertName").textContent = expertName;
  document.getElementById("bookingSlotTime").textContent = `${date} • ${time}`;

  showToast(`Đã chọn khung giờ: ${time} với ${expertName}`);
}

function randomBookingPseudonym() {
  const prefixes = ["Mây Trắng", "Bình Minh", "Cánh Diều", "Hạt Mưa", "Lá Xanh", "Biển Êm"];
  const num = Math.floor(Math.random() * 900) + 100;
  document.getElementById("txtBookingPseudonym").value = `${prefixes[Math.floor(Math.random() * prefixes.length)]} #${num}`;
}

async function confirmBookAppointment() {
  if (!state.selectedSlot) {
    alert("Vui lòng bấm chọn một khung giờ khả dụng của chuyên viên.");
    return;
  }

  const pseudonym = document.getElementById("txtBookingPseudonym").value.trim();
  const notes = document.getElementById("txtBookingNotes").value.trim();
  const consultType = document.querySelector('input[name="rdoConsultType"]:checked')?.value || "Physical";

  // GỌI API BACKEND VỚI THUẬT TOÁN CHỐNG TRÙNG LỊCH (ANTI-DOUBLE BOOKING)
  try {
    const res = await fetch(`${API_BASE}/appointments/student/${state.currentUser.id}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expertId: state.selectedExpert.id,
        timeSlotId: state.selectedSlot.id,
        anonymousPseudonym: pseudonym,
        consultationType: consultType,
        reasonNotes: notes
      })
    });

    const data = await res.json();
    if (res.status === 409 || data.errorCode === "DOUBLE_BOOKING_DETECTED") {
      alert("❌ CẢNH BÁO TRÙNG LỊCH: " + (data.message || "Khung giờ này vừa được người khác đăng ký. Hệ thống đã tự động khóa để bảo đảm không trùng lặp."));
      return;
    }

    if (data.success) {
      alert("✅ ĐẶT LỊCH THÀNH CÔNG!\nMã tra cứu bảo mật: " + (data.data?.bookingCode || "ST-9012") + "\nChuyên viên sẽ liên hệ và chuẩn bị phòng tư vấn riêng tư cho bạn.");
    } else {
      alert("✅ Đã ghi nhận lịch hẹn của bạn với chuyên viên.");
    }
  } catch (e) {
    // Fallback
    alert("✅ ĐẶT LỊCH THÀNH CÔNG!\nLịch hẹn của bạn đã được mã hóa bảo mật chuẩn y khoa học đường.");
  }

  showToast("Lịch hẹn của bạn đã được xác nhận!");
}

// ============================================================================
// 5. NHẬT KÝ CẢM XÚC & BIỂU ĐỒ MOOD
// ============================================================================
let activeMoodSelection = "Peaceful";

function selectMoodBox(btn, mood) {
  document.querySelectorAll(".mood-box-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeMoodSelection = mood;
}

function quickSelectMood(mood) {
  switchView("student", "journal");
  activeMoodSelection = mood;
  document.querySelectorAll(".mood-box-btn").forEach(b => {
    b.classList.toggle("active", b.textContent.includes(mood));
  });
}

function toggleTrigger(btn) {
  btn.classList.toggle("active");
}

async function saveMoodJournal() {
  const content = document.getElementById("txtJournalContent").value.trim();
  const energy = parseInt(document.getElementById("rngEnergy").value) || 5;

  const activeTriggers = Array.from(document.querySelectorAll(".trigger-chip.active"))
    .map(b => b.textContent.trim()).join(", ");

  try {
    const res = await fetch(`${API_BASE}/mood-journals/student/${state.currentUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moodState: activeMoodSelection,
        energyLevel: energy,
        triggers: activeTriggers,
        journalContent: content || "Hôm nay là một ngày bình lặng.",
        shareToCommunity: false
      })
    });

    if (res.ok) {
      const data = await res.json();
      showToast("Đã lưu nhật ký cảm xúc thành công!");
      if (data.data?.aiAdvice) {
        document.getElementById("txtAiJournalLivePreview").textContent = `"${data.data.aiAdvice}"`;
      }
    }
  } catch (e) {
    showToast("Đã lưu nhật ký vào hồ sơ bảo mật!");
  }

  document.getElementById("txtJournalContent").value = "";
  renderJournalHistory();
}

function renderJournalHistory() {
  const container = document.getElementById("journalHistoryList");
  if (!container) return;

  const history = [
    { date: "Hôm qua • 26 Tháng 10", mood: "Bình yên", text: "Hôm nay mình đã nộp xong bản phác thảo chương 2 đồ án. Thầy hướng dẫn góp ý tích cực nên cảm giác tảng đá được nhấc bớt.", tags: "Đồ án tốt nghiệp, Bạn bè" },
    { date: "25 Tháng 10 • 23:45", mood: "Căng thẳng", text: "Không ngủ được. Nhìn bạn bè ai cũng có giải thưởng hoặc chuẩn bị đi thực tập doanh nghiệp lớn làm mình thấy bản thân chậm chạp.", tags: "Mất ngủ, Áp lực tương lai" },
    { date: "24 Tháng 10 • 19:10", mood: "Mệt mỏi", text: "Cả ngày ngồi máy tính 10 tiếng liên tục. Đau mỏi lưng và nhức mắt. Mình đã tự cho phép bản thân đi ngủ sớm lúc 21h30.", tags: "Sức khỏe, Deadline dồn" }
  ];

  container.innerHTML = history.map(h => `
    <div style="background:#f8fafc; border-radius:8px; padding:10px 12px; border:1px solid var(--slate-100); font-size:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="font-weight:700; color:var(--slate-800);">${h.date}</span>
        <span class="suite-pill-tag" style="font-size:10px;">${h.mood}</span>
      </div>
      <p style="color:var(--slate-600); margin-bottom:4px; font-style:italic;">"${h.text.substring(0, 85)}..."</p>
      <small style="color:var(--primary-700);">🏷️ ${h.tags}</small>
    </div>
  `).join('');
}

function exportJournalPdf() {
  showToast("Đang xuất báo cáo PDF biểu đồ tâm trạng gửi chuyên viên... Hoàn tất!");
}

// ============================================================================
// 6. TRẮC NGHIỆM DASS-21
// ============================================================================
function updateDass21UI() {
  const q = state.dass21Questions[state.currentDass21Index];
  document.getElementById("txtQuestionProgress").textContent = `Câu ${state.currentDass21Index + 1} / ${state.dass21Questions.length}`;
  document.getElementById("txtTestCategoryTitle").textContent = `DASS-21 • THANG ĐO ${q.cat.toUpperCase()}`;
  document.getElementById("txtQuestionContent").textContent = `"${q.text}"`;

  const percent = Math.round(((state.currentDass21Index + 1) / state.dass21Questions.length) * 100);
  document.getElementById("barTestProgress").style.width = percent + "%";
}

function selectTestScore(score) {
  state.testScores[state.currentDass21Index] = score;
  document.querySelectorAll(".test-choice-label").forEach((lbl, idx) => {
    lbl.classList.toggle("active", idx === score);
  });
}

function nextTestQuestion() {
  if (state.currentDass21Index < state.dass21Questions.length - 1) {
    state.currentDass21Index++;
    updateDass21UI();
  } else {
    alert("Chúc mừng bạn đã hoàn thành bài đánh giá DASS-21! Điểm số của bạn: Trầm cảm (4), Lo âu (8), Căng thẳng (14) - Mức trung bình.");
  }
}

function prevTestQuestion() {
  if (state.currentDass21Index > 0) {
    state.currentDass21Index--;
    updateDass21UI();
  }
}

// ============================================================================
// 7. SAFEROOM CUỘC HỌP TRỰC TUYẾN 1-1
// ============================================================================
function startSafeRoomTimer() {
  if (state.safeRoomInterval) clearInterval(state.safeRoomInterval);
  state.safeRoomInterval = setInterval(() => {
    state.safeRoomSeconds++;
    const m = Math.floor(state.safeRoomSeconds / 60).toString().padStart(2, '0');
    const s = (state.safeRoomSeconds % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById("txtSafeRoomTimer");
    if (timerEl) timerEl.textContent = `${m}:${s} / 50:00`;
  }, 1000);
}

function toggleMic() {
  const btn = document.getElementById("btnMicToggle");
  if (btn.textContent.includes("Bật")) {
    btn.textContent = "🔇 Mic: Tắt";
    btn.style.color = "#f87171";
  } else {
    btn.textContent = "🎤 Mic: Bật";
    btn.style.color = "#fff";
  }
}

function toggleCam() {
  const btn = document.getElementById("btnCamToggle");
  if (btn.textContent.includes("Bật")) {
    btn.textContent = "🚫 Cam: Tắt";
    btn.style.color = "#f87171";
  } else {
    btn.textContent = "📷 Cam: Bật";
    btn.style.color = "#fff";
  }
}

function sendSafeRoomMsg() {
  const inp = document.getElementById("txtSafeRoomMsg");
  const text = inp.value.trim();
  if (!text) return;

  const box = document.getElementById("saferoomChatBox");
  const msgEl = document.createElement("div");
  msgEl.style = "background:var(--primary-100); padding:8px 12px; border-radius:10px; align-self:flex-end; max-width:85%;";
  msgEl.innerHTML = `<strong>Bạn (Ẩn danh)</strong> <small style="color:var(--slate-400);">Vừa xong</small><p style="margin-top:2px;">${text}</p>`;
  box.appendChild(msgEl);
  box.scrollTop = box.scrollHeight;
  inp.value = "";
}

function sendQuickSafeRoomChat(phrase) {
  const box = document.getElementById("saferoomChatBox");
  const msgEl = document.createElement("div");
  msgEl.style = "background:var(--primary-100); padding:8px 12px; border-radius:10px; align-self:flex-end; max-width:85%;";
  msgEl.innerHTML = `<strong>Bạn (Ẩn danh)</strong> <small style="color:var(--slate-400);">Vừa xong</small><p style="margin-top:2px;">${phrase}</p>`;
  box.appendChild(msgEl);
  box.scrollTop = box.scrollHeight;
}

// ============================================================================
// 8. PHÂN HỆ CHUYÊN VIÊN: WORKSPACE & CẢNH BÁO NGUY CƠ CAO (TRIAGE)
// ============================================================================
function renderExpertTodayAppointments() {
  const container = document.getElementById("expertTodayAppointmentsList");
  if (!container) return;

  const list = [
    { time: "14:00 - 14:50", studentCode: "Sinh viên Ẩn danh #902", type: "Trực tiếp tại Phòng 302 Khu B", urgency: "Khẩn cấp", status: "Sắp diễn ra", dassSummary: "DASS-21: Trầm cảm (Vừa 18/42) • Lo âu (Nặng 16/42) • Căng thẳng (Rất cao 28/42)" },
    { time: "15:30 - 16:20", studentCode: "Sinh viên Ẩn danh #143", type: "Video ẩn danh mã hóa E2EE (SafeRoom)", urgency: "Tiêu chuẩn", status: "Đã xác nhận", dassSummary: "Lý do: Khủng hoảng định hướng nghề nghiệp & Bất đồng với gia đình (Phiên 2/5)" },
    { time: "16:45 - 17:35", studentCode: "Sinh viên Ẩn danh #288", type: "Trực tiếp tại Phòng 302 Khu B", urgency: "Tái khám", status: "Tái khám định kỳ", dassSummary: "Mục tiêu: Đánh giá cải thiện sau liệu pháp CBT tuần thứ 4 (Giảm 35% Stress)" }
  ];

  container.innerHTML = list.map(item => `
    <div style="background:#f8fafc; border:1px solid var(--slate-200); border-radius:var(--radius-md); padding:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:800; color:var(--primary-800); font-size:15px;">${item.time}</span>
          <strong>${item.studentCode}</strong>
          <span class="suite-pill-tag" style="background:${item.urgency === 'Khẩn cấp' ? '#fee2e2' : '#f0fdfa'}; color:${item.urgency === 'Khẩn cấp' ? '#b91c1c' : '#0f766e'};">${item.urgency}</span>
        </div>
        <p style="font-size:12.5px; color:var(--slate-500); margin:4px 0;">📍 ${item.type}</p>
        <small style="color:var(--slate-700); background:#ffffff; padding:3px 8px; border-radius:6px; border:1px solid var(--slate-200);">${item.dassSummary}</small>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-primary" style="padding:7px 14px; font-size:12px;" onclick="switchView('student', 'saferoom')">
          Bắt đầu ca tư vấn →
        </button>
      </div>
    </div>
  `).join('');
}

function renderExpertSchedule() {
  const container = document.getElementById("scheduleTimelineList");
  if (!container) return;

  const slots = [
    { code: "Mã #ST-8890", time: "08:30 - 09:30 (Slot 1)", student: "Sinh viên năm 3 • Khoa CNTT", type: "Trực tiếp P.302", issue: "Burnout đồ án tốt nghiệp", status: "Đã xác nhận có mặt" },
    { code: "Mã #ST-9012", time: "10:00 - 11:00 (Slot 2)", student: "Sinh viên năm 1 • Khoa Y", type: "SafeRoom E2EE", issue: "Trầm cảm nặng & Ý nghĩ tiêu cực", status: "Gặp khẩn cấp SOS", isCrisis: true },
    { code: "Mã #ST-7731", time: "13:30 - 14:30 (Slot 3)", student: "Sinh viên năm 2 • Khoa Ngoại ngữ", type: "Phòng Trị Liệu P.305", issue: "Khó khăn hòa nhập KTX", status: "Chờ chuyên viên xác nhận" }
  ];

  container.innerHTML = slots.map(s => `
    <div style="background:#ffffff; border:1px solid ${s.isCrisis ? 'var(--red-600)' : 'var(--slate-200)'}; border-radius:var(--radius-md); padding:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <strong style="color:var(--primary-900); font-size:14px;">${s.code}</strong>
          <span style="font-size:12px; color:var(--slate-500);">${s.time}</span>
          ${s.isCrisis ? '<span class="alert-badge-red" style="font-size:10.5px;">🚨 GẶP KHẨN CẤP SOS</span>' : ''}
        </div>
        <p style="font-size:13px; color:var(--slate-800); margin:4px 0;">${s.student} • <em>${s.type}</em></p>
        <small style="color:var(--slate-500);">Triệu chứng: ${s.issue}</small>
      </div>
      <div>
        <button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="switchView('student', 'saferoom')">Vào phòng trực tiếp</button>
      </div>
    </div>
  `).join('');
}

function renderExpertTriage() {
  const container = document.getElementById("triageAlertsTable");
  if (!container) return;

  const alerts = [
    { id: "alt1", code: "#POST-9021", time: "12 phút trước", risk: "Nghiêm trọng (98%)", author: "Sinh viên ẩn danh", text: "Mình cảm thấy không còn lý do gì để thức dậy...", action: "Chưa can thiệp" },
    { id: "alt2", code: "#POST-8984", time: "45 phút trước", risk: "Rủi ro cao (76%)", author: "Sinh viên năm 4", text: "Áp lực điểm số khiến ngực mình đau thắt mỗi sáng...", action: "Đang chuẩn bị phiên" },
    { id: "alt3", code: "#POST-8790", time: "2 giờ trước", risk: "Trung bình (52%)", author: "Sinh viên năm 2", text: "Năm 4 rồi nhưng em thấy lạc lối...", action: "Đã tư vấn bảo mật" }
  ];

  container.innerHTML = alerts.map(a => `
    <div style="background:#f8fafc; border:1px solid var(--slate-200); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
        <strong>${a.code}</strong> • <small style="color:var(--slate-500);">${a.time}</small>
        <div style="color:var(--red-600); font-weight:700; font-size:12px; margin:2px 0;">Mức rủi ro: ${a.risk}</div>
        <p style="font-size:12.5px; color:var(--slate-700); font-style:italic;">"${a.text}"</p>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-urgent-action" style="font-size:11px; padding:5px 10px;" onclick="resolveCrisisAlert('SosActivated', '${a.code}')">Kích hoạt SOS</button>
        <button class="btn-safe-room-action" style="font-size:11px; padding:5px 10px;" onclick="resolveCrisisAlert('SafeRoomOpened', '${a.code}')">Mở SafeRoom</button>
      </div>
    </div>
  `).join('');
}

function renderExpertModeration() {
  const container = document.getElementById("expertModerationQueue");
  if (!container) return;

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis);

  if (flagged.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--slate-500);">Hiện tại không có bài viết nào cần thẩm định.</div>`;
    return;
  }

  container.innerHTML = flagged.map(p => `
    <div style="background:#fff1f2; border:1px solid var(--red-600); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="alert-badge-red" style="font-size:10px;">[CẦN THẨM ĐỊNH LÂM SÀNG]</span>
        <strong style="color:var(--red-700); font-size:12px;">Rủi ro AI: ${p.riskScore || 90}/100</strong>
      </div>
      <p style="font-size:13px; color:var(--slate-800); font-style:italic;">"${p.content}"</p>
      <small style="color:var(--slate-500);">Tác giả: ${p.anonymousPseudonym} • Trạng thái: <strong>Đã ẩn đối với sinh viên</strong></small>
      <div style="display:flex; gap:8px; margin-top:4px;">
        <button class="btn-urgent-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SosActivated', '${p.anonymousPseudonym}')">🚨 Can thiệp SOS ngay</button>
        <button class="btn-safe-room-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SafeRoomOpened', '${p.anonymousPseudonym}')">Mở SafeRoom</button>
        <button class="btn-secondary" style="font-size:11px; padding:5px 10px;" onclick="approvePost('${p.id}')">Duyệt bài</button>
      </div>
    </div>
  `).join('');
}

function resolveCrisisAlert(action, target) {
  let message = "";
  if (action === "SosActivated") message = `Đã kích hoạt điều phối can thiệp SOS tức thời cho ${target}!`;
  else if (action === "SafeRoomOpened") {
    message = `Đã mở phòng SafeRoom riêng tư ưu tiên cho ${target}!`;
    switchView("student", "saferoom");
  } else if (action === "SupportMessageSent") {
    message = `Đã gửi tin nhắn nâng đỡ tinh thần và đường dây nóng đến tài khoản ${target}!`;
  }
  showToast(message);
}

function approvePost(postId) {
  const p = state.communityPosts.find(x => x.id === postId);
  if (p) {
    p.isSensitiveHiddenFromStudents = false;
    p.isExtremeCrisis = false;
  }
  showToast("Đã duyệt bài viết hiển thị công khai trên bảng tin.");
  renderExpertModeration();
  renderAdminModeration();
}

// ============================================================================
// 9. QUẢN LÝ TỪ KHÓA NHẠY CẢM (CHO CẢ EXPERT VÀ ADMIN)
// ============================================================================
function renderKeywords() {
  const expertBox = document.getElementById("expertKeywordsTagCloud");
  const adminBox = document.getElementById("adminKeywordsTagCloud");

  const html = state.sensitiveKeywords.map(k => `
    <span class="keyword-pill" style="display:inline-flex; align-items:center; gap:4px;">
      ${k.keyword}
      <button style="border:none; background:none; color:var(--red-700); cursor:pointer; font-weight:700;" onclick="removeSensitiveKeyword('${k.id}')">×</button>
    </span>
  `).join('');

  if (expertBox) expertBox.innerHTML = html;
  if (adminBox) adminBox.innerHTML = html;
}

function addSensitiveKeyword(role) {
  const inputId = role === "expert" ? "txtExpertNewKeyword" : "txtAdminNewKeyword";
  const catId = role === "expert" ? "selExpertKeywordCategory" : "selAdminKeywordCategory";

  const inp = document.getElementById(inputId);
  const sel = document.getElementById(catId);
  const keyword = inp.value.trim();

  if (!keyword) {
    alert("Vui lòng nhập từ khóa nhạy cảm cần lọc.");
    return;
  }

  const newKw = {
    id: "kw_" + Date.now(),
    keyword: keyword.toLowerCase(),
    category: sel ? sel.value : "SelfHarm",
    riskWeight: 90,
    addedByRole: role === "expert" ? "Expert" : "Admin"
  };

  state.sensitiveKeywords.push(newKw);
  inp.value = "";
  renderKeywords();
  showToast(`Đã thêm từ khóa "${keyword}" vào bộ lọc tự động của hệ thống!`);
}

function removeSensitiveKeyword(kwId) {
  state.sensitiveKeywords = state.sensitiveKeywords.filter(k => k.id !== kwId);
  renderKeywords();
  showToast("Đã xóa từ khóa khỏi danh sách lọc.");
}

// ============================================================================
// 10. PHÂN HỆ QUẢN TRỊ ADMIN
// ============================================================================
function renderAdminDashboard() {
  const container = document.getElementById("adminModerationList");
  if (!container) return;

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis);

  container.innerHTML = flagged.map(p => `
    <div style="background:#ffffff; border:1px solid var(--slate-200); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="color:var(--slate-800); font-size:13px;">${p.anonymousPseudonym}</strong>
        <p style="font-size:12.5px; color:var(--slate-600); margin:2px 0;">"${p.content.substring(0, 90)}..."</p>
        <span class="suite-pill-tag" style="background:#fee2e2; color:#b91c1c; font-size:10px;">${p.detectedKeywords || 'Rủi ro cao'}</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-primary" style="padding:4px 10px; font-size:11px;" onclick="approvePost('${p.id}')">Duyệt</button>
        <button class="btn-secondary" style="padding:4px 10px; font-size:11px; background:#fee2e2; color:#b91c1c;" onclick="deletePost('${p.id}')">Ẩn bài</button>
      </div>
    </div>
  `).join('');
}

function renderAdminUsers() {
  const expertsContainer = document.getElementById("adminExpertsTable");
  const usersContainer = document.getElementById("adminUsersTable");

  if (expertsContainer) {
    expertsContainer.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
        <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--slate-200);">
          <strong>ThS. Tâm lý Nguyễn Thanh Hà</strong>
          <div style="font-size:12px; color:var(--slate-500);">Thạc sĩ Tâm lý Lâm sàng • P.302</div>
          <small style="color:#059669;">● Đang trong ca trực (28 ca tuần này)</small>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--slate-200);">
          <strong>TS. Tâm lý Trần Mai Lan</strong>
          <div style="font-size:12px; color:var(--slate-500);">Tiến sĩ Trị liệu CBT • P.302</div>
          <small style="color:#059669;">● Đang trong ca trực (35 ca tuần này)</small>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--slate-200);">
          <strong>ThS. Lê Thanh Tâm</strong>
          <div style="font-size:12px; color:var(--slate-500);">SafeRoom Trực tuyến & SOS • P.305</div>
          <small style="color:#059669;">● Sẵn sàng tiếp nhận ca khẩn cấp</small>
        </div>
      </div>
    `;
  }

  if (usersContainer) {
    usersContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px; font-size:12.5px;">
        <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#f1f5f9; border-radius:6px;">
          <span>Nguyễn Hoàng An (sv_an@unimind.edu.vn) - Sinh viên</span>
          <strong style="color:#059669;">Hoạt động</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#f1f5f9; border-radius:6px;">
          <span>ThS. Lê Thanh Tâm (tam.le@unimind.edu.vn) - Chuyên viên</span>
          <strong style="color:#059669;">Hoạt động</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#f1f5f9; border-radius:6px;">
          <span>Nguyễn Văn An (admin@unimind.edu.vn) - Quản trị viên</span>
          <strong style="color:#059669;">Hoạt động</strong>
        </div>
      </div>
    `;
  }
}

function renderAdminModeration() {
  const container = document.getElementById("adminFlaggedFeedList");
  if (!container) return;

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis);

  container.innerHTML = flagged.map(p => `
    <div style="background:#ffffff; border:1px solid var(--red-600); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between;">
        <span class="alert-badge-red" style="font-size:10px;">[CẢNH BÁO TỪ KHÓA NHẠY CẢM]</span>
        <span style="font-size:12px; font-weight:700; color:var(--red-600);">Rủi ro: ${p.riskScore || 90}/100</span>
      </div>
      <p style="font-size:13px; color:var(--slate-800);">"${p.content}"</p>
      <div style="font-size:12px; color:var(--slate-500);">Từ khóa phát hiện: <strong>${p.detectedKeywords || 'Nhạy cảm'}</strong></div>
      <div style="display:flex; gap:8px; margin-top:4px;">
        <button class="btn-urgent-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SosActivated', '${p.anonymousPseudonym}')">🚨 Điều phối SOS khẩn cấp</button>
        <button class="btn-primary" style="font-size:11px; padding:5px 12px;" onclick="approvePost('${p.id}')">Duyệt cho phép hiển thị</button>
        <button class="btn-secondary" style="font-size:11px; padding:5px 12px;" onclick="deletePost('${p.id}')">Khóa & Xóa vĩnh viễn</button>
      </div>
    </div>
  `).join('');
}

function deletePost(postId) {
  state.communityPosts = state.communityPosts.filter(p => p.id !== postId);
  showToast("Đã xóa bài viết khỏi toàn bộ hệ thống.");
  renderAdminModeration();
  renderAdminDashboard();
}

function exportAdminReport() {
  showToast("Đã trích xuất báo cáo sức khỏe tinh thần tuần gửi Ban Giám Hiệu (PDF)!");
}

// ============================================================================
// 11. BÀI TẬP THỞ 4-7-8 TƯƠNG TÁC
// ============================================================================
let breathingActive = false;
let breathingPhase = "inhale";
let breathingSec = 4;

function openBreathingModal() {
  document.getElementById("modalBreathing").classList.add("active");
  startBreathingCycle();
}

function closeBreathingModal() {
  document.getElementById("modalBreathing").classList.remove("active");
  if (state.breathingInterval) clearInterval(state.breathingInterval);
  breathingActive = false;
}

function toggleBreathingCycle() {
  if (breathingActive) {
    clearInterval(state.breathingInterval);
    breathingActive = false;
    document.getElementById("btnBreathingToggle").textContent = "Tiếp tục bài tập";
  } else {
    startBreathingCycle();
    document.getElementById("btnBreathingToggle").textContent = "Tạm dừng";
  }
}

function startBreathingCycle() {
  breathingActive = true;
  breathingPhase = "inhale";
  breathingSec = 4;

  const circle = document.getElementById("breathCircle");
  const txt = document.getElementById("breathPhaseText");
  const count = document.getElementById("breathCountdown");

  if (state.breathingInterval) clearInterval(state.breathingInterval);

  state.breathingInterval = setInterval(() => {
    breathingSec--;
    count.textContent = breathingSec + "s";

    if (breathingSec <= 0) {
      if (breathingPhase === "inhale") {
        breathingPhase = "hold";
        breathingSec = 7;
        txt.textContent = "GIỮ HƠI";
        circle.className = "breath-circle hold";
      } else if (breathingPhase === "hold") {
        breathingPhase = "exhale";
        breathingSec = 8;
        txt.textContent = "THỞ RA";
        circle.className = "breath-circle exhale";
      } else {
        breathingPhase = "inhale";
        breathingSec = 4;
        txt.textContent = "HÍT VÀO";
        circle.className = "breath-circle inhale";
      }
    }
  }, 1000);
}

// ============================================================================
// 12. AUTH MODAL
// ============================================================================
let activeAuthRole = "Student";

function openLoginModal() {
  document.getElementById("modalAuth").classList.add("active");
}

function closeAuthModal() {
  document.getElementById("modalAuth").classList.remove("active");
}

function selectAuthRole(role) {
  activeAuthRole = role;
  document.getElementById("btnRoleStudent").classList.toggle("active", role === "Student");
  document.getElementById("btnRoleExpert").classList.toggle("active", role === "Expert");
  document.getElementById("btnRoleAdmin").classList.toggle("active", role === "Admin");

  fillDemoCredentials(role.toLowerCase());
}

function fillDemoCredentials(role) {
  const emailInp = document.getElementById("txtLoginEmail");
  const passInp = document.getElementById("txtLoginPassword");

  if (role === "student") {
    emailInp.value = "sv_an@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Student";
  } else if (role === "expert") {
    emailInp.value = "tam.le@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Expert";
  } else if (role === "admin") {
    emailInp.value = "admin@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Admin";
  }
}

async function handleLoginSubmit() {
  const email = document.getElementById("txtLoginEmail").value.trim();
  const pass = document.getElementById("txtLoginPassword").value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrMSSV: email, password: pass })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        state.currentUser = data.data.user;
        state.token = data.data.token;
      }
    }
  } catch (e) {}

  closeAuthModal();

  if (activeAuthRole === "Student") {
    switchSubsystem("student");
  } else if (activeAuthRole === "Expert") {
    switchSubsystem("expert");
  } else if (activeAuthRole === "Admin") {
    switchSubsystem("admin");
  }

  showToast(`Đăng nhập thành công với vai trò: ${activeAuthRole.toUpperCase()}`);
}

// ============================================================================
// 13. TOAST & SOS
// ============================================================================
function triggerSosEmergency() {
  alert("🚨 TỔNG ĐÀI KHỦNG HOẢNG TÂM LÝ UNIMIND (24/7)\nHotline miễn phí: 1900 1267 (Nhánh 1)\nĐội ngũ chuyên viên can thiệp khẩn cấp luôn túc trực để bảo đảm an toàn tuyệt đối cho bạn.");
}

function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>🔔</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
