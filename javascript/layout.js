/* javascript/layout.js */

/* ------------------------------------------------------------------
   CONSTANTS – allowed pages per role
------------------------------------------------------------------ */
const ALLOWED_PAGES = {
    admin: [
        'dashboard.php',
        'archers.php',
        'archer-detail.html',
        'add-score.html',
        'approve-score.html',
        'matches.html',
        'equipments.html',
        'settings.html'
    ],
    archer: [
        'dashboard.php',
        'add-score.html',
        'archers-user.html',
        'archer-detail-user.html',
        'settings.html'
    ]
};

/* ------------------------------------------------------------------
   DOM READY – protect pages & build UI
------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    if (!user) {
        // Not logged in → go to login (except when already on login/signup)
        const path = window.location.pathname;
        if (!path.includes('login.html') && !path.includes('signup.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    enforcePageAccess(user.role);
    loadHeader();
});

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */
function getCurrentUser() {
    const raw = localStorage.getItem("archery_auth_user");
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
}

function enforcePageAccess(role) {
    const path = window.location.pathname;
    const allowed = ALLOWED_PAGES[role] || ALLOWED_PAGES.archer;

    // If the current page is NOT in the allowed list → redirect
    if (!allowed.some(p => path.includes(p))) {
        console.warn(`Role "${role}" not allowed on ${path}. Redirecting to dashboard.`);
        window.location.href = 'dashboard.php';
    }
}

/* ------------------------------------------------------------------
   HEADER / SIDEBAR
------------------------------------------------------------------ */
function loadHeader() {
    fetch('header.html')
        .then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.text();
        })
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
            updateSidebarForRole();
            populateSidebarFooter();
            setActiveNavigation();
        })
        .catch(err => console.error('Header fetch error:', err));
}

/* ------------------------------------------------------------------
   SIDEBAR – show/hide + rename links
------------------------------------------------------------------ */
function updateSidebarForRole() {
    const user = getCurrentUser();
    if (!user) return;

    const role = user.role || 'archer';
    const nav  = document.querySelector('nav.nav.sidebar-nav');
    if (!nav) return;

    // ---- 1. Hide links that the role must NOT see ----
    const hideForArcher = [
        'a[href="archers.php"]',
        'a[href="equipments.html"]',
        'a[href="approve-score.html"]',
        'a[href="matches.html"]'
    ];

    if (role === 'archer') {
        hideForArcher.forEach(sel => {
            const el = nav.querySelector(sel);
            if (el) el.style.display = 'none';
        });

        const archersLink = nav.querySelector('a[href="archers.php"]');
        if (archersLink) {
            // Change destination to the user-friendly view
            archersLink.href = 'archers-user.html';
        }

        const addScoreLink = nav.querySelector('a[href="add-score.html"]');
        if (addScoreLink) {
            addScoreLink.style.display = 'flex'; // Make sure it's visible
            const span = addScoreLink.querySelector('span');
            if (span) span.textContent = 'Add Score'; // Ensure it says "Add Score"
        }
    }

    // ---- 2. Admin: rename "Add Score" → "Approve Scores" ----
    if (role === 'admin') {
        const addScoreLink = nav.querySelector('a[href="add-score.html"]');
        if (addScoreLink) {
            addScoreLink.href = 'approve-score.html';
            const span = addScoreLink.querySelector('span');
            if (span) span.textContent = 'Approve Scores';
        }

        const icon = addScoreLink.querySelector('i');
            if (icon) {
                icon.className = 'fa-solid fa-clipboard-check'; // Change icon
            }
    }
}

/* ------------------------------------------------------------------
   SIDEBAR FOOTER – email + role
------------------------------------------------------------------ */
function populateSidebarFooter() {
    const user = getCurrentUser();
    if (!user) return;

    const nameEl  = document.getElementById('sidebarUserEmail');   // We'll reuse this ID for name
    const roleEl  = document.getElementById('sidebarUserRole');

    // 1. Prefer the stored name, otherwise fall back to e-mail
    const displayName = user.name && user.name.trim()
        ? user.name.trim()
        : (user.email || 'User');

    // 2. Show name
    if (nameEl) {
        nameEl.textContent = displayName;
        // 3. Hover = e-mail (always show e-mail, even if name is present)
        nameEl.title = user.email || '';
    }

    // 4. Role
    if (roleEl) {
        const r = (user.role || 'archer');
        roleEl.textContent = r.charAt(0).toUpperCase() + r.slice(1);
    }
}

/* ------------------------------------------------------------------
   ACTIVE NAVIGATION HIGHLIGHT
------------------------------------------------------------------ */
function setActiveNavigation() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('nav.nav.sidebar-nav a');
    let best = null;

    // 1. Exact match
    links.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('href') === path) best = l;
    });

    // 2. Special cases
    if (!best) {
        if (path.includes('archer-detail.html')) {
            best = document.querySelector('a[href="archers.php"]');
        } else if (path.includes('approve-score.html')) {
            best = document.querySelector('a[href="approve-score.html"]');
        }
    }

    // 3. Fallback to Dashboard for root pages
    if (!best && (path === '/' || path === 'index.html')) {
        best = document.querySelector('a[href="dashboard.php"]');
    }

    if (best) best.classList.add('active');
}

/* ------------------------------------------------------------------
   LOGOUT
------------------------------------------------------------------ */
function logout() {
    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("archery_auth_user");
    // Optional: clear demo data if you still use it
    // localStorage.removeItem("archery_demo_data_v1");
    window.location.href = 'index.html';
}