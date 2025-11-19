/*
  Archery Dashboard - Settings Page (Profile Management)
  - Manages "archery_auth_user" (session)
  - Manages "archery_user_db" (user database)
*/

const AUTH_KEY = "archery_auth_user";
const USER_DB_KEY = "archery_user_db";

document.addEventListener("DOMContentLoaded", () => {
    loadProfileInfo();

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfileChanges);
    }
});

function loadProfileInfo() {
    const userRaw = localStorage.getItem(AUTH_KEY);
    if (!userRaw) {
        console.error("Not logged in.");
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        const user = JSON.parse(userRaw);
        
        document.getElementById('profileFullName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        
        // Từ hình ảnh, User ID và Account Created không được lưu trữ
        // trong session, chúng ta sẽ dùng thông tin có sẵn
        document.getElementById('profileUserID').textContent = user.email || 'N/A';
        document.getElementById('profileAccountCreated').textContent = "N/A (Data not tracked in demo)";

    } catch (e) {
        console.error("Failed to parse user data:", e);
    }
}

function saveProfileChanges(event) {
    event.preventDefault();
    
    const newName = document.getElementById('profileFullName').value.trim();
    if (!newName) {
        showToast("Full Name cannot be empty.", "error");
        return;
    }

    // 1. Cập nhật đối tượng session (AUTH_KEY)
    const userRaw = localStorage.getItem(AUTH_KEY);
    if (!userRaw) {
        showToast("Session expired. Please log in again.", "error");
        return;
    }
    
    let userSession;
    try {
        userSession = JSON.parse(userRaw);
    } catch (e) {
        showToast("Error reading session.", "error");
        return;
    }
    
    userSession.name = newName;
    localStorage.setItem(AUTH_KEY, JSON.stringify(userSession));

    // 2. Cập nhật cơ sở dữ liệu người dùng (USER_DB_KEY)
    const dbRaw = localStorage.getItem(USER_DB_KEY);
    let userDb = [];
    if (dbRaw) {
        try {
            userDb = JSON.parse(dbRaw);
        } catch (e) { /* Bỏ qua lỗi, sẽ tạo db mới */ }
    }
    
    const userIndex = userDb.findIndex(u => u.email === userSession.email);
    if (userIndex !== -1) {
        userDb[userIndex].name = newName;
        localStorage.setItem(USER_DB_KEY, JSON.stringify(userDb));
    } else {
        // Điều này không nên xảy ra nếu đã đăng nhập
        console.warn("Could not find user in DB to update name.");
    }

    // 3. Cập nhật UI (Sidebar)
    const sidebarEmailEl = document.getElementById('sidebarUserEmail');
    if (sidebarEmailEl) {
        // Mặc dù tên đã thay đổi, chúng ta vẫn hiển thị email ở sidebar
        // Nếu muốn hiển thị tên, bạn có thể thay đổi ở đây
    }
    
    showToast("Profile updated successfully!", "success");
}


// --- Toast Helper ---
function showToast(message, type = "info"){
  const toast = document.getElementById('toast');
  if(!toast) { alert(message); return; }
  
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

function updateProfile(event) {
  event.preventDefault();
  
  const newName = document.getElementById('fullName').value.trim();
  const newEmail = document.getElementById('email').value.trim();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value.trim();
  
  if (!newName || !newEmail) {
    showToast('❌ Name and email are required!', 'error');
    return;
  }
  
  const user = getAuthUser();
  if (!user) {
    showToast('❌ Not logged in!', 'error');
    return;
  }
  
  // Verify current password if changing password
  if (newPassword && currentPassword !== user.password) {
    showToast('❌ Current password is incorrect!', 'error');
    return;
  }
  
  // Update auth user
  user.name = newName;
  user.email = newEmail;
  if (newPassword) user.password = newPassword;
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  
  // =====  AUTO-UPDATE ARCHER PROFILE =====
  if (user.archerId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.archers) {
      const archer = data.archers.find(a => a.id === user.archerId);
      
      if (archer) {
        const nameParts = newName.split(' ');
        archer.first = nameParts[0];
        archer.last = nameParts.slice(1).join(' ') || "Archer";
        archer.email = newEmail;
        archer.updatedAt = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('✅ Archer profile synced with auth user');
      }
    }
  }
  
  showToast('✅ Profile updated successfully!', 'success');
  
  // Update display
  setTimeout(() => {
    displayUserInfo(user);
  }, 500);
}