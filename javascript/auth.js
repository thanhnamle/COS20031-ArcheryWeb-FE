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

    // TẠO user mới
    const newUser = { name, email, password };
    db.push(newUser);
    saveUserDatabase(db);

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
    const errorEl = document.getElementById("authError");

    if (!email || !password) {
        errorEl.textContent = "Please enter both email and password.";
        return;
    }

    const db = getUserDatabase();
    
    // KIỂM TRA: Tìm user bằng email
    const user = db.find(u => u.email === email);
    
    if (!user) {
        errorEl.textContent = "Invalid email or password.";
        return;
    }

    // KIỂM TRA: Mật khẩu có khớp không?
    if (user.password !== password) {
        errorEl.textContent = "Invalid email or password.";
        return;
    }

    // THÀNH CÔNG: Lưu phiên đăng nhập
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    // Chuyển hướng
    window.location.href = "/pages/dashboard.html";
}