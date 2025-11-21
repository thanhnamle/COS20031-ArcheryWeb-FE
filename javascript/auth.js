/* javascript/auth.js */

/* ------------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------------ */
const USER_DB_KEY   = "archery_user_db";      // users (name,email,pwd,role)
const AUTH_KEY      = "archery_auth_user";    // current session
const STORAGE_KEY   = "archery_app_data";     // main app data (archers,…)

/* ------------------------------------------------------------------
   DOM READY
------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm)  loginForm.addEventListener("submit",  handleLogin);
    if (signupForm) signupForm.addEventListener("submit", handleSignup);
});

/* ------------------------------------------------------------------
   USER DATABASE (localStorage)
------------------------------------------------------------------ */
function getUserDatabase() {
    const raw = localStorage.getItem(USER_DB_KEY);
    let db = [];

    if (raw) {
        try { 
            db = JSON.parse(raw); 
        } catch { 
            db = []; 
        }
    }

    const adminEmail = 'admin@app.com';
    // Check if admin exists
    if (!db.some(u => u.email === adminEmail)) {
        db.push({
            name: "System Admin",
            email: adminEmail,
            password: "admin123",
            role: "admin"
        });
        // Save immediately so it persists
        saveUserDatabase(db);
    }

    return db;
}
function saveUserDatabase(db) {
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
}

/* ------------------------------------------------------------------
   APP DATA (archers, scores, …)
------------------------------------------------------------------ */
function getStorageData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { archers: [], scores: [], rounds: [], competitions: [] };
    try { return JSON.parse(raw); }
    catch { return { archers: [], scores: [], rounds: [], competitions: [] }; }
}
function saveStorageData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ------------------------------------------------------------------
   SIGN-UP
------------------------------------------------------------------ */
function handleSignup(event) {
    event.preventDefault();

    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errorEl  = document.getElementById("authError");

    if (!name || !email || !password) {
        errorEl.textContent = "Please fill in all fields.";
        return;
    }

    const db = getUserDatabase();

    // ---- email already taken? ----
    if (db.some(u => u.email === email)) {
        errorEl.textContent = "Email is already registered.";
        return;
    }

    // ---- create user (admin shortcut) ----
    const role = (email === 'admin@app.com') ? 'admin' : 'archer';
    const newUser = { name, email, password, role };
    db.push(newUser);
    saveUserDatabase(db);

    // ---- log the fresh user in (single source of truth) ----
    loginUser(email, password);   // this already stores AUTH_KEY + redirects
}

/* ------------------------------------------------------------------
   LOGIN
------------------------------------------------------------------ */
function handleLogin(event) {
    event.preventDefault();
    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    loginUser(email, password);
}

/* ------------------------------------------------------------------
   CORE LOGIN (shared by signup & login)
------------------------------------------------------------------ */
function loginUser(email, password) {
    const errorEl = document.getElementById("authError");   

    if (!email || !password) {
        if (errorEl) errorEl.textContent = "Please enter both email and password.";
        return;
    }

    const db   = getUserDatabase();
    const user = db.find(u => u.email === email);

    if (!user || user.password !== password) {
        if (errorEl) errorEl.textContent = "Invalid email or password.";
        return;
    }

    const role = user.role || (email === 'admin@app.com' ? 'admin' : 'archer');

    // ---- archer → find profile id ----
    let archerId = null;
    if (role === 'archer') {
        const data = getStorageData();
        // Check if data.archers exists before trying to find
        if (data.archers) {
            const profile = data.archers.find(a => a.email === email);
            if (profile) {
                archerId = profile.id;
            }
        }
    }

    // ---- store session (single place) ----
    const session = {
        name: user.name,
        email: user.email,
        role: role,
        archerId: archerId
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));

    // ---- go to dashboard ----
    window.location.href = "dashboard.php";
}