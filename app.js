// Configuration
const CONFIG = {
    GOOGLE_SHEET_ID: '1dDHPULdfHhdEpawOtOtnsw7NTgYF1LVpCElrCeBFnMU',
    GOOGLE_API_KEY: 'AIzaSyBX5CSWOryaV_88JiBp1QpOca_Anb3OKV8',
    TELEGRAM_BOT_TOKEN: '8571684620:AAHcDilswwxsXZ8jawOpsXumk0gdU49CI90',
    SHEET_RANGE: 'order!A:P', // 16 columns: id -> telegram_user_id
    // Apps Script Web App URL (update after deploying AppScript.js)
    // Note: Set to empty string ('') to disable backend sync and work locally only
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwMgyfzcUE96lZ00zpJ5GiND_hY8CVcFeX1uJz2LVgeY2RlvxwUHMxyKMR65aaTT8BJZQ/exec' // Deploy AppScript.js and paste URL here
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
                    <div class="card-actions">
                        <button class="icon-btn" onclick="viewOrder('${String(order.id)}')" title="Xem chi tiết">👁️</button>
                        <button class="icon-btn" onclick="editOrder('${String(order.id)}')" title="Sửa">✏️</button>
                        <button class="icon-btn icon-btn-delete" onclick="deleteOrder('${String(order.id)}')" title="Xóa">🗑️</button>
                    </div>
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
                <div class="order-footer">
                    <span class="status-badge status-${order.status}">${order.statusText}</span>
                    <span class="order-price">💰 ${formatMoney(order.price)} VNĐ</span>
                </div>
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
        
        console.log('📡 Fetching orders from Google Sheets...');
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        console.log(`📊 Sheet data: ${rows.length} rows (including header)`);
        
        if (rows.length < 2) {
            console.log('⚠️ No data rows in sheet');
            return [];
        }
        
        // Skip header row, map to order objects with new structure
        // 0:id, 1:ten_khach_hang, 2:so_dien_thoai, 3:dia_chi_lay, 4:thoi_gian_lay,
        // 5:dia_chi_giao, 6:thoi_gian_giao, 7:cuoc_phi, 8:khoi_luong, 9:kich_thuoc,
        // 10:hinh_anh, 11:bien_so_xe, 12:ten_tai_xe, 13:trang_thai, 14:thoi_gian_tao, 15:telegram_user_id
        const orders = rows.slice(1).map(row => ({
            id: row[0] || '',
            customerName: row[1] || '',
            phone: row[2] || '',
            pickupAddress: row[3] || '',
            pickupTime: row[4] || '',
            deliveryAddress: row[5] || '',
            deliveryTime: row[6] || '',
            price: parseInt(row[7]) || 0,
            weight: row[8] || '',
            size: row[9] || '',
            image: row[10] || '',
            vehicle: row[11] || '',
            driver: row[12] || '',
            statusText: row[13] || 'Chờ xác nhận',
            status: mapStatus(row[13] || 'Chờ xác nhận'),
            createdAt: row[14] || '',
            userId: row[15] || ''
        }));
        
        console.log(`✅ Loaded ${orders.length} orders from Google Sheets`);
        if (orders.length > 0) {
            console.log('Sample order:', orders[0]);
        }
        return orders;
        
    } catch (error) {
        console.error('❌ Error fetching from Google Sheets:', error);
        showToast('❌ Lỗi tải dữ liệu từ Google Sheets');
        return [];
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
async function loadRoutes(selectedDate = null) {
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
        
        // Group routes by date
        const routesByDate = {};
        routes.forEach(route => {
            const dateKey = route.date ? formatDateKey(route.date) : 'Chưa xác định';
            if (!routesByDate[dateKey]) {
                routesByDate[dateKey] = [];
            }
            routesByDate[dateKey].push(route);
        });
        
        // Get sorted dates
        const dates = Object.keys(routesByDate).sort((a, b) => {
            if (a === 'Chưa xác định') return 1;
            if (b === 'Chưa xác định') return -1;
            return new Date(a) - new Date(b);
        });
        
        // Create date tabs
        const dateTabs = dates.map(date => {
            const count = routesByDate[date].length;
            const isActive = selectedDate ? selectedDate === date : date === dates[0];
            return `
                <button class="date-tab ${isActive ? 'active' : ''}" onclick="filterRoutesByDate('${date}')">
                    <div class="date-tab-date">${formatDateDisplay(date)}</div>
                    <div class="date-tab-count">${count} tuyến</div>
                </button>
            `;
        }).join('');
        
        // Display selected date or first date
        const activeDate = selectedDate || dates[0];
        const activeRoutes = routesByDate[activeDate] || [];
        
        const routesHTML = activeRoutes.map(route => `
            <div class="route-card">
                <div class="route-header">
                    <span class="route-vehicle">🚛 ${route.vehicle}</span>
                    <div class="card-actions">
                        <button class="icon-btn" onclick="viewRoute('${String(route.id)}')" title="Xem chi tiết">👁️</button>
                        <button class="icon-btn" onclick="editRoute('${String(route.id)}')" title="Sửa">✏️</button>
                        <button class="icon-btn icon-btn-delete" onclick="deleteRoute('${String(route.id)}')" title="Xóa">🗑️</button>
                    </div>
                </div>
                <div class="route-info">📍 ${route.route}</div>
                <div class="route-detail">📅 ${route.date || 'Chưa xác định'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${route.progress}%"></div>
                </div>
                <div class="route-footer">
                    <span class="status-badge status-${route.status}">${route.statusText}</span>
                    <span class="progress-label">Tải trọng: ${route.progress}%</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="date-tabs-container">
                <div class="date-tabs">${dateTabs}</div>
            </div>
            <div class="routes-content">
                ${activeRoutes.length > 0 ? routesHTML : '<div class="empty-state"><div class="empty-state-text">Không có tuyến xe nào trong ngày này</div></div>'}
            </div>
        `;
        
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
    const orderForm = document.getElementById('create-order-form');
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createOrder(e.target);
    });
    
    const routeForm = document.getElementById('create-route-form');
    routeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRouteFormSubmit(e.target);
    });
}

// Create Order
async function createOrder(form) {
    const formData = new FormData(form);
    const editingId = form.dataset.editingId;
    
    const orderData = {
        id: editingId || Date.now().toString().slice(-6),
        customerName: formData.get('ten_khach_hang'),
        phone: formData.get('so_dien_thoai'),
        pickupAddress: formData.get('dia_chi_lay'),
        pickupTime: formData.get('thoi_gian_lay'),
        deliveryAddress: formData.get('dia_chi_giao'),
        deliveryTime: formData.get('thoi_gian_giao'),
        price: parseInt(formData.get('cuoc_phi')) || 0,
        weight: formData.get('khoi_luong') || '',
        size: formData.get('kich_thuoc') || '',
        image: formData.get('hinh_anh') || '',
        vehicle: '', // Chưa gán
        driver: '', // Chưa gán
        status: 'pending',
        statusText: 'Chờ xác nhận',
        userId: state.user?.id || 'test',
        createdAt: new Date().toISOString()
    };
    
    try {
        if (editingId) {
            // Update existing order
            console.log('📝 Updating order:', orderData);
            await updateOrder(orderData);
        } else {
            // Create new order
            console.log('📝 Creating order:', orderData);
            
            // Try to save to Google Sheets via Apps Script first
            if (CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
                console.log('💾 Saving to backend...');
                
                // Use timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                try {
                    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'createOrder',
                            order: orderData
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    console.log('📡 Backend response:', result);
                    
                    if (result.success) {
                        console.log('✅ Backend save successful!');
                        
                        // Add to local state after successful backend save
                        state.orders.unshift(orderData);
                        
                        // Render
                        await loadOrders();
                        await loadStats();
                        
                        showToast('✅ Đơn hàng đã tạo thành công!');
                    } else {
                        throw new Error(result.error || 'Backend save failed');
                    }
                    
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    
                    if (fetchError.name === 'AbortError') {
                        console.error('❌ Backend timeout');
                        throw new Error('Hết thời gian kết nối đến backend');
                    } else {
                        console.error('❌ Backend error:', fetchError);
                        throw new Error('Lỗi kết nối backend: ' + fetchError.message);
                    }
                }
            } else {
                console.log('📝 Backend disabled - saving locally only');
                
                // Add to local state
                state.orders.unshift(orderData);
                
                // Render
                await loadOrders();
                await loadStats();
                
                showToast('✅ Đơn hàng đã tạo thành công (local)!');
            }
        }
        
        // Reset form
        form.reset();
        delete form.dataset.editingId;
        
        // Reset form title and button
        document.querySelector('#create-tab .section-header h2').textContent = '➕ Tạo Đơn Mới';
        form.querySelector('button[type="submit"]').textContent = 'Tạo Đơn Hàng';
        
        // Go back to orders tab
        showTab('orders-tab');
        
    } catch (error) {
        console.error('❌ Error creating/updating order:', error);
        showToast('❌ ' + (error.message || 'Lỗi tạo đơn hàng!'));
    }
}

// Fetch Routes from Google Sheets
async function fetchRoutesFromSheet() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.GOOGLE_SHEET_ID}/values/route!A:I?key=${CONFIG.GOOGLE_API_KEY}`;
        
        console.log('📡 Fetching routes from Google Sheets...');
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        console.log(`📊 Routes data: ${rows.length} rows`);
        
        if (rows.length < 2) {
            console.log('⚠️ No routes in sheet');
            return [];
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
        const availableRoutes = routes.filter(r => r.statusText === 'Sẵn sàng' || r.statusText === 'Đang chạy');
        console.log(`✅ Available routes: ${availableRoutes.length}`);
        return availableRoutes;
        
    } catch (error) {
        console.error('❌ Error fetching routes:', error);
        showToast('❌ Lỗi tải tuyến xe');
        return [];
    }
}

// Mock Data (Fallback when Google Sheets fails)
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

// ============= CRUD Operations =============

/**
 * Update Order
 */
async function updateOrder(orderData) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        console.log('📝 Backend disabled - updating locally only');
        
        // Update in local state
        const index = state.orders.findIndex(o => o.id === orderData.id);
        if (index !== -1) {
            state.orders[index] = { ...state.orders[index], ...orderData };
            await loadOrders();
            await loadStats();
            showToast('✅ Đơn hàng đã cập nhật (local)!');
            return { success: true };
        }
        throw new Error('Không tìm thấy đơn hàng');
    }
    
    try {
        console.log('💾 Updating order:', orderData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateOrder',
                order: orderData
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Backend response:', result);
        
        if (result.success) {
            console.log('✅ Backend update successful!');
            
            // Update local state
            const index = state.orders.findIndex(o => o.id === orderData.id);
            if (index !== -1) {
                state.orders[index] = { ...state.orders[index], ...orderData };
            }
            
            await loadOrders();
            await loadStats();
            showToast('✅ Đơn hàng đã cập nhật!');
            return result;
        } else {
            throw new Error(result.error || 'Backend update failed');
        }
        
    } catch (error) {
        console.error('❌ Error updating order:', error);
        throw error;
    }
}

/**
 * Delete Order
 */
async function deleteOrder(orderId) {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
        return;
    }
    
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        console.log('📝 Backend disabled - deleting locally only');
        
        state.orders = state.orders.filter(o => o.id !== orderId);
        await loadOrders();
        await loadStats();
        showToast('✅ Đơn hàng đã xóa (local)!');
        return { success: true };
    }
    
    try {
        console.log('🗑️ Deleting order:', orderId);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deleteOrder',
                orderId: orderId
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Backend response:', result);
        
        if (result.success) {
            console.log('✅ Backend delete successful!');
            
            // Remove from local state
            state.orders = state.orders.filter(o => o.id !== orderId);
            
            await loadOrders();
            await loadStats();
            showToast('✅ Đơn hàng đã xóa!');
            return result;
        } else {
            throw new Error(result.error || 'Backend delete failed');
        }
        
    } catch (error) {
        console.error('❌ Error deleting order:', error);
        showToast('❌ ' + (error.message || 'Lỗi xóa đơn hàng!'));
    }
}

/**
 * Create Route
 */
async function createRoute(routeData) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        console.log('📝 Backend disabled - creating locally only');
        
        state.routes.unshift(routeData);
        await loadRoutes();
        showToast('✅ Tuyến xe đã tạo (local)!');
        return { success: true };
    }
    
    try {
        console.log('📝 Creating route:', routeData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'createRoute',
                route: routeData
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Backend response:', result);
        
        if (result.success) {
            console.log('✅ Backend create successful!');
            
            state.routes.unshift(routeData);
            await loadRoutes();
            showToast('✅ Tuyến xe đã tạo!');
            return result;
        } else {
            throw new Error(result.error || 'Backend create failed');
        }
        
    } catch (error) {
        console.error('❌ Error creating route:', error);
        throw error;
    }
}

/**
 * Update Route
 */
async function updateRoute(routeData) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        console.log('📝 Backend disabled - updating locally only');
        
        const index = state.routes.findIndex(r => r.id === routeData.id);
        if (index !== -1) {
            state.routes[index] = { ...state.routes[index], ...routeData };
            await loadRoutes();
            showToast('✅ Tuyến xe đã cập nhật (local)!');
            return { success: true };
        }
        throw new Error('Không tìm thấy tuyến xe');
    }
    
    try {
        console.log('💾 Updating route:', routeData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateRoute',
                route: routeData
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Backend response:', result);
        
        if (result.success) {
            console.log('✅ Backend update successful!');
            
            const index = state.routes.findIndex(r => r.id === routeData.id);
            if (index !== -1) {
                state.routes[index] = { ...state.routes[index], ...routeData };
            }
            
            await loadRoutes();
            showToast('✅ Tuyến xe đã cập nhật!');
            return result;
        } else {
            throw new Error(result.error || 'Backend update failed');
        }
        
    } catch (error) {
        console.error('❌ Error updating route:', error);
        throw error;
    }
}

/**
 * Delete Route
 */
async function deleteRoute(routeId) {
    if (!confirm('Bạn có chắc muốn xóa tuyến xe này?')) {
        return;
    }
    
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        console.log('📝 Backend disabled - deleting locally only');
        
        state.routes = state.routes.filter(r => r.id !== routeId);
        await loadRoutes();
        showToast('✅ Tuyến xe đã xóa (local)!');
        return { success: true };
    }
    
    try {
        console.log('🗑️ Deleting route:', routeId);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deleteRoute',
                routeId: routeId
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Backend response:', result);
        
        if (result.success) {
            console.log('✅ Backend delete successful!');
            
            state.routes = state.routes.filter(r => r.id !== routeId);
            
            await loadRoutes();
            showToast('✅ Tuyến xe đã xóa!');
            return result;
        } else {
            throw new Error(result.error || 'Backend delete failed');
        }
        
    } catch (error) {
        console.error('❌ Error deleting route:', error);
        showToast('❌ ' + (error.message || 'Lỗi xóa tuyến xe!'));
    }
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
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.editRoute = editRoute;
window.deleteRoute = deleteRoute;
window.viewOrder = viewOrder;
window.viewRoute = viewRoute;
window.closeDetailModal = closeDetailModal;

/**
 * Edit Order - Populate form and switch to edit mode
 */
function editOrder(orderId) {
    const order = state.orders.find(o => String(o.id) === String(orderId));
    if (!order) {
        showToast('❌ Không tìm thấy đơn hàng!');
        return;
    }
    
    // Populate form
    const form = document.getElementById('create-order-form');
    form.querySelector('[name="ten_khach_hang"]').value = order.customerName;
    form.querySelector('[name="so_dien_thoai"]').value = order.phone;
    form.querySelector('[name="dia_chi_lay"]').value = order.pickupAddress;
    form.querySelector('[name="thoi_gian_lay"]').value = order.pickupTime;
    form.querySelector('[name="dia_chi_giao"]').value = order.deliveryAddress;
    form.querySelector('[name="thoi_gian_giao"]').value = order.deliveryTime;
    form.querySelector('[name="cuoc_phi"]').value = order.price;
    form.querySelector('[name="khoi_luong"]').value = order.weight;
    form.querySelector('[name="kich_thuoc"]').value = order.size;
    form.querySelector('[name="hinh_anh"]').value = order.image;
    
    // Store order ID for update
    form.dataset.editingId = orderId;
    
    // Change form title
    document.querySelector('#create-tab .section-header h2').textContent = '✏️ Sửa Đơn Hàng';
    
    // Change button text
    form.querySelector('button[type="submit"]').textContent = 'Cập Nhật Đơn Hàng';
    
    // Switch to form tab
    showTab('create-tab');
    
    showToast('📝 Đang chỉnh sửa đơn hàng #' + orderId);
}

/**
 * Edit Route - Show prompt for simple edit
 */
function editRoute(routeId) {
    const route = state.routes.find(r => String(r.id) === String(routeId));
    if (!route) {
        showToast('❌ Không tìm thấy tuyến xe!');
        return;
    }
    
    const newStatus = prompt('Cập nhật trạng thái tuyến xe:\n1. Sẵn sàng\n2. Đang chạy\n\nNhập số (1 hoặc 2):', 
        route.statusText === 'Đang chạy' ? '2' : '1');
    
    if (newStatus === null) return; // User cancelled
    
    const statusMap = {
        '1': 'Sẵn sàng',
        '2': 'Đang chạy'
    };
    
    const newProgress = prompt('Cập nhật tải trọng (%):', route.progress);
    
    if (newProgress === null) return; // User cancelled
    
    const updatedRoute = {
        ...route,
        statusText: statusMap[newStatus] || route.statusText,
        status: statusMap[newStatus] === 'Đang chạy' ? 'shipping' : 'pending',
        progress: parseInt(newProgress) || route.progress
    };
    
    updateRoute(updatedRoute).catch(error => {
        showToast('❌ ' + (error.message || 'Lỗi cập nhật tuyến xe!'));
    });
}

/**
 * Handle Route Form Submit - Create or Update
 */
async function handleRouteFormSubmit(form) {
    const formData = new FormData(form);
    
    const routeData = {
        id: Date.now().toString().slice(-6),
        vehicle: formData.get('vehicle'),
        route: formData.get('route'),
        capacity: formData.get('capacity'),
        weight: formData.get('weight'),
        date: formData.get('date'),
        statusText: formData.get('statusText') || 'Sẵn sàng',
        status: formData.get('statusText') === 'Đang chạy' ? 'shipping' : 'pending',
        progress: parseInt(formData.get('progress')) || 0,
        createdAt: new Date().toISOString()
    };
    
    try {
        await createRoute(routeData);
        
        // Reset form
        form.reset();
        
        // Go back to routes tab
        showTab('routes-tab');
        
    } catch (error) {
        console.error('❌ Error creating route:', error);
        showToast('❌ ' + (error.message || 'Lỗi tạo tuyến xe!'));
    }
}

/**
 * View Order Details - Show in modal
 */
function viewOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) {
        showToast('❌ Không tìm thấy đơn hàng!');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `Chi tiết đơn hàng #${order.id}`;
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Trạng thái:</span>
                <span class="status-badge status-${order.status}">${order.statusText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👤 Tên khách hàng:</span>
                <span class="detail-value">${order.customerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📞 Số điện thoại:</span>
                <span class="detail-value">${order.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📍 Địa chỉ lấy hàng:</span>
                <span class="detail-value">${order.pickupAddress}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏰ Thời gian lấy:</span>
                <span class="detail-value">${order.pickupTime || 'Chưa xác định'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📍 Địa chỉ giao hàng:</span>
                <span class="detail-value">${order.deliveryAddress}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏰ Thời gian giao:</span>
                <span class="detail-value">${order.deliveryTime || 'Chưa xác định'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">💰 Cước phí:</span>
                <span class="detail-value highlight">${formatMoney(order.price)} VNĐ</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⚖️ Khối lượng:</span>
                <span class="detail-value">${order.weight || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📏 Kích thước:</span>
                <span class="detail-value">${order.size || 'N/A'}</span>
            </div>
            ${order.vehicle ? `
                <div class="detail-row">
                    <span class="detail-label">🚛 Biển số xe:</span>
                    <span class="detail-value">${order.vehicle}</span>
                </div>
            ` : ''}
            ${order.driver ? `
                <div class="detail-row">
                    <span class="detail-label">👨‍✈️ Tài xế:</span>
                    <span class="detail-value">${order.driver}</span>
                </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">📅 Ngày tạo:</span>
                <span class="detail-value">${new Date(order.createdAt).toLocaleString('vi-VN')}</span>
            </div>
        </div>
    `;
    
    // Show modal
    document.getElementById('detail-modal').classList.add('show');
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

/**
 * View Route Details - Show in modal
 */
function viewRoute(routeId) {
    const route = state.routes.find(r => String(r.id) === String(routeId));
    if (!route) {
        showToast('❌ Không tìm thấy tuyến xe!');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `Chi tiết tuyến xe ${route.vehicle}`;
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">Trạng thái:</span>
                <span class="status-badge status-${route.status}">${route.statusText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🚛 Biển số xe:</span>
                <span class="detail-value">${route.vehicle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📍 Tuyến đường:</span>
                <span class="detail-value">${route.route}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📦 Sức chứa:</span>
                <span class="detail-value">${route.capacity || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⚖️ Khối lượng:</span>
                <span class="detail-value">${route.weight || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📅 Ngày xuất phát:</span>
                <span class="detail-value">${route.date || 'Chưa xác định'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📈 Tải trọng:</span>
                <span class="detail-value">
                    <div class="progress-bar" style="display: inline-block; width: 150px; vertical-align: middle; margin-left: 10px;">
                        <div class="progress-fill" style="width: ${route.progress}%"></div>
                    </div>
                    <span style="margin-left: 10px;">${route.progress}%</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📅 Ngày tạo:</span>
                <span class="detail-value">${new Date(route.createdAt).toLocaleString('vi-VN')}</span>
            </div>
        </div>
    `;
    
    // Show modal
    document.getElementById('detail-modal').classList.add('show');
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Close Detail Modal
 */
function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('show');
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Filter routes by date
 */
function filterRoutesByDate(date) {
    loadRoutes(date);
    
    // Haptic feedback
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Format date key for grouping (YYYY-MM-DD)
 */
function formatDateKey(dateString) {
    if (!dateString) return 'Chưa xác định';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Chưa xác định';
        return date.toISOString().split('T')[0];
    } catch (e) {
        return 'Chưa xác định';
    }
}

/**
 * Format date for display
 */
function formatDateDisplay(dateString) {
    if (dateString === 'Chưa xác định') return dateString;
    try {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Check if today
        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        }
        
        // Check if tomorrow
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Ngày mai';
        }
        
        // Format as dd/mm
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    } catch (e) {
        return dateString;
    }
}
