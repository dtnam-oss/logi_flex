# ✅ Checklist Fix Lỗi Load Data

## 🎯 Mục Tiêu
Fix lỗi orders và routes không load lên web app do sheet structure sai.

---

## 📝 Các Bước Thực Hiện

### Bước 1: Backup Data Hiện Tại (Optional)
- [ ] Mở Google Sheet
- [ ] Copy data trong sheet "order" sang sheet khác (nếu có data quan trọng)
- [ ] Copy data trong sheet "route" sang sheet khác (nếu cần)

### Bước 2: Run Fix Function
- [ ] Mở Google Sheet
- [ ] Click **Extensions → Apps Script**
- [ ] Trong Apps Script Editor, click vào file **Database.js**
- [ ] Tìm function `fixAllOrderIssues()` (ở cuối file, line ~373)
- [ ] Click vào tên function
- [ ] Click nút **Run** (▶️) ở toolbar
- [ ] Nếu hỏi quyền → Click **Review Permissions** → Chọn account → **Allow**

### Bước 3: Kiểm Tra Logs
- [ ] Click **View → Logs** hoặc **Execution log**
- [ ] Kiểm tra output có các dòng sau:
  ```
  ✅ Sheet structure is CORRECT!
  ✅ Filter is WORKING!
  Found orders for user 123456: 1
  ```
- [ ] Nếu thấy ❌ hoặc có lỗi → Screenshot và báo lại

### Bước 4: Kiểm Tra Sheet Structure
- [ ] Quay lại Google Sheet
- [ ] Vào sheet **"order"**
- [ ] Kiểm tra header row (row 1) có **đúng 13 cột**:
  ```
  id | ten_khach_hang | so_dien_thoai | dia_chi_lay | thoi_gian_lay |
  dia_chi_giao | thoi_gian_giao | cuoc_phi | bien_so_xe | ten_tai_xe |
  trang_thai | thoi_gian_tao | telegram_user_id
  ```
- [ ] Cột cuối cùng (cột M) phải là **telegram_user_id**
- [ ] Có 1 row data test với `id = 100001`

### Bước 5: Deploy Web App Mới
- [ ] Trong Apps Script Editor, click **Deploy → Manage deployments**
- [ ] Click nút **✏️ (Edit)** bên cạnh deployment hiện tại
- [ ] Trong phần **Version**, chọn **New version**
- [ ] Nhập description: "Fix column structure issue"
- [ ] Click **Deploy**
- [ ] Đợi deploy xong → Có thể test ngay

### Bước 6: Test Web App
- [ ] Mở link Web App trong browser (hoặc trong Telegram)
- [ ] Kiểm tra **Debug Console** (màn hình đen ở dưới)
- [ ] Xem logs có hiển thị:
  ```
  ✅ Orders received: 1 items
  Sample order: {"id":"100001",...}
  ```
- [ ] Tab **Đơn Hàng**: Phải thấy 1 đơn test (ID: 100001, Nguyễn Văn A)
- [ ] Tab **Tuyến Xe**: Phải thấy 2 tuyến (29A-12345, 51B-67890)
- [ ] Tab **Cá Nhân**: Phải thấy stats (Total: 1, Shipping: 1)

### Bước 7: Test Tạo Đơn Mới
- [ ] Click vào tab **Tạo Đơn** (➕)
- [ ] Điền form với data test
- [ ] Click **Tạo Đơn Hàng**
- [ ] Quay lại tab **Đơn Hàng** → Phải thấy đơn mới

### Bước 8: Cleanup (Optional)
- [ ] Nếu muốn ẩn Debug Console → Click nút **X** ở góc
- [ ] Nếu muốn xóa test data → Xóa thủ công trong Google Sheet

---

## ⚠️ Nếu Có Lỗi

### Lỗi: "Sheet structure is WRONG"
→ Chạy lại `resetOrderSheet()` rồi `addTestData()` riêng lẻ

### Lỗi: "Filter returned 0 orders"
→ Kiểm tra trong Google Sheet:
- Cột M có phải là `telegram_user_id`?
- Row 2 có giá trị `123456` trong cột telegram_user_id?

### Lỗi: "Orders received: 0 items" trong web app
→ Chưa deploy lại hoặc cache browser:
- Deploy lại web app với **New version**
- Clear cache: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)

### Lỗi: Không thấy Debug Console
→ Kiểm tra file [script.html](script.html):
- Có function `debugLog()` chưa?
- Có element `<div id="debug-console">` trong [index.html](index.html) chưa?

---

## 📸 Screenshots Cần Chụp (Nếu Cần Support)

1. **Apps Script Logs** (sau khi run fixAllOrderIssues)
2. **Google Sheet header** (row 1 của sheet "order")
3. **Google Sheet data** (row 2 của sheet "order")
4. **Web App Debug Console** (phần logs ở dưới)
5. **Web App UI** (tab Đơn Hàng với data)

---

## ✨ Kết Quả Mong Đợi

Sau khi hoàn thành checklist:
- ✅ Sheet "order" có đúng 13 cột
- ✅ Filter function hoạt động (logs show "Filter is WORKING!")
- ✅ Web app hiển thị orders (ít nhất 1 order test)
- ✅ Web app hiển thị routes (2 routes test)
- ✅ Có thể tạo đơn mới thành công
- ✅ Debug Console hiển thị logs chi tiết

---

## 🎉 Hoàn Thành!

Khi tất cả checkboxes đều ✅:
1. App đã hoạt động bình thường
2. Có thể add data thật vào sheet
3. Có thể share với users để test

**Next Steps:**
- Thêm data thật vào sheet
- Config Telegram Bot URL
- Test với nhiều users
- Implement thêm features (admin dashboard, assignment, etc.)
