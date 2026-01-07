// Configuration
const CONFIG = {
    GOOGLE_SHEET_ID: '1dDHPULdfHhdEpawOtOtnsw7NTgYF1LVpCElrCeBFnMU',
    GOOGLE_API_KEY: 'AIzaSyBX5CSWOryaV_88JiBp1QpOca_Anb3OKV8',
    TELEGRAM_BOT_TOKEN: '8571684620:AAHcDilswwxsXZ8jawOpsXumk0gdU49CI90',
    SHEET_RANGE: 'order!A:M' // Range for orders data
};

// State Management
const state = {
    user: null,
    orders: [],
    routes: [],
    isLoading: false
};

// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('🚀 Initializing LogiFlex App...');
    
    // Initialize Telegram WebApp
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Get user data
        const user = tg.initDataUnsafe?.user;
        if (user) {
            state.user = user;
            document.getElementById('userName').textContent = user.first_name || 'Người dùng';
        }
        
        console.log('✅ Telegram WebApp initialized', state.user);
    } else {
        // Test mode
        console.warn('⚠️ Not in Telegram, using test mode');
        state.user = { id: 123456, first_name: 'Test User' };
        document.getElementById('userName').textContent = 'Test User';
    }
    
    // Load data
    await loadAllData();
    
    // Hide loading, show app
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    
    // Setup form handlers
    setupFormHandlers();
}

// Load all data
async function loadAllData() {
    try {
        await Promise.all([
            loadOrders(),
            loadRoutes(),
            loadStats()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Lỗi tải dữ liệu. Vui lòng thử lại!');
    }
}

// Load Orders from Google Sheets
async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<div style="text-align:center;padding:20px">Đang tải...</div>';
    
    try {
        // Load from Google Sheets API
        const orders = await fetchOrdersFromSheet();
        state.orders = orders;
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">Chưa có đơn hàng nào</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="status-badge status-${order.status}">${order.statusText}</span>
                </div>
                <div class="order-info">
                    <div class="order-info-row">
                        <span>👤</span>
                        <span>${order.customerName}</span>
                    </div>
                    <div class="order-info-row">
                        <span>📞</span>
                        <span>${order.phone}</span>
                    </div>
                    <div class="order-info-row">
                        <span>📍</span>
                        <span>${order.pickupAddress}</span>
                    </div>
                    <div class="order-info-row">
                        <span>🎯</span>
                        <span>${order.deliveryAddress}</span>
                    </div>
                </div>
                <div class="order-price">💰 ${formatMoney(order.price)} VNĐ</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text" style="color:red">Lỗi tải dữ liệu</div>
            </div>
        `;
    }
}

// Fetch Orders from Google Sheets
async function fetchOrdersFromSheet() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.GOOGLE_SHEET_ID}/values/${CONFIG.SHEET_RANGE}?key=${CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        if (rows.length < 2) {
            console.log('No data in sheet');
            return getMockOrders(); // Fallback to mock data
        }
        
        // Skip header row, map to order objects
        const orders = rows.slice(1).map(row => ({
            id: row[0] || '',
            customerName: row[1] || '',
            phone: row[2] || '',
            pickupAddress: row[3] || '',
            pickupTime: row[4] || '',
            deliveryAddress: row[5] || '',
            deliveryTime: row[6] || '',
            price: parseInt(row[7]) || 0,
            vehicle: row[8] || '',
            driver: row[9] || '',
            statusText: row[10] || 'Chờ xác nhận',
            status: mapStatus(row[10] || 'Chờ xác nhận'),
            createdAt: row[11] || '',
            userId: row[12] || ''
        }));
        
        console.log(`✅ Loaded ${orders.length} orders from Google Sheets`);
        return orders;
        
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        showToast('⚠️ Đang dùng dữ liệu mẫu');
        return getMockOrders(); // Fallback to mock data
    }
}

// Map status text to status code
function mapStatus(statusText) {
    const statusMap = {
        'Chờ xác nhận': 'pending',
        'Đã xác nhận': 'confirmed',
        'Đang giao': 'shipping',
        'Hoàn thành': 'completed',
        'Hủy': 'cancelled'
    };
    return statusMap[statusText] || 'pending';
}

// Load Routes
async function loadRoutes() {
    const container = document.getElementById('routes-list');
    container.innerHTML = '<div style="text-align:center;padding:20px">Đang tải...</div>';
    
    try {
        // Load routes from sheet or use mock
        const routes = await fetchRoutesFromSheet();
        state.routes = routes;
        
        if (routes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚚</div>
                    <div class="empty-state-text">Không có tuyến xe nào</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = routes.map(route => `
            <div class="route-card">
                <div class="route-header">
                    <span class="route-vehicle">🚛 ${route.vehicle}</span>
                    <span class="status-badge status-${route.status}">${route.statusText}</span>
                </div>
                <div class="route-info">📍 ${route.route}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${route.progress}%"></div>
                </div>
                <div class="progress-label">Tải trọng: ${route.progress}%</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading routes:', error);
        container.innerHTML = `<div class="empty-state"><div class="empty-state-text" style="color:red">Lỗi tải dữ liệu</div></div>`;
    }
}

// Load Stats
async function loadStats() {
    try {
        // Calculate stats from orders
        const stats = {
            total: state.orders.length,
            pending: state.orders.filter(o => o.status === 'pending').length,
            shipping: state.orders.filter(o => o.status === 'shipping').length,
            completed: state.orders.filter(o => o.status === 'completed').length
        };
        
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-pending').textContent = stats.pending;
        document.getElementById('stat-shipping').textContent = stats.shipping;
        document.getElementById('stat-completed').textContent = stats.completed;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Setup Form Handlers
function setupFormHandlers() {
    const form = document.getElementById('create-order-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createOrder(e.target);
    });
}

// Create Order
async function createOrder(form) {
    const formData = new FormData(form);
    const orderData = {
        id: Date.now().toString().slice(-6),
        customerName: formData.get('ten_khach_hang'),
        phone: formData.get('so_dien_thoai'),
        pickupAddress: formData.get('dia_chi_lay'),
        pickupTime: formData.get('thoi_gian_lay'),
        deliveryAddress: formData.get('dia_chi_giao'),
        deliveryTime: formData.get('thoi_gian_giao'),
        price: formData.get('cuoc_phi'),
        status: 'pending',
        statusText: 'Chờ xác nhận',
        userId: state.user?.id || 'test',
        createdAt: new Date().toISOString()
    };
    
    try {
        // TODO: Save to Google Sheets via API
        console.log('Creating order:', orderData);
        
        // Add to local state
        state.orders.unshift(orderData);
   Fetch Routes from Google Sheets
async function fetchRoutesFromSheet() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.GOOGLE_SHEET_ID}/values/route!A:I?key=${CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        if (rows.length < 2) {
            return getMockRoutes();
        }
        
        const routes = rows.slice(1).map(row => ({
            id: row[0] || '',
            vehicle: row[1] || '',
            route: row[2] || '',
            capacity: row[3] || '',
            weight: row[4] || '',
            date: row[5] || '',
            statusText: row[6] || 'Sẵn sàng',
            status: row[6] === 'Đang chạy' ? 'shipping' : 'pending',
            progress: parseInt(row[7]) || 0,
            createdAt: row[8] || ''
        }));
        
        console.log(`✅ Loaded ${routes.length} routes from Google Sheets`);
        return routes.filter(r => r.statusText === 'Sẵn sàng' || r.statusText === 'Đang chạy');
        
    } catch (error) {
        console.error('Error fetching routes:', error);
        return getMockRoutes();
    }
}

// Mock Data (Fallback when Google Sheets fails
        // Show success
        showToast('✅ Tạo đơn hàng thành công!');
        
        // Reset form
        form.reset();
        
        // Reload data
        await loadOrders();
        await loadStats();
        
        // Go back to orders tab
        showTab('orders-tab');
        
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('❌ Lỗi tạo đơn hàng!');
    }
}

// Tab Navigation
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Show Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format Money
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Mock Data (Temporary - sẽ thay bằng Google Sheets API)
function getMockOrders() {
    return [
        {
            id: '100001',
            customerName: 'Nguyễn Văn A',
            phone: '0909123456',
            pickupAddress: '123 Nguyễn Huệ, Q1, HCM',
            deliveryAddress: '456 Lê Lợi, Q3, HCM',
            price: 500000,
            status: 'shipping',
            statusText: 'Đang giao'
        },
        {
            id: '100002',
            customerName: 'Trần Thị B',
            phone: '0909234567',
            pickupAddress: '789 Trần Hưng Đạo, Q5, HCM',
            deliveryAddress: '321 Võ Văn Tần, Q3, HCM',
            price: 350000,
            status: 'pending',
            statusText: 'Chờ xác nhận'
        }
    ];
}

function getMockRoutes() {
    return [
        {
            vehicle: '29A-12345',
            route: 'HCM - Hà Nội',
            progress: 65,
            status: 'shipping',
            statusText: 'Đang chạy'
        },
        {
            vehicle: '51B-67890',
            route: 'HCM - Đà Nẵng',
            progress: 30,
            status: 'shipping',
            statusText: 'Đang chạy'
        }
    ];
}

// Export for global access
window.showTab = showTab;
