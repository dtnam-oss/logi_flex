# 🔍 Visualize Lỗi Column Structure

## ❌ Trước Khi Fix (14 cột - SAI)

```
Sheet "order" hiện tại:
┌────┬────────────────┬──────────────┬─────────────┬──────────────┬─────────────┬──────────────┬──────────┬────────────┬───────────┬───────────┬───────────────┬─────────┬──────────────────┐
│ A  │ B              │ C            │ D           │ E            │ F           │ G            │ H        │ I          │ J         │ K         │ L             │ M       │ N                │
├────┼────────────────┼──────────────┼─────────────┼──────────────┼─────────────┼──────────────┼──────────┼────────────┼───────────┼───────────┼───────────────┼─────────┼──────────────────┤
│ id │ ten_khach_hang │ so_dien_thoai│ dia_chi_lay │ thoi_gian_lay│ dia_chi_giao│ thoi_gian_giao│ cuoc_phi│ bien_so_xe│ ten_tai_xe│ trang_thai│ thoi_gian_tao │ ??? 🚫 │ telegram_user_id│
└────┴────────────────┴──────────────┴─────────────┴──────────────┴─────────────┴──────────────┴──────────┴────────────┴───────────┴───────────┴───────────────┴─────────┴──────────────────┘
                                                                                                                                                                      ↑ Cột thừa!
                                                                                                                                                                      ↑ Code tìm telegram_user_id ở cột M
                                                                                                                                                                      ↑ Nhưng nó đang ở cột N!
```

**Vấn đề:**
- Code mong đợi: `telegram_user_id` ở index 12 (cột M)
- Thực tế sheet: `telegram_user_id` ở index 13 (cột N)
- → Filter `getOrdersByUserId()` không tìm được dữ liệu!

---

## ✅ Sau Khi Fix (13 cột - ĐÚNG)

```
Sheet "order" sau khi fix:
┌────┬────────────────┬──────────────┬─────────────┬──────────────┬─────────────┬──────────────┬──────────┬────────────┬───────────┬───────────┬───────────────┬──────────────────┐
│ A  │ B              │ C            │ D           │ E            │ F           │ G            │ H        │ I          │ J         │ K         │ L             │ M                │
├────┼────────────────┼──────────────┼─────────────┼──────────────┼─────────────┼──────────────┼──────────┼────────────┼───────────┼───────────┼───────────────┼──────────────────┤
│ id │ ten_khach_hang │ so_dien_thoai│ dia_chi_lay │ thoi_gian_lay│ dia_chi_giao│ thoi_gian_giao│ cuoc_phi│ bien_so_xe│ ten_tai_xe│ trang_thai│ thoi_gian_tao │ telegram_user_id │
└────┴────────────────┴──────────────┴─────────────┴──────────────┴─────────────┴──────────────┴──────────┴────────────┴───────────┴───────────┴───────────────┴──────────────────┘
                                                                                                                                                  ↑ ĐÚNG VỊ TRÍ!
                                                                                                                                                  ↑ Cột M (index 12)
```

**Kết quả:**
- `telegram_user_id` đúng vị trí ở cột M (index 12)
- Filter hoạt động chính xác ✅
- Dữ liệu load thành công lên web app ✅

---

## 🔄 Luồng Fix

```
1. Run fixAllOrderIssues()
   ↓
2. Delete sheet "order" cũ
   ↓
3. Create sheet "order" mới với 13 cột đúng
   ↓
4. Add test data (1 order với telegram_user_id = '123456')
   ↓
5. Verify structure (check 13 cột, cột cuối = telegram_user_id)
   ↓
6. Test filter getOrdersByUserId('123456')
   ↓
7. ✅ SUCCESS! Deploy web app
```

---

## 📊 Code Logic (getDataFromSheet)

```javascript
function getDataFromSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  //                                            ↑ Lấy tất cả cột (14 cột nếu sheet sai!)

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      const key = String(header).trim().toLowerCase();
      obj[key] = row[index];
      //         ↑ Nếu header[12] = cột thừa, thì telegram_user_id = row[13]
      //         ↑ Nhưng code filter check row[12]!
      //         ↑ → KHÔNG MATCH!
    });
    return obj;
  });
}
```

**Tại sao filter không hoạt động?**
```javascript
// Trong getOrdersByUserId:
orders.filter(o => String(o.telegram_user_id) === String(telegramUserId))
//                         ↑ o.telegram_user_id = row[13] (cột N)
//                         ↑ Nhưng code mapping expect nó ở row[12] (cột M)
//                         ↑ → Data mapping sai → filter trả về []
```

---

## 🎯 Cách Kiểm Tra Nhanh

### Trong Apps Script Console (sau khi chạy fixAllOrderIssues):

```
=== STARTING FULL FIX ===
Step 1: Resetting order sheet...
Deleting existing order sheet...
Creating new order sheet...
Order sheet reset successfully!

Step 2: Adding test order data...

Step 3: Verifying sheet structure...
Total columns: 13               ← PHẢI = 13
Headers: ["id","ten_khach_hang",...,"telegram_user_id"]
Last column: telegram_user_id   ← PHẢI LÀ telegram_user_id

✅ Sheet structure is CORRECT!   ← PHẢI THẤY DẤU ✅

Step 4: Testing filter...
Found orders for user 123456: 1  ← PHẢI > 0
✅ Filter is WORKING!            ← PHẢI THẤY DẤU ✅

=== FIX COMPLETE ===
```

### Trong Debug Console trên Web App:

```
[16:25:30] 📞 Fetching orders for user: 123456
[16:25:30] 🔍 apiGet: getOrdersByUserId, args: [123456]
[16:25:30] Method: google.script.run
[16:25:33] ✅ Orders received: 1 items     ← PHẢI > 0
[16:25:33] Sample order: {"id":"100001",...,"telegram_user_id":"123456"}
```

---

## 💡 Tóm Tắt

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Orders = 0 | Sheet có 14 cột thay vì 13 | Chạy `fixAllOrderIssues()` |
| Filter không hoạt động | telegram_user_id ở cột N thay vì M | Reset sheet với structure đúng |
| Data không match | Index mapping sai | Function tự động fix và verify |
