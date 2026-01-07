# 🚀 Hướng Dẫn Deploy Apps Script Backend

## Bước 1: Tạo Apps Script Project

1. Truy cập: https://script.google.com
2. Click **"New Project"**
3. Đặt tên project: **"LogiFlex Backend"**

## Bước 2: Copy Code

1. Xóa code mặc định trong `Code.gs`
2. Copy toàn bộ code từ file `AppScript.js` và paste vào
3. Click **Save** (Ctrl+S)

## Bước 3: Deploy Web App

1. Click **Deploy** → **New deployment**
2. Click **⚙️ Select type** → Chọn **Web app**
3. Cấu hình:
   - **Description:** `LogiFlex API v1`
   - **Execute as:** **Me** (your email)
   - **Who has access:** **Anyone**
4. Click **Deploy**
5. **Copy Web App URL** (kết thúc bằng `/exec`)
6. Click **Done**

## Bước 4: Cập Nhật Config

1. Mở file `app.js`
2. Tìm dòng:
```javascript
APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL'
```
3. Thay bằng URL vừa copy:
```javascript
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
```

## Bước 5: Test

1. Commit và push code
2. Mở app: https://dtnam-oss.github.io/logi_flex/
3. Tạo đơn hàng mới
4. Kiểm tra Google Sheet → Đơn hàng sẽ xuất hiện!

## ✅ Kết Quả

- ✅ Frontend có thể GHI data vào Google Sheets
- ✅ Tự động reload data sau khi submit
- ✅ Instant UI update + Backend sync
- ✅ Error handling nếu backend lỗi

## 🔧 Troubleshooting

### Nếu gặp lỗi 403:
1. Check Apps Script deployment có chọn "Anyone" access
2. Re-deploy với version mới
3. Clear browser cache

### Nếu không thấy data:
1. Check console logs
2. Verify Apps Script URL đúng
3. Check Google Sheet có đúng tên sheet 'order' và 'route'
