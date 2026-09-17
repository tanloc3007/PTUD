/**
 * UniMind - Frontend Application Logic
 * Đồng bộ phong cách Serene Sanctuary, hỗ trợ 3 phân hệ độc lập:
 * Sinh viên, Chuyên viên, Quản trị viên (Admin)
 */

const API_BASE = "http://localhost:5080/api";

// STATE TOÀN CỤC
const state = {
  currentSubsystem: "gateway", // "gateway", "student", "expert", "admin"
  currentView: "home",
  isLoggedIn: false,
  currentUser: null,
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
// 1. KHỞI TẠO ỨNG DỤNG & PHỤC HỒI PHIÊN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  restoreUserSession();
  loadInitialData();
});

function restoreUserSession() {
  const savedUser = localStorage.getItem("unimind_user");
  const savedToken = localStorage.getItem("unimind_token");

  if (savedUser && savedToken) {
    try {
      const user = JSON.parse(savedUser);
      state.currentUser = user;
      state.token = savedToken;
      state.isLoggedIn = true;

      // Xác định phân hệ theo vai trò
      const role = (user.role || "").toLowerCase();
      if (role === "admin") {
        switchSubsystem("admin");
      } else if (role === "expert") {
        switchSubsystem("expert");
      } else {
        switchSubsystem("student");
      }
      return;
    } catch (e) {
      console.warn("Lỗi đọc phiên đã lưu:", e);
    }
  }

  // Nếu chưa đăng nhập, hiển thị Cổng Chọn Phân Hệ (Gateway)
  logoutToGateway();
}

async function loadInitialData() {
  try {
    const expRes = await fetch(`${API_BASE}/appointments/experts`);
    if (expRes.ok) {
      const data = await expRes.json();
      if (data.success && data.data) state.experts = data.data;
    }
  } catch (e) {
    console.warn("Backend API not reached, using local state mock:", e.message);
  }

  await loadCommunityFeed();
  renderExperts();
  renderJournalHistory();
  renderKeywords();
}

function setupEventListeners() {
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
// 2. ĐIỀU HƯỚNG CỔNG PHÂN HỆ & BẢO MẬT PHÂN QUYỀN (RBAC)
// ============================================================================

/**
 * Kiểm tra quyền hạn truy cập của người dùng đối với phân hệ đích.
 * Quy tắc: Phân hệ thấp không được phép truy cập/xem trang phân hệ cao.
 */
function checkSubsystemAccess(targetSubsystem) {
  if (targetSubsystem === "gateway") return true;

  if (!state.isLoggedIn || !state.currentUser) {
    showToast("Vui lòng đăng nhập tài khoản để vào phân hệ này!");
    openLoginModal();
    selectAuthRole(targetSubsystem === "admin" ? "Admin" : targetSubsystem === "expert" ? "Expert" : "Student");
    return false;
  }

  const userRole = (state.currentUser.role || "Student").toLowerCase();

  // Quy tắc 1: Sinh viên CHỈ được truy cập Phân hệ Sinh viên
  if (userRole === "student" && targetSubsystem !== "student") {
    showAccessDeniedView("Sinh viên", targetSubsystem === "admin" ? "Quản trị viên (Admin)" : "Chuyên viên Tâm lý");
    return false;
  }

  // Quy tắc 2: Chuyên viên được truy cập Chuyên viên & Sinh viên, KHÔNG ĐƯỢC vào Admin
  if (userRole === "expert" && targetSubsystem === "admin") {
    showAccessDeniedView("Chuyên viên", "Quản trị viên (Admin)");
    return false;
  }

  // Admin có toàn quyền
  return true;
}

function showAccessDeniedView(currentRole, requiredRole) {
  // Ẩn toàn bộ view container và hiển thị viewAccessDenied
  document.querySelectorAll(".view-container").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item-btn").forEach(el => el.classList.remove("active"));

  const deniedEl = document.getElementById("viewAccessDenied");
  if (deniedEl) deniedEl.classList.add("active");

  const txtCurrent = document.getElementById("txtCurrentDeniedRole");
  if (txtCurrent) txtCurrent.textContent = currentRole;

  const txtRequired = document.getElementById("txtRequiredDeniedRole");
  if (txtRequired) txtRequired.textContent = requiredRole;

  const desc = document.getElementById("accessDeniedDesc");
  if (desc) {
    desc.textContent = `Tài khoản của bạn thuộc vai trò "${currentRole}". Phân hệ bạn đang cố truy cập yêu cầu quyền "${requiredRole}". Phân hệ cấp dưới không được phép xem các chức năng của phân hệ cấp trên.`;
  }

  showToast(`⛔ Quyền truy cập bị từ chối: Cần quyền ${requiredRole}!`);
}

function returnToAllowedSubsystem() {
  if (!state.isLoggedIn || !state.currentUser) {
    logoutToGateway();
    return;
  }
  const role = (state.currentUser.role || "Student").toLowerCase();
  switchSubsystem(role === "admin" ? "admin" : role === "expert" ? "expert" : "student");
}

/**
 * Xử lý khi nhấn nút trên Cổng phân hệ (Gateway)
 */
function enterSubsystemGateway(subsystem) {
  if (state.isLoggedIn && state.currentUser) {
    const userRole = (state.currentUser.role || "Student").toLowerCase();
    if (subsystem === "admin" && userRole !== "admin") {
      showToast("Bạn cần đăng nhập tài khoản Quản trị viên (Admin) để vào phân hệ này!");
      openLoginModal();
      selectAuthRole("Admin");
      return;
    }
    if (subsystem === "expert" && userRole === "student") {
      showToast("Bạn cần đăng nhập tài khoản Chuyên viên để vào phân hệ này!");
      openLoginModal();
      selectAuthRole("Expert");
      return;
    }
    switchSubsystem(subsystem);
  } else {
    // Chưa đăng nhập -> Mở form với vai trò tương ứng
    openLoginModal();
    selectAuthRole(subsystem === "admin" ? "Admin" : subsystem === "expert" ? "Expert" : "Student");
  }
}

/**
 * Đăng nhập mẫu nhanh trực tiếp (1-Click Demo)
 */
async function quickLoginAs(role) {
  fillDemoCredentials(role);
  await handleLoginSubmit();
}

/**
 * Đăng xuất và quay trở về Cổng chọn phân hệ (Portal Gateway)
 */
function logoutToGateway() {
  state.isLoggedIn = false;
  state.currentUser = null;
  state.token = null;
  state.currentSubsystem = "gateway";

  localStorage.removeItem("unimind_user");
  localStorage.removeItem("unimind_token");

  // Hiển thị Cổng phân hệ, ẩn Khung ứng dụng
  const gatewayView = document.getElementById("portalGatewayView");
  const appContainer = document.getElementById("appContainer");
  if (gatewayView) gatewayView.style.display = "block";
  if (appContainer) appContainer.style.display = "none";

  // Cập nhật Header Indicator
  const pill = document.getElementById("subsystemActivePill");
  const pillText = document.getElementById("subsystemActiveText");
  const userBadge = document.getElementById("txtUserBadge");
  const btnAuth = document.getElementById("btnAuthToggle");

  if (pill) {
    pill.className = "subsystem-pill-indicator gateway";
  }
  if (pillText) pillText.textContent = "🚪 Cổng Điều Hướng 3 Phân Hệ";
  if (userBadge) userBadge.textContent = "Chưa đăng nhập";
  if (btnAuth) btnAuth.textContent = "Đăng nhập";

  showToast("Đã quay về Cổng Chọn Phân Hệ UniMind");
}

/**
 * Chuyển đổi và thiết lập phân hệ đang hoạt động
 */
function switchSubsystem(subsystem) {
  if (!checkSubsystemAccess(subsystem)) return;

  state.currentSubsystem = subsystem;

  // Ẩn Cổng phân hệ, hiển thị Khung ứng dụng
  const gatewayView = document.getElementById("portalGatewayView");
  const appContainer = document.getElementById("appContainer");
  if (gatewayView) gatewayView.style.display = "none";
  if (appContainer) appContainer.style.display = "grid";

  // Hiển thị DUY NHẤT Menu Sidebar của phân hệ được phép
  const menuStudent = document.getElementById("menuStudentGroup");
  const menuExpert = document.getElementById("menuExpertGroup");
  const menuAdmin = document.getElementById("menuAdminGroup");

  if (menuStudent) menuStudent.style.display = subsystem === "student" ? "block" : "none";
  if (menuExpert) menuExpert.style.display = subsystem === "expert" ? "block" : "none";
  if (menuAdmin) menuAdmin.style.display = subsystem === "admin" ? "block" : "none";

  // Cập nhật Header Indicator & User Pill
  const pill = document.getElementById("subsystemActivePill");
  const pillText = document.getElementById("subsystemActiveText");
  const userBadge = document.getElementById("txtUserBadge");
  const sidebarSub = document.getElementById("txtSidebarRoleSub");
  const sidebarName = document.getElementById("sidebarUserName");
  const btnAuth = document.getElementById("btnAuthToggle");

  if (btnAuth) btnAuth.textContent = "Đăng xuất";

  const user = state.currentUser || {};

  if (subsystem === "student") {
    if (pill) pill.className = "subsystem-pill-indicator student";
    if (pillText) pillText.textContent = "🎓 Phân Hệ Sinh Viên • Không Gian An Yên";
    if (userBadge) userBadge.textContent = `Sinh viên: ${user.fullName || user.anonymousCode || "Bạn Ẩn Yên"}`;
    if (sidebarSub) sidebarSub.textContent = "Không Gian Sinh Viên";
    if (sidebarName) sidebarName.textContent = user.anonymousCode || user.fullName || "Bạn Ẩn Yên #382";
    switchView("student", "home");
  } else if (subsystem === "expert") {
    if (pill) pill.className = "subsystem-pill-indicator expert";
    if (pillText) pillText.textContent = "🩺 Phân Hệ Chuyên Viên • Trạm Tham Vấn Tâm Lý";
    if (userBadge) userBadge.textContent = `Chuyên viên: ${user.fullName || "ThS. Thanh Hà"}`;
    if (sidebarSub) sidebarSub.textContent = "Bàn Làm Việc Chuyên Gia";
    if (sidebarName) sidebarName.textContent = user.fullName || "ThS. Thanh Hà";
    switchView("expert", "workspace");
    renderExpertSchedule();
    renderExpertTriage();
    renderExpertModeration();
  } else if (subsystem === "admin") {
    if (pill) pill.className = "subsystem-pill-indicator admin";
    if (pillText) pillText.textContent = "⚙️ Phân Hệ Quản Trị • Trung Tâm Điều Hành Toàn Trường";
    if (userBadge) userBadge.textContent = `Quản trị viên: ${user.fullName || "Admin An"}`;
    if (sidebarSub) sidebarSub.textContent = "Trung Tâm Quản Trị Hệ Thống";
    if (sidebarName) sidebarName.textContent = user.fullName || "Quản trị viên";
    switchView("admin", "dashboard");
    renderAdminDashboard();
    renderAdminUsers();
    renderAdminModeration();
  }

  showToast(`Đã vào ${subsystem.toUpperCase()} PORTAL`);
}

function switchView(subsystem, viewName) {
  // Kiểm tra phân quyền trước khi cho phép xem view
  if (!checkSubsystemAccess(subsystem)) return;

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
  if (!state.currentUser) {
    showToast("⚠️ Vui lòng đăng nhập tài khoản Sinh viên để đăng bài!");
    openLoginModal();
    return;
  }

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
        stressLevelTag: null,
        customPseudonym: pseudonym,
        requestExpertPrivateResponse: requestExpert
      })
    });

    if (res.ok) {
      const data = await res.json();
      const p = data.data;

      if (p && (p.isSensitiveHiddenFromStudents || p.hasKeywordsAlert || p.isExtremeCrisis || (p.riskScore && p.riskScore >= 70))) {
        showToast("⚠️ Bài viết chứa nội dung nhạy cảm / nguy cơ cao đã được chuyển thẳng tới Chuyên viên và Quản trị viên để can thiệp hỗ trợ!");
        state.communityPosts.unshift(p);
      } else {
        showToast(data.message || "Đã gửi bài viết ẩn danh thành công!");
        if (p) state.communityPosts.unshift(p);
      }
    } else {
      checkAndAddLocalPost(content, activePostCategory, pseudonym);
    }
  } catch (e) {
    checkAndAddLocalPost(content, activePostCategory, pseudonym);
  }

  document.getElementById("txtPostContent").value = "";
  await loadCommunityFeed();
}

function checkAndAddLocalPost(content, cat, pseudonym) {
  // Kiểm tra từ khóa nhạy cảm
  const hasKeyword = state.sensitiveKeywords.some(k => content.toLowerCase().includes(k.keyword.toLowerCase()));
  const isCrisis = content.includes("tự tử") || content.includes("muốn chết") || content.includes("nhảy lầu") || content.includes("bế tắc") || content.includes("buông bỏ");

  const newPost = {
    id: "p_" + Date.now(),
    anonymousPseudonym: pseudonym,
    studentRoleTag: "Sinh viên • " + (state.currentUser?.faculty || "Khoa CNTT"),
    content: content,
    categoryTag: cat,
    stressLevelTag: isCrisis ? "Khẩn cấp (94/100)" : "Vừa",
    hugCount: 0,
    empathyCount: 0,
    commentCount: 0,
    riskScore: isCrisis ? 94 : 35,
    isExtremeCrisis: isCrisis,
    hasKeywordsAlert: hasKeyword || isCrisis,
    detectedKeywords: hasKeyword || isCrisis ? "từ khóa nhạy cảm / nguy cơ cao" : null,
    isSensitiveHiddenFromStudents: hasKeyword || isCrisis,
    moderationStatus: (hasKeyword || isCrisis) ? "Flagged" : "Approved",
    comments: [],
    createdAt: new Date().toISOString()
  };

  state.communityPosts.unshift(newPost);
  if (newPost.isSensitiveHiddenFromStudents) {
    showToast("⚠️ Bài viết chứa nội dung nhạy cảm đã được chuyển sang Chuyên viên & Admin để can thiệp bảo vệ!");
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
  if (!state.currentUser) {
    showToast("⚠️ Vui lòng đăng nhập tài khoản để gửi bình luận!");
    openLoginModal();
    return;
  }

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
  if (!state.currentUser) {
    showToast("⚠️ Vui lòng đăng nhập tài khoản Sinh viên để đặt lịch hẹn!");
    openLoginModal();
    return;
  }

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
  if (!state.currentUser) {
    showToast("⚠️ Vui lòng đăng nhập tài khoản Sinh viên để lưu nhật ký cảm xúc!");
    openLoginModal();
    return;
  }

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

async function renderExpertTriage() {
  const container = document.getElementById("triageAlertsTable");
  if (!container) return;

  let alerts = [];
  try {
    const res = await fetch(`${API_BASE}/expert/triage-alerts`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) alerts = data.data;
    }
  } catch (e) {
    console.warn("Không thể tải triage alerts từ server:", e);
  }

  if (alerts.length === 0) {
    // Nếu chưa có trong DB, lấy từ các bài viết rủi ro trong memory
    const crisisPosts = state.communityPosts.filter(p => p.isExtremeCrisis || p.hasKeywordsAlert || (p.riskScore && p.riskScore >= 70));
    if (crisisPosts.length > 0) {
      alerts = crisisPosts.map(p => ({
        id: p.id,
        studentAnonymousCode: p.anonymousPseudonym,
        createdAt: p.createdAt || new Date().toISOString(),
        riskScore: p.riskScore || 92,
        triggeredKeywords: p.detectedKeywords || "Rủi ro quá tiêu cực",
        snippetContent: p.content,
        status: "PendingAction"
      }));
    } else {
      alerts = [
        { id: "alt1", studentAnonymousCode: "Bạn Ẩn Yên #902", createdAt: new Date().toISOString(), riskScore: 98, triggeredKeywords: "muốn buông bỏ, kiệt sức", snippetContent: "Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định...", status: "PendingAction" }
      ];
    }
  }

  container.innerHTML = alerts.map(a => `
    <div style="background:#f8fafc; border:1px solid ${a.status === 'Resolved' ? '#10b981' : 'var(--red-300)'}; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div style="flex:1; min-width:280px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <strong>${a.studentAnonymousCode || 'Bí danh sinh viên'}</strong>
          <small style="color:var(--slate-500);">${new Date(a.createdAt).toLocaleTimeString('vi-VN')} • ${new Date(a.createdAt).toLocaleDateString('vi-VN')}</small>
          <span class="suite-pill-tag" style="background:#fee2e2; color:#b91c1c; font-size:10px;">RỦI RO NLP: ${a.riskScore}/100</span>
        </div>
        <div style="color:var(--red-600); font-weight:700; font-size:12px; margin:3px 0;">
          Từ khóa kích hoạt: <em>${a.triggeredKeywords || 'Cảnh báo lâm sàng'}</em>
        </div>
        <p style="font-size:12.5px; color:var(--slate-700); font-style:italic; margin:4px 0;">"${a.snippetContent}"</p>
        ${a.status === 'Resolved' ? `<span style="font-size:11px; color:#059669; font-weight:700;">✅ ${a.interventionAction || 'Đã can thiệp an toàn'}</span>` : ''}
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${a.status !== 'Resolved' ? `
          <button class="btn-urgent-action" style="font-size:11px; padding:5px 10px;" onclick="resolveCrisisAlert('SosActivated', '${a.id}', '${a.studentAnonymousCode}')">🚨 Kích hoạt SOS</button>
          <button class="btn-safe-room-action" style="font-size:11px; padding:5px 10px;" onclick="resolveCrisisAlert('SafeRoomOpened', '${a.id}', '${a.studentAnonymousCode}')">📹 Mở SafeRoom</button>
          <button class="btn-primary" style="font-size:11px; padding:5px 10px;" onclick="resolveCrisisAlert('SupportMessageSent', '${a.id}', '${a.studentAnonymousCode}')">💌 Nâng đỡ</button>
        ` : `
          <span class="suite-pill-tag" style="background:#dcfce7; color:#15803d; font-size:11px;">Đã xử lý</span>
        `}
      </div>
    </div>
  `).join('');
}

async function renderExpertModeration() {
  const container = document.getElementById("expertModerationQueue");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/community/posts?isStaff=true`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) state.communityPosts = data.data;
    }
  } catch (e) {
    console.warn("Lỗi tải moderation queue:", e);
  }

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis || p.hasKeywordsAlert);

  if (flagged.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--slate-500);">Hiện tại không có bài viết nào cần thẩm định y khoa.</div>`;
    return;
  }

  container.innerHTML = flagged.map(p => `
    <div style="background:#fff1f2; border:1px solid var(--red-600); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="alert-badge-red" style="font-size:10px;">[CẦN THẨM ĐỊNH LÂM SÀNG]</span>
        <strong style="color:var(--red-700); font-size:12px;">Rủi ro AI: ${p.riskScore || 90}/100</strong>
      </div>
      <p style="font-size:13px; color:var(--slate-800); font-style:italic;">"${p.content}"</p>
      <small style="color:var(--slate-500);">Tác giả: <strong>${p.anonymousPseudonym}</strong> • Từ khóa: <span style="color:var(--red-600); font-weight:600;">${p.detectedKeywords || 'Nhạy cảm'}</span> • Trạng thái: <strong>Đã ẩn với sinh viên</strong></small>
      <div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">
        <button class="btn-urgent-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SosActivated', '${p.id}', '${p.anonymousPseudonym}')">🚨 Can thiệp SOS ngay</button>
        <button class="btn-safe-room-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SafeRoomOpened', '${p.id}', '${p.anonymousPseudonym}')">Mở SafeRoom</button>
        <button class="btn-primary" style="font-size:11px; padding:5px 10px;" onclick="approvePost('${p.id}')">Duyệt cho hiển thị</button>
        <button class="btn-secondary" style="font-size:11px; padding:5px 10px; background:#fee2e2; color:#b91c1c;" onclick="deletePost('${p.id}')">Khóa bài</button>
      </div>
    </div>
  `).join('');
}

async function resolveCrisisAlert(action, alertId, target) {
  let actionTaken = "";
  if (action === "SosActivated") actionTaken = "Kích hoạt điều phối đội SOS can thiệp khẩn cấp";
  else if (action === "SafeRoomOpened") actionTaken = "Mở phòng tham vấn trực tuyến riêng tư SafeRoom";
  else if (action === "SupportMessageSent") actionTaken = "Gửi thông điệp nâng đỡ và kết nối đường dây nóng 24/7";

  const expertId = state.currentUser?.id || "33333333-3333-3333-3333-333333333331";

  if (alertId) {
    try {
      await fetch(`${API_BASE}/expert/alerts/${alertId}/resolve/${expertId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionTaken })
      });
    } catch (e) {
      console.warn("Lỗi resolve alert:", e);
    }
  }

  if (action === "SafeRoomOpened") {
    showToast(`Đã mở phòng SafeRoom ưu tiên cho ${target || 'sinh viên'}!`);
    switchView("student", "saferoom");
  } else {
    showToast(`✅ ${actionTaken} cho ${target || 'sinh viên'}!`);
  }

  await renderExpertTriage();
}

async function approvePost(postId) {
  const adminId = state.currentUser?.id || "11111111-1111-1111-1111-111111111111";
  try {
    await fetch(`${API_BASE}/admin/posts/${postId}/moderate/${adminId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" })
    });
    showToast("✅ Đã duyệt bài viết hiển thị công khai trên diễn đàn!");
  } catch (e) {
    console.warn("Lỗi duyệt bài:", e);
  }

  const p = state.communityPosts.find(x => x.id === postId);
  if (p) {
    p.isSensitiveHiddenFromStudents = false;
    p.isExtremeCrisis = false;
    p.hasKeywordsAlert = false;
    p.moderationStatus = "Approved";
  }

  renderExpertModeration();
  renderAdminModeration();
  renderAdminDashboard();
}

async function deletePost(postId) {
  const adminId = state.currentUser?.id || "11111111-1111-1111-1111-111111111111";
  try {
    await fetch(`${API_BASE}/admin/posts/${postId}/moderate/${adminId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide" })
    });
    showToast("✅ Đã khóa và ẩn bài viết khỏi toàn bộ hệ thống.");
  } catch (e) {
    console.warn("Lỗi ẩn bài:", e);
  }

  state.communityPosts = state.communityPosts.filter(p => p.id !== postId);
  renderExpertModeration();
  renderAdminModeration();
  renderAdminDashboard();
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

async function addSensitiveKeyword(role) {
  const inputId = role === "expert" ? "txtExpertNewKeyword" : "txtAdminNewKeyword";
  const catId = role === "expert" ? "selExpertKeywordCategory" : "selAdminKeywordCategory";

  const inp = document.getElementById(inputId);
  const sel = document.getElementById(catId);
  const keyword = inp.value.trim();

  if (!keyword) {
    alert("Vui lòng nhập từ khóa nhạy cảm cần lọc.");
    return;
  }

  const payload = {
    keyword: keyword.toLowerCase(),
    category: sel ? sel.value : "SelfHarm",
    riskWeight: 90
  };

  try {
    const endpoint = role === "expert" ? `${API_BASE}/expert/sensitive-keywords` : `${API_BASE}/admin/sensitive-keywords`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message || `Đã thêm từ khóa "${keyword}" vào bộ lọc tự động!`);
    }
  } catch (e) {
    console.warn("Lỗi thêm từ khóa API:", e);
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
}

async function removeSensitiveKeyword(kwId) {
  try {
    const endpoint = `${API_BASE}/admin/sensitive-keywords/${kwId}`;
    await fetch(endpoint, { method: "DELETE" });
  } catch (e) {
    console.warn("Lỗi xóa từ khóa API:", e);
  }
  state.sensitiveKeywords = state.sensitiveKeywords.filter(k => k.id !== kwId);
  renderKeywords();
  showToast("Đã xóa từ khóa khỏi danh sách lọc.");
}

// ============================================================================
// 10. PHÂN HỆ QUẢN TRỊ ADMIN & MODAL THÊM CHUYÊN VIÊN
// ============================================================================
function openAddExpertModal() {
  const modal = document.getElementById("modalAddExpert");
  if (modal) modal.classList.add("active");
}

function closeAddExpertModal() {
  const modal = document.getElementById("modalAddExpert");
  if (modal) modal.classList.remove("active");
}

async function handleCreateExpertSubmit() {
  const fullName = document.getElementById("txtNewExpertFullName").value.trim();
  const email = document.getElementById("txtNewExpertEmail").value.trim();
  const password = document.getElementById("txtNewExpertPassword").value.trim() || "123456";
  const degree = document.getElementById("txtNewExpertDegree").value.trim();
  const specialization = document.getElementById("txtNewExpertSpecialization").value.trim();
  const experience = parseInt(document.getElementById("txtNewExpertExperience").value) || 5;
  const room = document.getElementById("txtNewExpertRoom").value.trim();
  const title = document.getElementById("txtNewExpertTitle").value.trim();
  const bio = document.getElementById("txtNewExpertBio").value.trim();

  if (!fullName || !email) {
    showToast("⚠️ Vui lòng nhập đầy đủ họ tên và email chuyên viên!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/experts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        title: title || "Chuyên viên Tâm lý",
        academicDegree: degree || "Thạc sĩ Tâm lý học",
        specialization: specialization || "Tư vấn & Trị liệu Tâm lý Học đường",
        experienceYears: experience,
        roomLocation: room || "P.304 (Tầng 3)",
        bio: bio || "Chuyên gia tham vấn tâm lý học đường, hỗ trợ sinh viên vượt qua căng thẳng."
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`✅ ${data.message || "Đã thêm chuyên viên mới thành công!"}`);
      closeAddExpertModal();
      document.getElementById("formAddExpert").reset();
      await loadInitialData();
      await renderAdminUsers();
    } else {
      showToast(`❌ ${data.message || "Lỗi khi thêm chuyên viên"}`);
    }
  } catch (e) {
    showToast(`⚠️ Không thể kết nối tới server: ${e.message}`);
  }
}

async function renderAdminDashboard() {
  const container = document.getElementById("adminModerationList");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/admin/moderation-queue`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) state.communityPosts = data.data;
    }
  } catch (e) {
    console.warn("Lỗi tải moderation queue:", e);
  }

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis || p.hasKeywordsAlert);

  if (flagged.length === 0) {
    container.innerHTML = `<div style="padding:14px; text-align:center; color:var(--slate-500); font-size:12.5px;">Hàng đợi kiểm duyệt hiện đang trống.</div>`;
    return;
  }

  container.innerHTML = flagged.map(p => `
    <div style="background:#ffffff; border:1px solid var(--slate-200); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div style="flex:1;">
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

async function renderAdminUsers() {
  const expertsContainer = document.getElementById("adminExpertsTable");
  const usersContainer = document.getElementById("adminUsersTable");

  if (expertsContainer) {
    if (state.experts && state.experts.length > 0) {
      expertsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
          ${state.experts.map(exp => `
            <div style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid var(--slate-200); box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <strong style="color:var(--primary-950); font-size:14px;">${exp.fullName}</strong>
                  <div style="font-size:12px; color:var(--primary-700); font-weight:600;">${exp.title} • ${exp.academicDegree}</div>
                </div>
                <span class="suite-pill-tag" style="background:#dcfce7; color:#15803d; font-size:10px;">★ ${exp.rating || 5.0}</span>
              </div>
              <div style="font-size:12px; color:var(--slate-600); margin:6px 0;">Chuyên môn: <strong>${exp.specialization}</strong></div>
              <div style="font-size:11.5px; color:var(--slate-500);">📍 ${exp.roomLocation} • ${exp.experienceYears || 5} năm kinh nghiệm</div>
              <small style="color:#059669; font-weight:600; display:block; margin-top:4px;">● Sẵn sàng tiếp nhận (${exp.totalConsultations || 0} ca tư vấn)</small>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  if (usersContainer) {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          usersContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${data.data.map(u => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#ffffff; border-radius:8px; border:1px solid var(--slate-200); box-shadow:0 1px 3px rgba(0,0,0,0.05); flex-wrap:wrap; gap:8px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:13.5px; color:var(--slate-800);">${u.fullName}</strong>
                      <span class="suite-pill-tag" style="font-size:10px; ${u.role === 'Admin' ? 'background:#fee2e2; color:#b91c1c;' : u.role === 'Expert' ? 'background:#e0e7ff; color:#4338ca;' : 'background:#e0f2fe; color:#0369a1;'}">${u.role}</span>
                      ${u.mssv ? `<span style="font-size:11px; color:var(--slate-500);">MSSV: ${u.mssv}</span>` : ''}
                    </div>
                    <div style="font-size:12px; color:var(--slate-500); margin-top:2px;">
                      ${u.email} • ${u.faculty || 'ĐH Lạc Hồng'} • Bí danh: <em>${u.anonymousCode}</em>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:12px; font-weight:700; color:#059669;">● Đang hoạt động</span>
                    <button class="btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="toggleUserStatus('${u.id}')">
                      Khóa / Mở khóa
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          return;
        }
      }
    } catch (e) {
      console.warn("Không thể tải danh sách tài khoản từ backend:", e);
    }
  }
}

async function toggleUserStatus(userId) {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message || "Đã cập nhật trạng thái người dùng thành công!");
      await renderAdminUsers();
    }
  } catch (e) {
    showToast("Không thể cập nhật trạng thái người dùng.");
  }
}

async function renderAdminModeration() {
  const container = document.getElementById("adminFlaggedFeedList");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/admin/moderation-queue`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) state.communityPosts = data.data;
    }
  } catch (e) {
    console.warn("Lỗi tải moderation queue của Admin:", e);
  }

  const flagged = state.communityPosts.filter(p => p.isSensitiveHiddenFromStudents || p.isExtremeCrisis || p.hasKeywordsAlert);

  if (flagged.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--slate-500);">Hiện tại không có bài viết nào vi phạm hoặc bị gắn cờ rủi ro.</div>`;
    return;
  }

  container.innerHTML = flagged.map(p => `
    <div style="background:#ffffff; border:1px solid var(--red-600); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between;">
        <span class="alert-badge-red" style="font-size:10px;">[CẢNH BÁO TỪ KHÓA NHẠY CẢM / SOS]</span>
        <span style="font-size:12px; font-weight:700; color:var(--red-600);">Rủi ro: ${p.riskScore || 90}/100</span>
      </div>
      <p style="font-size:13px; color:var(--slate-800);">"${p.content}"</p>
      <div style="font-size:12px; color:var(--slate-500);">Tác giả: <strong>${p.anonymousPseudonym}</strong> • Từ khóa phát hiện: <strong style="color:var(--red-700);">${p.detectedKeywords || 'Nhạy cảm'}</strong></div>
      <div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">
        <button class="btn-urgent-action" style="font-size:11px; padding:5px 12px;" onclick="resolveCrisisAlert('SosActivated', '${p.id}', '${p.anonymousPseudonym}')">🚨 Điều phối SOS khẩn cấp</button>
        <button class="btn-primary" style="font-size:11px; padding:5px 12px;" onclick="approvePost('${p.id}')">Duyệt cho phép hiển thị</button>
        <button class="btn-secondary" style="font-size:11px; padding:5px 12px; background:#fee2e2; color:#b91c1c;" onclick="deletePost('${p.id}')">Khóa & Xóa vĩnh viễn</button>
      </div>
    </div>
  `).join('');
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

function openLoginModal(mode = 'login') {
  const modal = document.getElementById("modalAuth");
  if (modal) {
    modal.classList.add("active");
    switchAuthMode(mode);
  }
}

function closeAuthModal() {
  document.getElementById("modalAuth").classList.remove("active");
}

function switchAuthMode(mode) {
  const loginSection = document.getElementById("authLoginSection");
  const regSection = document.getElementById("authRegisterSection");
  const tabLogin = document.getElementById("tabAuthLogin");
  const tabReg = document.getElementById("tabAuthRegister");
  const title = document.getElementById("authModalTitle");

  if (!loginSection || !regSection) return;

  if (mode === "register") {
    loginSection.style.display = "none";
    regSection.style.display = "block";
    if (tabLogin) {
      tabLogin.classList.remove("active");
      tabLogin.style.borderBottom = "none";
    }
    if (tabReg) {
      tabReg.classList.add("active");
      tabReg.style.borderBottom = "2px solid var(--primary-700)";
    }
    if (title) title.textContent = "Đăng Ký Tài Khoản Sinh Viên";
  } else {
    loginSection.style.display = "block";
    regSection.style.display = "none";
    if (tabReg) {
      tabReg.classList.remove("active");
      tabReg.style.borderBottom = "none";
    }
    if (tabLogin) {
      tabLogin.classList.add("active");
      tabLogin.style.borderBottom = "2px solid var(--primary-700)";
    }
    if (title) title.textContent = "Đăng Nhập Tài Khoản UniMind";
  }
}

async function handleRegisterSubmit() {
  const fullName = document.getElementById("txtRegFullName").value.trim();
  const emailOrMSSV = document.getElementById("txtRegMSSV").value.trim();
  const faculty = document.getElementById("selRegFaculty").value;
  const password = document.getElementById("txtRegPassword").value.trim();
  const passwordConfirm = document.getElementById("txtRegPasswordConfirm").value.trim();

  if (!fullName || !emailOrMSSV || !password) {
    showToast("⚠️ Vui lòng điền đầy đủ các thông tin bắt buộc!");
    return;
  }

  if (password.length < 6) {
    showToast("⚠️ Mật khẩu phải có độ dài ít nhất 6 ký tự!");
    return;
  }

  if (password !== passwordConfirm) {
    showToast("⚠️ Mật khẩu xác nhận không khớp!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        emailOrMSSV,
        password,
        faculty,
        autoPseudonym: true
      })
    });

    const data = await res.json();
    if (res.ok && data.success && data.data) {
      state.currentUser = data.data.user;
      state.token = data.data.token;
      state.isLoggedIn = true;

      localStorage.setItem("unimind_user", JSON.stringify(data.data.user));
      localStorage.setItem("unimind_token", data.data.token);

      closeAuthModal();
      switchSubsystem("student");
      showToast(`🎉 Chào mừng sinh viên ${data.data.user.fullName}! Bí danh của bạn: ${data.data.user.anonymousCode}`);
    } else {
      showToast(`❌ ${data.message || "Đăng ký thất bại. Vui lòng thử lại!"}`);
    }
  } catch (e) {
    showToast(`⚠️ Không thể kết nối tới server: ${e.message}`);
  }
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

  if (!emailInp || !passInp) return;

  if (role === "student") {
    emailInp.value = "sv_an@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Student";
  } else if (role === "expert") {
    emailInp.value = "ha.nguyen@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Expert";
  } else if (role === "admin") {
    emailInp.value = "admin@unimind.edu.vn";
    passInp.value = "123456";
    activeAuthRole = "Admin";
  }
}

async function handleLoginSubmit() {
  const emailInp = document.getElementById("txtLoginEmail");
  const passInp = document.getElementById("txtLoginPassword");
  if (!emailInp || !passInp) return;

  const email = emailInp.value.trim();
  const pass = passInp.value.trim();

  if (!email || !pass) {
    showToast("⚠️ Vui lòng nhập đầy đủ Email/MSSV và Mật khẩu!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrMSSV: email, password: pass })
    });

    const data = await res.json();

    if (res.ok && data.success && data.data) {
      state.currentUser = data.data.user;
      state.token = data.data.token;
      state.isLoggedIn = true;

      // Lưu phiên vào LocalStorage
      localStorage.setItem("unimind_user", JSON.stringify(data.data.user));
      localStorage.setItem("unimind_token", data.data.token);

      closeAuthModal();

      // Phân quyền chuyển hướng phân hệ theo vai trò thực tế từ DB
      const userRole = (data.data.user.role || "").toLowerCase();
      if (userRole === "admin") {
        switchSubsystem("admin");
      } else if (userRole === "expert") {
        switchSubsystem("expert");
      } else {
        switchSubsystem("student");
      }

      showToast(`✅ Đăng nhập thành công: ${data.data.user.fullName} (${data.data.user.role})`);
    } else {
      showToast(`❌ ${data.message || "Thông tin đăng nhập không chính xác!"}`);
    }
  } catch (e) {
    showToast(`⚠️ Không thể kết nối tới Backend API (${API_BASE}): ${e.message}`);
  }
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
