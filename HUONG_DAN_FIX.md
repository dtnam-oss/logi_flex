# Hướng Dẫn Fix Lỗi Load Dữ Liệu

## ⚠️ Vấn Đề Hiện Tại

Sheet "order" của bạn có **14 cột** thay vì **13 cột** như code mong đợi:
- **Mong đợi**: `telegram_user_id` ở cột M (index 12)
- **Thực tế**: `telegram_user_id` ở cột N (index 13)

→ Điều này khiến filter không tìm được orders của user.

---

## ✅ Giải Pháp (Chọn 1 trong 4)

### **Cách 1: Fix tất cả trong 1 lần (Dễ NHẤT)** 🚀⭐

1. Mở **Apps Script Editor** (Extensions → Apps Script)
2. Click vào file **Database.js**
3. Tìm function `fixAllOrderIssues()` (ở cuối file)
4. Click vào tên function và nhấn **Run** (▶️)
5. Cho phép quyền nếu được hỏi
6. Xem logs để kiểm tra kết quả (View → Logs)
   - Phải thấy: `✅ Sheet structure is CORRECT!` và `✅ Filter is WORKING!`
7. **Deploy lại** Web App (Deploy → Manage Deployments → ✏️ Edit → New Version → Deploy)

### **Cách 2: Tự động fix từng bước**

1. Mở **Apps Script Editor** (Extensions → Apps Script)
2. Click vào file **Database.js**
3. Tìm function `resetOrderSheet()`
4. Click vào tên function và nhấn **Run** (▶️)
5. Cho phép quyền nếu được hỏi
6. Sau khi chạy xong, tiếp tục chạy function `addTestData()` để thêm dữ liệu mẫu
7. **Deploy lại** Web App (Deploy → Manage Deployments → ✏️ Edit → New Version → Deploy)

### **Cách 3: Xóa cột thừa thủ công**

1. Mở Google Sheet
2. Vào sheet "order"
3. Xác định cột nào là cột thừa (giữa cột "thoi_gian_tao" và "telegram_user_id")
4. Right-click vào cột đó → Delete column
5. Kiểm tra lại header có đúng 13 cột theo thứ tự:
   ```
   id | ten_khach_hang | so_dien_thoai | dia_chi_lay | thoi_gian_lay |
   dia_chi_giao | thoi_gian_giao | cuoc_phi | bien_so_xe | ten_tai_xe |
   trang_thai | thoi_gian_tao | telegram_user_id
   ```

### **Cách 4: Tạo lại sheet từ đầu**

1. Mở **Apps Script Editor**
2. Xóa sheet "order" trong Google Sheet
3. Chạy function `initializeSpreadsheet()`
4. Chạy function `addTestData()` để thêm dữ liệu mẫu

---

## 🔍 Kiểm Tra Sau Khi Fix

1. **Deploy lại Web App**:
   - Deploy → Manage Deployments
   - Click ✏️ Edit
   - Version: New version
   - Click Deploy
   - Copy URL mới (nếu có)

2. **Test trong Telegram**:
   - Mở Mini App
   - Kiểm tra Debug Console (màn hình đen ở dưới)
   - Xem logs có hiển thị orders không

3. **Kiểm tra Sheet**:
   - Đảm bảo có đúng 13 cột
   - Cột cuối cùng (M) phải là `telegram_user_id`
   - Dữ liệu test có `telegram_user_id = 123456`

---

## 📋 Debug Logs Mẫu (Khi Thành Công)

```
[16:20:30] 📞 Fetching orders for user: 123456
[16:20:30] 🔍 apiGet: getOrdersByUserId, args: [123456]
[16:20:30] Method: google.script.run
[16:20:33] ✅ Orders received: 1 items  ← PHẢI > 0
[16:20:33] Sample order: {"id":"100001","ten_khach_hang":"Nguyễn Văn A",...}
```

---

## ❓ Nếu Vẫn Lỗi

Gửi cho tôi:
1. Screenshot Debug Console
2. Screenshot header của sheet "order" (row 1)
3. Screenshot 1 dòng dữ liệu trong sheet "order" (row 2)

---

## 📝 Ghi Chú

- **Luôn Deploy lại** sau mỗi lần sửa code
- **Clear cache** trình duyệt nếu cần: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
- Debug Console có thể ẩn bằng nút X ở góc trên
