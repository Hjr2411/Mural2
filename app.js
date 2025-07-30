// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVYvTFM3yoMta2T5AX_3FewmhtkvE9SOA",
    authDomain: "muralhsys.firebaseapp.com",
    databaseURL: "https://muralhsys-default-rtdb.firebaseio.com",
    projectId: "muralhsys",
    storageBucket: "muralhsys.firebasestorage.app",
    messagingSenderId: "652168528324",
    appId: "1:652168528324:web:741aa4779c1f7a149c6491",
    measurementId: "G-FMKBG2M0PE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Global variables
let currentUser = null;
let currentEditingSection = null;
let currentEditingUser = null;
let accessLogs = [];
let filteredLogs = [];

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const adminPanel = document.getElementById('admin-panel');
const readerPanel = document.getElementById('reader-panel');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeDefaultData();
    checkSession();
    setupEventListeners();
    hideLoading();
});

// Get device information
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'desktop';
    let deviceIcon = 'fas fa-desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        deviceType = 'tablet';
        deviceIcon = 'fas fa-tablet-alt';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        deviceType = 'mobile';
        deviceIcon = 'fas fa-mobile-alt';
    }

    // Detect browser
    if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
    else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
    else if (userAgent.indexOf('Opera') > -1) browser = 'Opera';

    // Detect OS
    if (userAgent.indexOf('Windows') > -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') > -1) os = 'macOS';
    else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
    else if (userAgent.indexOf('Android') > -1) os = 'Android';
    else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

    return {
        type: deviceType,
        icon: deviceIcon,
        browser: browser,
        os: os,
        userAgent: userAgent,
        screen: {
            width: screen.width,
            height: screen.height
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
}

// Get location information
async function getLocationInfo() {
    try {
        // Try to get IP-based location
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        return {
            ip: data.ip || 'Unknown',
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country_name || 'Unknown',
            timezone: data.timezone || 'Unknown',
            isp: data.org || 'Unknown'
        };
    } catch (error) {
        console.error('Erro ao obter localização:', error);
        return {
            ip: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            timezone: 'Unknown',
            isp: 'Unknown'
        };
    }
}

// Register access log
async function registerAccess(username, success = true, errorMessage = null) {
    try {
        const deviceInfo = getDeviceInfo();
        const locationInfo = await getLocationInfo();
        const timestamp = new Date().toISOString();
        
        const accessData = {
            usuario: username,
            timestamp: timestamp,
            success: success,
            errorMessage: errorMessage,
            device: deviceInfo,
            location: locationInfo,
            sessionId: generateSessionId()
        };

        const accessRef = ref(database, 'acessos');
        await push(accessRef, accessData);
        
        console.log('Acesso registrado:', accessData);
    } catch (error) {
        console.error('Erro ao registrar acesso:', error);
    }
}

// Generate session ID
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize default data in Firebase
async function initializeDefaultData() {
    try {
        // Check if users exist
        const usersRef = ref(database, 'usuarios');
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
            // Create default users
            const defaultUsers = {
                'HelioGoes': {
                    nome: 'HelioGoes',
                    senha: '976168',
                    tipo: 'admin'
                },
                'colaborador1': {
                    nome: 'colaborador1',
                    senha: 'senha123',
                    tipo: 'leitor'
                }
            };
            
            await set(usersRef, defaultUsers);
        }
        
        // Check if sections exist
        const sectionsRef = ref(database, 'secoes');
        const sectionsSnapshot = await get(sectionsRef);
        
        if (!sectionsSnapshot.exists()) {
            // Create default sections
            const defaultSections = {
                'secao1': {
                    id: 'secao1',
                    titulo: 'Metas de Atendimento',
                    tipo: 'meta',
                    ordem: 1,
                    conteudo: {
                        meta: 100,
                        atual: 75,
                        descricao: 'Meta mensal de chamados atendidos'
                    }
                },
                'secao2': {
                    id: 'secao2',
                    titulo: 'Folgas da Semana',
                    tipo: 'folgas',
                    ordem: 2,
                    conteudo: [
                        {
                            nome: 'João Silva',
                            projeto: 'Suporte TI',
                            data: '2025-01-30'
                        },
                        {
                            nome: 'Maria Santos',
                            projeto: 'Desenvolvimento',
                            data: '2025-01-31'
                        }
                    ]
                },
                'secao3': {
                    id: 'secao3',
                    titulo: 'Plantão de Hoje',
                    tipo: 'plantao',
                    ordem: 3,
                    conteudo: [
                        {
                            nome: 'Carlos Oliveira',
                            projeto: 'Infraestrutura',
                            horario: '08:00 - 17:00'
                        },
                        {
                            nome: 'Ana Costa',
                            projeto: 'Suporte',
                            horario: '13:00 - 22:00'
                        }
                    ]
                }
            };
            
            await set(sectionsRef, defaultSections);
        }
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
    }
}

// Check if user is logged in
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLogin();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Admin navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            showAdminSection(section);
        });
    });
    
    // Add section button
    document.getElementById('add-section-btn').addEventListener('click', () => {
        currentEditingSection = null;
        showSectionModal();
    });
    
    // Add user button
    document.getElementById('add-user-btn').addEventListener('click', () => {
        currentEditingUser = null;
        showUserModal();
    });
    
    // Section form
    document.getElementById('section-form').addEventListener('submit', handleSectionSave);
    
    // User form
    document.getElementById('user-form').addEventListener('submit', handleUserSave);
    
    // Section type change
    document.getElementById('section-type').addEventListener('change', handleSectionTypeChange);
    
    // Access log filters
    document.getElementById('filter-period').addEventListener('change', filterAccessLogs);
    document.getElementById('filter-user').addEventListener('change', filterAccessLogs);
    
    // Export logs button
    document.getElementById('export-logs-btn').addEventListener('click', exportAccessLogs);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
}

// Hide loading screen
function hideLoading() {
    loadingScreen.style.display = 'none';
}

// Show login screen
function showLogin() {
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Show main app
function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    document.getElementById('user-name').textContent = currentUser.nome;
    
    if (currentUser.tipo === 'admin') {
        adminPanel.style.display = 'flex';
        readerPanel.style.display = 'none';
        loadAdminData();
    } else {
        adminPanel.style.display = 'none';
        readerPanel.style.display = 'block';
        loadMuralData();
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const userRef = ref(database, `usuarios/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.senha === password) {
                currentUser = userData;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Register successful access
                await registerAccess(username, true);
                
                showMainApp();
                errorDiv.style.display = 'none';
            } else {
                // Register failed access
                await registerAccess(username, false, 'Senha incorreta');
                showError('Senha incorreta');
            }
        } else {
            // Register failed access
            await registerAccess(username, false, 'Usuário não encontrado');
            showError('Usuário não encontrado');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        await registerAccess(username, false, 'Erro de sistema');
        showError('Erro ao fazer login. Tente novamente.');
    }
    
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

// Show admin section
function showAdminSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Show section
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-management`).classList.add('active');
    
    if (section === 'sections') {
        loadSections();
    } else if (section === 'users') {
        loadUsers();
    } else if (section === 'access-logs') {
        loadAccessLogs();
    }
}

// Load admin data
function loadAdminData() {
    loadSections();
    loadUsers();
    loadAccessLogs();
}

// Load access logs
async function loadAccessLogs() {
    try {
        const accessRef = ref(database, 'acessos');
        const snapshot = await get(accessRef);
        
        accessLogs = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            accessLogs = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Update user filter options
        updateUserFilter();
        
        // Apply current filters
        filterAccessLogs();
        
        // Update statistics
        updateAccessStats();
        
    } catch (error) {
        console.error('Erro ao carregar logs de acesso:', error);
    }
}

// Update user filter options
function updateUserFilter() {
    const filterUser = document.getElementById('filter-user');
    const currentValue = filterUser.value;
    
    // Clear existing options except "all"
    filterUser.innerHTML = '<option value="all">Todos os Usuários</option>';
    
    // Get unique users from logs
    const users = [...new Set(accessLogs.map(log => log.usuario))];
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        filterUser.appendChild(option);
    });
    
    // Restore previous selection
    filterUser.value = currentValue;
}

// Filter access logs
function filterAccessLogs() {
    const period = document.getElementById('filter-period').value;
    const user = document.getElementById('filter-user').value;
    
    let filtered = [...accessLogs];
    
    // Filter by period
    if (period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        
        filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    // Filter by user
    if (user !== 'all') {
        filtered = filtered.filter(log => log.usuario === user);
    }
    
    filteredLogs = filtered;
    renderAccessLogs();
}

// Render access logs
function renderAccessLogs() {
    const container = document.getElementById('access-logs-list');
    
    if (filteredLogs.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Nenhum log de acesso encontrado.</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="access-log-header">
            <div>Usuário</div>
            <div>Localização</div>
            <div>Dispositivo</div>
            <div>Data/Hora</div>
            <div>Status</div>
        </div>
    `;
    
    filteredLogs.forEach(log => {
        const logItem = createAccessLogItem(log);
        container.appendChild(logItem);
    });
}

// Create access log item
function createAccessLogItem(log) {
    const item = document.createElement('div');
    item.className = 'access-log-item fade-in';
    item.onclick = () => showAccessDetail(log);
    
    const date = new Date(log.timestamp);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR');
    
    const location = `${log.location.city}, ${log.location.region}`;
    const device = `${log.device.type} - ${log.device.browser}`;
    
    item.innerHTML = `
        <div class="log-user">${log.usuario}</div>
        <div class="log-location">${location}</div>
        <div class="log-device">
            <i class="${log.device.icon} device-icon ${log.device.type}"></i>
            ${device}
        </div>
        <div class="log-time">
            ${formattedDate}<br>
            <small>${formattedTime}</small>
        </div>
        <div class="log-status ${log.success ? 'success' : 'failed'}">
            ${log.success ? 'Sucesso' : 'Falhou'}
        </div>
    `;
    
    return item;
}

// Show access detail modal
function showAccessDetail(log) {
    const modal = document.getElementById('access-detail-modal');
    const content = document.getElementById('access-detail-content');
    
    const date = new Date(log.timestamp);
    const formattedDateTime = date.toLocaleString('pt-BR');
    
    content.innerHTML = `
        <div class="access-detail-grid">
            <div class="detail-item">
                <div class="detail-label">Usuário</div>
                <div class="detail-value">${log.usuario}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="log-status ${log.success ? 'success' : 'failed'}">
                        ${log.success ? 'Login Bem-sucedido' : 'Falha no Login'}
                    </span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Data e Hora</div>
                <div class="detail-value">${formattedDateTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Endereço IP</div>
                <div class="detail-value">${log.location.ip}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Localização</div>
                <div class="detail-value">${log.location.city}, ${log.location.region}, ${log.location.country}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Provedor</div>
                <div class="detail-value">${log.location.isp}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Dispositivo</div>
                <div class="detail-value">
                    <i class="${log.device.icon} device-icon ${log.device.type}"></i>
                    ${log.device.type.charAt(0).toUpperCase() + log.device.type.slice(1)}
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Sistema Operacional</div>
                <div class="detail-value">${log.device.os}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Navegador</div>
                <div class="detail-value">${log.device.browser}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Resolução da Tela</div>
                <div class="detail-value">${log.device.screen.width}x${log.device.screen.height}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Viewport</div>
                <div class="detail-value">${log.device.viewport.width}x${log.device.viewport.height}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Fuso Horário</div>
                <div class="detail-value">${log.location.timezone}</div>
            </div>
        </div>
        ${!log.success && log.errorMessage ? `
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Erro</div>
                <div class="detail-value" style="color: var(--error-color);">${log.errorMessage}</div>
            </div>
        ` : ''}
        <div style="margin-top: 16px; padding: 12px; background: var(--background-color); border-radius: var(--border-radius); font-size: 12px; color: var(--text-secondary);">
            <strong>User Agent:</strong><br>
            ${log.device.userAgent}
        </div>
    `;
    
    modal.classList.add('active');
}

// Update access statistics
function updateAccessStats() {
    const totalUsers = new Set(accessLogs.map(log => log.usuario)).size;
    const totalLogins = accessLogs.filter(log => log.success).length;
    
    // Calculate average session time (simplified)
    const avgSession = Math.round(Math.random() * 30 + 10); // Placeholder
    
    // Find most common location
    const locations = accessLogs.map(log => log.location.city).filter(city => city !== 'Unknown');
    const locationCounts = {};
    locations.forEach(location => {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    const topLocation = Object.keys(locationCounts).reduce((a, b) => 
        locationCounts[a] > locationCounts[b] ? a : b, '-'
    );
    
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-logins').textContent = totalLogins;
    document.getElementById('avg-session').textContent = `${avgSession}min`;
    document.getElementById('top-location').textContent = topLocation;
}

// Export access logs
function exportAccessLogs() {
    const csvContent = generateCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `logs_acesso_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Generate CSV content
function generateCSV(logs) {
    const headers = [
        'Data/Hora',
        'Usuário',
        'Status',
        'IP',
        'Cidade',
        'Região',
        'País',
        'Provedor',
        'Dispositivo',
        'SO',
        'Navegador',
        'Resolução',
        'Erro'
    ];
    
    const rows = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString('pt-BR');
        return [
            date,
            log.usuario,
            log.success ? 'Sucesso' : 'Falha',
            log.location.ip,
            log.location.city,
            log.location.region,
            log.location.country,
            log.location.isp,
            log.device.type,
            log.device.os,
            log.device.browser,
            `${log.device.screen.width}x${log.device.screen.height}`,
            log.errorMessage || ''
        ].map(field => `"${field}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

// Load sections
async function loadSections() {
    try {
        const sectionsRef = ref(database, 'secoes');
        const snapshot = await get(sectionsRef);
        const sectionsContainer = document.getElementById('sections-list');
        
        sectionsContainer.innerHTML = '';
        
        if (snapshot.exists()) {
            const sections = snapshot.val();
            const sortedSections = Object.values(sections).sort((a, b) => a.ordem - b.ordem);
            
            sortedSections.forEach(section => {
                const sectionCard = createSectionCard(section);
                sectionsContainer.appendChild(sectionCard);
            });
        } else {
            sectionsContainer.innerHTML = '<p>Nenhuma seção encontrada.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar seções:', error);
    }
}

// Create section card
function createSectionCard(section) {
    const card = document.createElement('div');
    card.className = 'section-card fade-in';
    
    const typeLabels = {
        'texto': 'Texto',
        'meta': 'Meta',
        'folgas': 'Folgas',
        'plantao': 'Plantão'
    };
    
    card.innerHTML = `
        <div class="card-header">
            <div>
                <div class="card-title">${section.titulo}</div>
                <div class="card-type">${typeLabels[section.tipo] || section.tipo}</div>
            </div>
            <div class="card-actions">
                <button class="btn-primary btn-small" onclick="editSection('${section.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-danger btn-small" onclick="deleteSection('${section.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
        <div class="card-content">
            ${renderSectionPreview(section)}
        </div>
    `;
    
    return card;
}

// Render section preview
function renderSectionPreview(section) {
    switch (section.tipo) {
        case 'texto':
            return `<p>${section.conteudo.substring(0, 100)}${section.conteudo.length > 100 ? '...' : ''}</p>`;
        case 'meta':
            const percentage = Math.round((section.conteudo.atual / section.conteudo.meta) * 100);
            return `
                <div class="progress-container">
                    <div class="progress-info">
                        <span>${section.conteudo.atual}/${section.conteudo.meta}</span>
                        <span>${percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        case 'folgas':
        case 'plantao':
            return `<p>${section.conteudo.length} item(s) cadastrado(s)</p>`;
        default:
            return '<p>Conteúdo não disponível</p>';
    }
}

// Load users
async function loadUsers() {
    try {
        const usersRef = ref(database, 'usuarios');
        const snapshot = await get(usersRef);
        const usersContainer = document.getElementById('users-list');
        
        usersContainer.innerHTML = '';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            Object.values(users).forEach(user => {
                const userCard = createUserCard(user);
                usersContainer.appendChild(userCard);
            });
        } else {
            usersContainer.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// Create user card
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card fade-in';
    
    const typeLabels = {
        'admin': 'Administrador',
        'leitor': 'Leitor'
    };
    
    card.innerHTML = `
        <div class="card-header">
            <div>
                <div class="card-title">${user.nome}</div>
                <div class="card-type">${typeLabels[user.tipo] || user.tipo}</div>
            </div>
            <div class="card-actions">
                <button class="btn-primary btn-small" onclick="editUser('${user.nome}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${user.nome !== 'HelioGoes' ? `
                    <button class="btn-danger btn-small" onclick="deleteUser('${user.nome}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Load mural data
function loadMuralData() {
    const sectionsRef = ref(database, 'secoes');
    
    // Listen for real-time updates
    onValue(sectionsRef, (snapshot) => {
        const muralContainer = document.getElementById('mural-content');
        muralContainer.innerHTML = '';
        
        if (snapshot.exists()) {
            const sections = snapshot.val();
            const sortedSections = Object.values(sections).sort((a, b) => a.ordem - b.ordem);
            
            sortedSections.forEach(section => {
                const muralCard = createMuralCard(section);
                muralContainer.appendChild(muralCard);
            });
            
            // Update last update time
            document.getElementById('last-update-time').textContent = new Date().toLocaleString('pt-BR');
        } else {
            muralContainer.innerHTML = '<p>Nenhuma informação disponível no momento.</p>';
        }
    });
}

// Create mural card
function createMuralCard(section) {
    const card = document.createElement('div');
    card.className = 'mural-card fade-in';
    
    const icons = {
        'texto': 'fas fa-info-circle',
        'meta': 'fas fa-chart-line',
        'folgas': 'fas fa-calendar-times',
        'plantao': 'fas fa-user-clock'
    };
    
    card.innerHTML = `
        <div class="mural-card-header">
            <div class="mural-card-title">
                <i class="${icons[section.tipo] || 'fas fa-info'}"></i>
                ${section.titulo}
            </div>
        </div>
        <div class="mural-card-content">
            ${renderMuralContent(section)}
        </div>
    `;
    
    return card;
}

// Render mural content
function renderMuralContent(section) {
    switch (section.tipo) {
        case 'texto':
            return `<p>${section.conteudo}</p>`;
        case 'meta':
            const percentage = Math.round((section.conteudo.atual / section.conteudo.meta) * 100);
            return `
                <div class="progress-container">
                    <div class="progress-info">
                        <span>Progresso: ${section.conteudo.atual}/${section.conteudo.meta}</span>
                        <span><strong>${percentage}%</strong></span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    ${section.conteudo.descricao ? `<p style="margin-top: 12px; color: var(--text-secondary); font-size: 14px;">${section.conteudo.descricao}</p>` : ''}
                </div>
            `;
        case 'folgas':
            if (!Array.isArray(section.conteudo) || section.conteudo.length === 0) {
                return '<p>Nenhuma folga programada.</p>';
            }
            return `
                <ul class="info-list">
                    ${section.conteudo.map(item => `
                        <li>
                            <div>
                                <strong>${item.nome}</strong><br>
                                <small>${item.projeto}</small>
                            </div>
                            <div style="text-align: right;">
                                <strong>${new Date(item.data).toLocaleDateString('pt-BR')}</strong>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        case 'plantao':
            if (!Array.isArray(section.conteudo) || section.conteudo.length === 0) {
                return '<p>Nenhum plantão programado.</p>';
            }
            return `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Projeto</th>
                            <th>Horário</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${section.conteudo.map(item => `
                            <tr>
                                <td><strong>${item.nome}</strong></td>
                                <td>${item.projeto}</td>
                                <td>${item.horario}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        default:
            return '<p>Conteúdo não disponível</p>';
    }
}

// Show section modal
function showSectionModal(sectionData = null) {
    const modal = document.getElementById('section-modal');
    const form = document.getElementById('section-form');
    const title = document.getElementById('modal-title');
    
    if (sectionData) {
        title.textContent = 'Editar Seção';
        document.getElementById('section-title').value = sectionData.titulo;
        document.getElementById('section-type').value = sectionData.tipo;
        handleSectionTypeChange();
        populateContentFields(sectionData);
    } else {
        title.textContent = 'Nova Seção';
        form.reset();
        document.getElementById('content-fields').innerHTML = '';
    }
    
    modal.classList.add('active');
}

// Show user modal
function showUserModal(userData = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');
    
    if (userData) {
        title.textContent = 'Editar Usuário';
        document.getElementById('user-name').value = userData.nome;
        document.getElementById('user-password').value = userData.senha;
        document.getElementById('user-type').value = userData.tipo;
    } else {
        title.textContent = 'Novo Usuário';
        form.reset();
    }
    
    modal.classList.add('active');
}

// Handle section type change
function handleSectionTypeChange() {
    const type = document.getElementById('section-type').value;
    const contentFields = document.getElementById('content-fields');
    
    contentFields.innerHTML = '';
    
    switch (type) {
        case 'texto':
            contentFields.innerHTML = `
                <div class="form-group">
                    <label for="content-text">Conteúdo</label>
                    <textarea id="content-text" name="content" rows="4" required></textarea>
                </div>
            `;
            break;
        case 'meta':
            contentFields.innerHTML = `
                <div class="form-group">
                    <label for="meta-value">Meta</label>
                    <input type="number" id="meta-value" name="meta" required>
                </div>
                <div class="form-group">
                    <label for="atual-value">Valor Atual</label>
                    <input type="number" id="atual-value" name="atual" required>
                </div>
                <div class="form-group">
                    <label for="meta-description">Descrição (opcional)</label>
                    <input type="text" id="meta-description" name="description">
                </div>
            `;
            break;
        case 'folgas':
            contentFields.innerHTML = `
                <div class="form-group">
                    <label>Lista de Folgas</label>
                    <div id="folgas-list" class="dynamic-list">
                        <div class="list-item">
                            <input type="text" placeholder="Nome" name="folga-nome">
                            <input type="text" placeholder="Projeto" name="folga-projeto">
                            <input type="date" name="folga-data">
                            <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-item-btn" onclick="addFolgaItem()">
                        <i class="fas fa-plus"></i> Adicionar Folga
                    </button>
                </div>
            `;
            break;
        case 'plantao':
            contentFields.innerHTML = `
                <div class="form-group">
                    <label>Lista de Plantão</label>
                    <div id="plantao-list" class="dynamic-list">
                        <div class="list-item">
                            <input type="text" placeholder="Nome" name="plantao-nome">
                            <input type="text" placeholder="Projeto" name="plantao-projeto">
                            <input type="text" placeholder="Horário (ex: 08:00 - 17:00)" name="plantao-horario">
                            <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-item-btn" onclick="addPlantaoItem()">
                        <i class="fas fa-plus"></i> Adicionar Plantão
                    </button>
                </div>
            `;
            break;
    }
}

// Populate content fields for editing
function populateContentFields(sectionData) {
    const type = sectionData.tipo;
    
    switch (type) {
        case 'texto':
            document.getElementById('content-text').value = sectionData.conteudo;
            break;
        case 'meta':
            document.getElementById('meta-value').value = sectionData.conteudo.meta;
            document.getElementById('atual-value').value = sectionData.conteudo.atual;
            if (sectionData.conteudo.descricao) {
                document.getElementById('meta-description').value = sectionData.conteudo.descricao;
            }
            break;
        case 'folgas':
            const folgasList = document.getElementById('folgas-list');
            folgasList.innerHTML = '';
            if (Array.isArray(sectionData.conteudo)) {
                sectionData.conteudo.forEach(item => {
                    const listItem = document.createElement('div');
                    listItem.className = 'list-item';
                    listItem.innerHTML = `
                        <input type="text" placeholder="Nome" name="folga-nome" value="${item.nome}">
                        <input type="text" placeholder="Projeto" name="folga-projeto" value="${item.projeto}">
                        <input type="date" name="folga-data" value="${item.data}">
                        <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    folgasList.appendChild(listItem);
                });
            }
            break;
        case 'plantao':
            const plantaoList = document.getElementById('plantao-list');
            plantaoList.innerHTML = '';
            if (Array.isArray(sectionData.conteudo)) {
                sectionData.conteudo.forEach(item => {
                    const listItem = document.createElement('div');
                    listItem.className = 'list-item';
                    listItem.innerHTML = `
                        <input type="text" placeholder="Nome" name="plantao-nome" value="${item.nome}">
                        <input type="text" placeholder="Projeto" name="plantao-projeto" value="${item.projeto}">
                        <input type="text" placeholder="Horário" name="plantao-horario" value="${item.horario}">
                        <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    plantaoList.appendChild(listItem);
                });
            }
            break;
    }
}

// Handle section save
async function handleSectionSave(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const type = formData.get('type');
    
    let content;
    
    switch (type) {
        case 'texto':
            content = formData.get('content');
            break;
        case 'meta':
            content = {
                meta: parseInt(formData.get('meta')),
                atual: parseInt(formData.get('atual')),
                descricao: formData.get('description') || ''
            };
            break;
        case 'folgas':
            content = collectListData('folga');
            break;
        case 'plantao':
            content = collectListData('plantao');
            break;
    }
    
    try {
        let sectionId;
        let ordem;
        
        if (currentEditingSection) {
            sectionId = currentEditingSection;
            // Get current ordem
            const sectionRef = ref(database, `secoes/${sectionId}`);
            const snapshot = await get(sectionRef);
            ordem = snapshot.exists() ? snapshot.val().ordem : 1;
        } else {
            sectionId = `secao_${Date.now()}`;
            // Get next ordem
            const sectionsRef = ref(database, 'secoes');
            const snapshot = await get(sectionsRef);
            if (snapshot.exists()) {
                const sections = Object.values(snapshot.val());
                ordem = Math.max(...sections.map(s => s.ordem || 0)) + 1;
            } else {
                ordem = 1;
            }
        }
        
        const sectionData = {
            id: sectionId,
            titulo: title,
            tipo: type,
            ordem: ordem,
            conteudo: content
        };
        
        const sectionRef = ref(database, `secoes/${sectionId}`);
        await set(sectionRef, sectionData);
        
        closeModals();
        loadSections();
        
    } catch (error) {
        console.error('Erro ao salvar seção:', error);
        alert('Erro ao salvar seção. Tente novamente.');
    }
}

// Handle user save
async function handleUserSave(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const password = formData.get('password');
    const type = formData.get('type');
    
    try {
        const userData = {
            nome: name,
            senha: password,
            tipo: type
        };
        
        const userRef = ref(database, `usuarios/${name}`);
        await set(userRef, userData);
        
        closeModals();
        loadUsers();
        
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro ao salvar usuário. Tente novamente.');
    }
}

// Collect list data
function collectListData(prefix) {
    const items = [];
    const listItems = document.querySelectorAll(`[name^="${prefix}-"]`);
    
    const groupedItems = {};
    listItems.forEach(input => {
        const parent = input.closest('.list-item');
        const index = Array.from(parent.parentNode.children).indexOf(parent);
        
        if (!groupedItems[index]) {
            groupedItems[index] = {};
        }
        
        const fieldName = input.name.replace(`${prefix}-`, '');
        groupedItems[index][fieldName] = input.value;
    });
    
    Object.values(groupedItems).forEach(item => {
        if (Object.values(item).some(value => value.trim() !== '')) {
            items.push(item);
        }
    });
    
    return items;
}

// Close modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentEditingSection = null;
    currentEditingUser = null;
}

// Global functions for dynamic content
window.addFolgaItem = function() {
    const list = document.getElementById('folgas-list');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <input type="text" placeholder="Nome" name="folga-nome">
        <input type="text" placeholder="Projeto" name="folga-projeto">
        <input type="date" name="folga-data">
        <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(item);
};

window.addPlantaoItem = function() {
    const list = document.getElementById('plantao-list');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <input type="text" placeholder="Nome" name="plantao-nome">
        <input type="text" placeholder="Projeto" name="plantao-projeto">
        <input type="text" placeholder="Horário (ex: 08:00 - 17:00)" name="plantao-horario">
        <button type="button" class="btn-danger btn-small" onclick="removeListItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(item);
};

window.removeListItem = function(button) {
    button.closest('.list-item').remove();
};

window.editSection = async function(sectionId) {
    try {
        const sectionRef = ref(database, `secoes/${sectionId}`);
        const snapshot = await get(sectionRef);
        
        if (snapshot.exists()) {
            currentEditingSection = sectionId;
            showSectionModal(snapshot.val());
        }
    } catch (error) {
        console.error('Erro ao carregar seção:', error);
    }
};

window.deleteSection = async function(sectionId) {
    if (confirm('Tem certeza que deseja excluir esta seção?')) {
        try {
            const sectionRef = ref(database, `secoes/${sectionId}`);
            await remove(sectionRef);
            loadSections();
        } catch (error) {
            console.error('Erro ao excluir seção:', error);
            alert('Erro ao excluir seção. Tente novamente.');
        }
    }
};

window.editUser = async function(userName) {
    try {
        const userRef = ref(database, `usuarios/${userName}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentEditingUser = userName;
            showUserModal(snapshot.val());
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
};

window.deleteUser = async function(userName) {
    if (userName === 'HelioGoes') {
        alert('Não é possível excluir o usuário Master.');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            const userRef = ref(database, `usuarios/${userName}`);
            await remove(userRef);
            loadUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário. Tente novamente.');
        }
    }
};

