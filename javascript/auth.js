/* javascript/auth.js */

// Khóa để lưu "cơ sở dữ liệu" người dùng
const USER_DB_KEY = "archery_user_db";
// Khóa để lưu "phiên đăng nhập"
const AUTH_KEY = "archery_auth_user";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    
    if(loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    if(signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }
});

// Hàm lấy CSDL người dùng từ localStorage
function getUserDatabase() {
    const dbRaw = localStorage.getItem(USER_DB_KEY);
    if (dbRaw) {
        try {
            return JSON.parse(dbRaw);
        } catch (e) {
            return [];
        }
    }
    return []; // Trả về mảng rỗng nếu chưa có
}

// Hàm lưu CSDL người dùng
function saveUserDatabase(db) {
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
}

function getStorageData() {
    const raw = localStorage.getItem("archery_demo_data_v1");
    if(!raw) return { archers: [] }; // Trả về cấu trúc tối thiểu
    try { 
        return JSON.parse(raw); 
    } catch(e) {
        return { archers: [] };
    }
}

// Xử lý đăng ký
function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("authError");

    if (!name || !email || !password) {
        errorEl.textContent = "Please fill in all fields.";
        return;
    }

    const db = getUserDatabase();

    // KIỂM TRA: Email đã tồn tại chưa?
    const existingUser = db.find(user => user.email === email);
    if (existingUser) {
        errorEl.textContent = "Email is already registered.";
        return;
    }

    // TẠO user mới với role
    const role = (email === 'admin@app.com') ? 'admin' : 'archer'; // Quy định admin
    const newUser = { name, email, password, role }; // Thêm role
    db.push(newUser);
    saveUserDatabase(db);

    loginUser(email, password);

    // Đăng nhập cho user mới
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    
    // Chuyển hướng đến dashboard
    window.location.href = "/pages/dashboard.html";
}

// Xử lý đăng nhập
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    
    loginUser(email, password); // Gọi hàm login chung
}

// TÁCH HÀM LOGIN RA
function loginUser(email, password) {
    const errorEl = document.getElementById("authError");
    if (!errorEl) { // Dùng cho trường hợp signup gọi
        console.log("Attempting login post-signup...");
    }

    if (!email || !password) {
        if(errorEl) errorEl.textContent = "Please enter both email and password.";
        return;
    }

    const db = getUserDatabase();
    const user = db.find(u => u.email === email);
    
    if (!user || user.password !== password) {
        if(errorEl) errorEl.textContent = "Invalid email or password.";
        return;
    }

    // THÀNH CÔNG: TÌM HỒ SƠ CUNG THỦ VÀ LƯU PHIÊN ĐĂNG NHẬP
    
    // 1. Xác định vai trò
    const role = user.role || ((user.email === 'admin@app.com') ? 'admin' : 'archer');
    
    // 2. Nếu là 'archer', tìm archerId bằng email
    let archerId = null;
    if (role === 'archer') {
        const data = getStorageData(); // Lấy data chính
        const archerProfile = data.archers.find(a => a.email === user.email);
        
        if (archerProfile) {
            archerId = archerProfile.id;
        } else {
            // Trường hợp Cung thủ đăng ký nhưng admin chưa tạo hồ sơ
            if(errorEl) errorEl.textContent = "Your account is not linked to an archer profile. Contact admin.";
            return;
        }
    }

    // 3. Tạo đối tượng session để lưu
    const authSession = {
        name: user.name,
        email: user.email,
        role: role,
        archerId: archerId // Sẽ là null nếu là admin
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(authSession));
    
    // Chuyển hướng
    window.location.href = "/pages/dashboard.html";
}