# 🚀 Hướng Dẫn Deploy Sau Khi Fix

## ⚠️ VẤN ĐỀ HIỆN TẠI

Bạn đã chạy `fixAllOrderIssues()` thành công và Google Sheet đã có data, nhưng web app vẫn hiển thị **0 items**.

**Nguyên nhân**: Web app deployment chưa được cập nhật sau khi chạy fix function.

---

## ✅ GIẢI PHÁP: Deploy Lại Web App

### Bước 1: Mở Apps Script Editor
1. Mở Google Sheet của bạn
2. Click **Extensions → Apps Script**

### Bước 2: Deploy New Version
1. Trong Apps Script Editor, click **Deploy** ở góc trên bên phải
2. Chọn **Manage deployments**
3. Sẽ thấy danh sách deployments hiện tại
4. Click vào icon **✏️ (Edit)** bên cạnh deployment đang active
5. Trong phần **Version**, click dropdown và chọn **New version**
6. Trong **Description**, nhập: `Fix getAllOrders with enhanced logging`
7. Click **Deploy**
8. Đợi deploy hoàn tất (5-10 giây)
9. Click **Done**

### Bước 3: Clear Browser Cache
1. Đóng tất cả tab web app
2. Clear cache:
   - **Windows/Linux**: Ctrl + Shift + Delete → Clear browsing data
   - **Mac**: Cmd + Shift + Delete → Clear browsing data
   - **Hoặc**: Ctrl+Shift+R / Cmd+Shift+R (hard reload)

### Bước 4: Test Lại
1. Mở lại Web App URL (production URL ending với `/exec`)
2. Kiểm tra **Debug Console** (màn hình đen ở dưới)
3. Xem logs phải hiển thị:
   ```
   [getAllOrders] Getting ALL orders. Total: 1
   [getAllOrders] Sample order: {"id":"100001","ten_khach_hang":"Nguyễn Văn A",...}
   ✅ Orders received: 1 items
   ```

---

## 🔍 KIỂM TRA THÊM

### Nếu vẫn thấy "0 items" sau khi deploy:

#### Option 1: Kiểm Tra Data Trong Sheet
1. Mở Google Sheet
2. Vào tab **"order"**
3. Kiểm tra:
   - Row 1 (header) có đúng 13 cột
   - Row 2 có data test (id: 100001, Nguyễn Văn A)
   - Cột M (cuối cùng) là **telegram_user_id** với giá trị `123456`

**Nếu KHÔNG có data ở row 2**:
```javascript
// Chạy trong Apps Script Editor:
addTestData()
```
Sau đó deploy lại (Bước 2 ở trên).

#### Option 2: Test API Trực Tiếp
Mở URL này trong browser:
```
https://script.google.com/macros/s/AKfycbzsmGkEIjsYgpn_kU9K2lhDnSwwrdEfIMiLudk7cxweNzhzoxBzFsNPa3urQQaNipep0GQ/exec?action=getAllOrders
```

**Kết quả mong đợi**:
```json
[
  {
    "id": "100001",
    "ten_khach_hang": "Nguyễn Văn A",
    "so_dien_thoai": "909123456",
    ...
    "telegram_user_id": 123456
  }
]
```

**Nếu trả về `[]` (empty array)**:
- Data chưa được add vào sheet
- Chạy `addTestData()` trong Apps Script
- Deploy lại

---

## 🐛 DEBUG NÂNG CAO

### Xem Logs Chi Tiết Trong Apps Script

1. Trong Apps Script Editor, chọn function **getAllOrders** từ dropdown
2. Click **Run** (▶️)
3. Click **View → Execution log**
4. Xem logs hiển thị:
   ```
   [getAllOrders] Getting ALL orders. Total: 1
   [getAllOrders] Sample order: {...}
   [getAllOrders] First order keys: [...]
   ```

**Nếu thấy**:
```
[getAllOrders] WARNING: No orders found in sheet!
[getAllOrders] Raw sheet rows: 1
```
→ Nghĩa là chỉ có header, không có data row → Chạy `addTestData()`

**Nếu thấy**:
```
[getAllOrders] Raw sheet rows: 2
[getAllOrders] Raw header: [id, ten_khach_hang, ...]
[getAllOrders] Raw row 2: [100001, Nguyễn Văn A, ...]
```
→ Nghĩa là sheet có data, nhưng `getDataFromSheet()` đang parse sai → Cần check thêm

---

## 📝 CHECKLIST

- [ ] Đã chạy `fixAllOrderIssues()` trong Apps Script
- [ ] Logs hiển thị "✅ Filter is WORKING!"
- [ ] Google Sheet có 13 cột trong tab "order"
- [ ] Row 2 có data test (Nguyễn Văn A)
- [ ] **Deploy new version** trong Apps Script (QUAN TRỌNG!)
- [ ] Clear browser cache
- [ ] Mở lại web app với production URL (/exec)
- [ ] Debug Console hiển thị "Orders received: 1 items"
- [ ] Tab Đơn Hàng hiển thị order test

---

## ❓ NẾU VẪN KHÔNG ĐƯỢC

Chụp screenshots sau và báo lại:

1. **Apps Script Execution Log** khi run `getAllOrders()`:
   - Chọn function getAllOrders
   - Click Run
   - View → Execution log
   - Screenshot toàn bộ logs

2. **Google Sheet - Tab Order**:
   - Screenshot rows 1-2 (header + data row)
   - Đảm bảo thấy tất cả 13 cột (A đến M)

3. **Web App Debug Console**:
   - Screenshot phần debug console ở dưới web app
   - Phải thấy logs từ `debugLog()`

4. **Test API URL Result**:
   - Mở URL: `https://script.google.com/.../exec?action=getAllOrders`
   - Screenshot kết quả JSON

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi deploy lại, web app sẽ hiển thị:

### Tab Đơn Hàng:
```
📦 Danh Sách Đơn Hàng

┌─────────────────────────────────┐
│ #100001                         │
│ Nguyễn Văn A - 909123456       │
│ 📍 123 Nguyễn Huệ, Q1          │
│ 🎯 456 Lê Lợi, Q3               │
│ 🏷️ 150,000đ                    │
│ 🚚 Đang giao                    │
│ 🚙 29A-12345 - Nguyễn Văn Tài  │
└─────────────────────────────────┘
```

### Debug Console:
```
[23:45:12] 📞 Fetching ALL orders (no filter)
[23:45:13] [getAllOrders] Getting ALL orders. Total: 1
[23:45:13] [getAllOrders] Sample order: {"id":"100001",...}
[23:45:13] ✅ Orders received: 1 items
```

---

## 🚀 DONE!

Nếu thấy đúng như trên → App đã hoạt động!

Có thể:
- Thêm data thật vào Google Sheet
- Test tạo đơn mới
- Share với users khác
