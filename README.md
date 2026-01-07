# 🚚 Logistic Telegram Mini App

Ứng dụng quản lý đơn hàng và tuyến xe logistic tích hợp với Telegram Bot.

## 📋 Tổng Quan Dự Án

### Backend
- **Google Apps Script (GAS)** - Server-side logic
- **Google Sheets** - Database (3 sheets: orders, routes, users)
- **Telegram Bot API** - Webhook integration

### Frontend
- **HTML/CSS/JavaScript** - Telegram Mini App UI
- **Telegram WebApp SDK** - Native integration
- **Dual API Mode** - google.script.run hoặc Fetch API

---

## 📁 Cấu Trúc File

```
logifex_test/
├── Code.js           # Main entry point (doGet, doPost)
├── Config.js         # Configuration & constants
├── Database.js       # Data access layer
├── TelegramBot.js    # Bot command handlers
├── index.html        # Main UI structure
├── script.html       # Frontend JavaScript
├── styles.html       # CSS styling
├── HUONG_DAN_FIX.md # Hướng dẫn fix lỗi
└── DEBUG_VISUAL.md  # Visualize vấn đề
```

---

## 🚀 Setup Ban Đầu

### 1. Tạo Google Sheet
1. Tạo một Google Sheet mới
2. Copy Spreadsheet ID từ URL

### 2. Setup Apps Script
1. Mở **Extensions → Apps Script**
2. Tạo các file: Code.js, Config.js, Database.js, TelegramBot.js
3. Tạo các file HTML: index.html, script.html, styles.html
4. Cập nhật `CONFIG.SPREADSHEET_ID` trong Config.js

### 3. Deploy Web App
1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Copy Web App URL

### 4. Setup Telegram Bot
1. Tạo bot với [@BotFather](https://t.me/BotFather)
2. Copy Bot Token
3. Cập nhật `CONFIG.BOT_TOKEN` trong Config.js
4. Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEB_APP_URL>`
5. Set Web App URL: `/setmenubutton` với BotFather

### 5. Khởi tạo Database
```javascript
// Chạy trong Apps Script Editor:
initializeSpreadsheet()  // Tạo structure 3 sheets
addTestData()            // Thêm dữ liệu test
```

---

## 🐛 Troubleshooting

### ❌ Vấn Đề: Data không load lên web app

**Triệu chứng:**
- Orders list trống (0 items)
- Routes không hiển thị
- Debug console show: "Orders received: 0 items"

**Nguyên nhân:**
Sheet "order" có 14 cột thay vì 13 cột → telegram_user_id ở sai vị trí

**✅ Giải pháp:**
```javascript
// Chạy trong Apps Script Editor:
fixAllOrderIssues()  // Fix tất cả trong 1 lần
```

→ Xem chi tiết: [HUONG_DAN_FIX.md](HUONG_DAN_FIX.md)
→ Xem visualize: [DEBUG_VISUAL.md](DEBUG_VISUAL.md)

---

## 🔧 Debug Tools

### 1. Apps Script Console Logs
```javascript
// Chạy để xem raw data:
debugSheetData()

// Fix route IDs nếu thiếu:
fixRouteIds()
```

### 2. Web App Debug Console
- Debug console hiển thị ở dưới cùng màn hình
- Có thể ẩn bằng nút X
- Hiển thị tất cả API calls và responses

### 3. Test API Endpoints
```
GET ?action=getRoutes
GET ?action=getAvailableRoutes
GET ?action=getOrders&telegram_user_id=123456
GET ?action=getUserStats&telegram_user_id=123456
GET ?action=debug
GET ?action=fixRouteIds
```

---

## 📊 Database Schema

### Sheet: orders (13 cột)
```
A: id
B: ten_khach_hang
C: so_dien_thoai
D: dia_chi_lay
E: thoi_gian_lay
F: dia_chi_giao
G: thoi_gian_giao
H: cuoc_phi
I: bien_so_xe
J: ten_tai_xe
K: trang_thai
L: thoi_gian_tao
M: telegram_user_id  ← QUAN TRỌNG: Phải ở cột M (index 12)
```

### Sheet: routes (9 cột)
```
A: id
B: bien_so_xe
C: tuyen
D: the_tich
E: tai_trong
F: ngay_khoi_hanh
G: trang_thai
H: da_su_dung
I: thoi_gian_tao
```

### Sheet: users (7 cột)
```
A: telegram_id
B: username
C: first_name
D: last_name
E: role
F: created_at
G: last_active
```

---

## 🔑 Key Functions

### Database.js
- `getSheet(sheetName)` - Get sheet by name
- `getDataFromSheet(sheetName)` - Convert sheet data to array of objects
- `createOrder(data)` - Create new order
- `getOrdersByUserId(telegramUserId)` - Filter orders by user
- `getAvailableRoutes()` - Get routes with status "Sẵn sàng" or "Đang chạy"
- `fixAllOrderIssues()` - Fix sheet structure + add test data + verify

### Code.js
- `doGet(e)` - Handle GET requests (Web App + API)
- `doPost(e)` - Handle POST requests (Telegram webhook + API)
- `include(filename)` - Include HTML partials

### TelegramBot.js
- `handleTelegramUpdate(data)` - Route telegram updates
- `sendMessage(chatId, text, options)` - Send telegram message

---

## 📱 Features

### Cho User/Staff:
- ✅ Xem danh sách đơn hàng của mình
- ✅ Tạo đơn hàng mới
- ✅ Xem tuyến xe available
- ✅ Xem thống kê cá nhân
- ✅ Tương tác qua Telegram Bot

### Cho Admin (TODO):
- ⏳ Xem tất cả đơn hàng
- ⏳ Assign đơn hàng cho tuyến xe
- ⏳ Quản lý routes
- ⏳ Quản lý users

---

## 🎨 UI Components

### Tabs:
1. **Đơn Hàng** (📦) - List orders
2. **Tuyến Xe** (🚚) - List routes
3. **Tạo Đơn** (➕) - Create order form
4. **Cá Nhân** (👤) - User profile & stats

### Theme:
- Sử dụng Telegram theme variables
- Dark/Light mode tự động
- Responsive design

---

## 🔐 Security Notes

- Web App: "Anyone" access (Telegram Mini App requires this)
- Authentication: Via `telegram_user_id` from Telegram WebApp
- Role-based access: Staff / Admin (TODO: implement fully)

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Basic CRUD for orders
- ✅ Routes listing
- ✅ User stats
- ✅ Telegram bot integration
- ✅ Debug tools
- ✅ Fix column structure issue

### TODO:
- ⏳ Admin dashboard
- ⏳ Order assignment to routes
- ⏳ Real-time notifications
- ⏳ Image upload for orders
- ⏳ GPS tracking

---

## 📞 Support

Nếu gặp vấn đề:
1. Check [HUONG_DAN_FIX.md](HUONG_DAN_FIX.md)
2. Check [DEBUG_VISUAL.md](DEBUG_VISUAL.md)
3. Run `fixAllOrderIssues()` trong Apps Script
4. Check Debug Console trong web app
5. Check Apps Script logs (View → Logs)

---

## 📄 License

Internal tool - No public license
