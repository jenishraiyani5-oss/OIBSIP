
document.addEventListener('DOMContentLoaded', () => {
    // Storage Keys
    const USERS_KEY = 'auth_portal_users';
    const SESSION_KEY = 'auth_portal_session';

    // DOM Elements
    const views = {
        login: document.getElementById('loginSection'),
        register: document.getElementById('registerSection'),
        dashboard: document.getElementById('dashboardSection')
    };

    const navTabs = {
        login: document.getElementById('tabLogin'),
        register: document.getElementById('tabRegister')
    };

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginAlert = document.getElementById('loginAlert');
    const loginAlertText = document.getElementById('loginAlertText');
    const regAlert = document.getElementById('regAlert');
    const regAlertText = document.getElementById('regAlertText');
    const logoutBtn = document.getElementById('logoutBtn');

   
    function generateSalt() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const buffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(buffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

   
    function getUsers() {
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function findUserByIdentity(identity) {
        const normalized = identity.trim().toLowerCase();
        const users = getUsers();
        return users.find(u => 
            u.username.toLowerCase() === normalized || 
            u.email.toLowerCase() === normalized
        );
    }

    function checkUserExists(username, email) {
        const normUser = username.trim().toLowerCase();
        const normEmail = email.trim().toLowerCase();
        const users = getUsers();

        return users.some(u => 
            u.username.toLowerCase() === normUser || 
            u.email.toLowerCase() === normEmail
        );
    }


    function getSession() {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    function setSession(user) {
        const session = {
            username: user.username,
            email: user.email,
            loggedInAt: new Date().toISOString()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }



    function navigateTo(viewName) {
        window.location.hash = viewName;
        renderView(viewName);
    }

    function renderView(viewName) {
        const session = getSession();

        // Protected Dashboard Route Guard
        if (viewName === 'dashboard') {
            if (!session) {
                // Not authenticated -> redirect to login
                window.location.hash = 'login';
                showView('login');
                return;
            }
            populateDashboard(session);
            showView('dashboard');
            return;
        }

        // Unauthenticated views
        if (session) {
            window.location.hash = 'dashboard';
            populateDashboard(session);
            showView('dashboard');
            return;
        }

        showView(viewName === 'register' ? 'register' : 'login');
    }

    function showView(activeView) {
        // Toggle view sections
        Object.keys(views).forEach(key => {
            if (key === activeView) {
                views[key].classList.remove('hidden');
            } else {
                views[key].classList.add('hidden');
            }
        });

        // Toggle nav tabs active state
        if (navTabs.login && navTabs.register) {
            navTabs.login.classList.toggle('active', activeView === 'login');
            navTabs.register.classList.toggle('active', activeView === 'register');
        }

        // Hide navigation tabs when on dashboard
        const navTabsContainer = document.getElementById('navTabs');
        if (navTabsContainer) {
            navTabsContainer.style.display = (activeView === 'dashboard') ? 'none' : 'flex';
        }

        // Reset error messages on view change
        hideAlert(loginAlert);
        hideAlert(regAlert);
    }

    function showAlert(alertEl, textEl, message) {
        textEl.textContent = message;
        alertEl.classList.remove('hidden');
    }

    function hideAlert(alertEl) {
        alertEl.classList.add('hidden');
    }

  
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(regAlert);

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        // Basic validation: Check non-empty fields
        if (!username || !email || !password) {
            showAlert(regAlert, regAlertText, 'Please fill in all required fields.');
            return;
        }

        // Password validation: Minimum 8 characters and at least 1 number
        if (password.length < 8 || !/\d/.test(password)) {
            showAlert(regAlert, regAlertText, 'Password must be at least 8 characters long and contain at least 1 number.');
            return;
        }

        // Duplicate username or email check
        if (checkUserExists(username, email)) {
            showAlert(regAlert, regAlertText, 'An account with this username or email already exists.');
            return;
        }

        // Password Hashing with Salt
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            salt: salt,
            passwordHash: passwordHash // Stored as salt+SHA-256 hash
        };

        // Save user to LocalStorage
        const users = getUsers();
        users.push(newUser);
        saveUsers(users);

        // Reset form and switch to login view
        registerForm.reset();
        alert('Registration successful! Please sign in with your credentials.');
        navigateTo('login');
    });


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(loginAlert);

        const identity = document.getElementById('loginInput').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Basic validation: Check non-empty fields
        if (!identity || !password) {
            showAlert(loginAlert, loginAlertText, 'Please enter your username/email and password.');
            return;
        }

        // User lookup
        const user = findUserByIdentity(identity);
        if (!user) {
            // Generic error handling (do not reveal which field is wrong)
            showAlert(loginAlert, loginAlertText, 'Invalid username/email or password.');
            return;
        }

        // Verify Password Hash
        const hashAttempt = await hashPassword(password, user.salt);
        if (hashAttempt !== user.passwordHash) {
            // Generic error handling (do not reveal which field is wrong)
            showAlert(loginAlert, loginAlertText, 'Invalid username/email or password.');
            return;
        }

        // Create Session in SessionStorage
        setSession(user);
        loginForm.reset();

        // Redirect to Protected Dashboard
        navigateTo('dashboard');
    });

   

    function populateDashboard(session) {
        document.getElementById('welcomeUser').textContent = `Welcome, ${session.username}!`;
        document.getElementById('userEmailText').textContent = session.email;
        document.getElementById('dashUsername').textContent = session.username;
        document.getElementById('dashEmail').textContent = session.email;
    }

    logoutBtn.addEventListener('click', () => {
        clearSession();
        navigateTo('login');
    });


    navTabs.login.addEventListener('click', () => navigateTo('login'));
    navTabs.register.addEventListener('click', () => navigateTo('register'));
    
    document.getElementById('gotoRegister').addEventListener('click', () => navigateTo('register'));
    document.getElementById('gotoLogin').addEventListener('click', () => navigateTo('login'));

    // Password visibility toggle
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = 'Hide';
            } else {
                input.type = 'password';
                btn.textContent = 'Show';
            }
        });
    });

    // Initial Routing based on URL hash
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        renderView(hash);
    });

    const currentHash = window.location.hash.replace('#', '') || 'login';
    renderView(currentHash);
});
