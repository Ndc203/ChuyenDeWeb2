# QA: Product Management Checklist

Tập hợp các test-case chặt chẽ để kiểm tra chức năng quản lý sản phẩm (Create / Read / Update / Delete, Upload, Validation, Race conditions...). Mỗi test case gồm: Mục tiêu, Các bước thực hiện, Input cụ thể, Kết quả mong đợi (HTTP + UI), Tiêu chí chấp nhận.

---

## 1. Cập nhật trùng lặp (Race update - 2 tabs)
- Mục tiêu: Ngăn ghi đè khi cùng edit 1 record ở nhiều tab.
- Các bước:
  1. Mở `Edit` sản phẩm id=1 trên Tab A và Tab B.
  2. Trên Tab A: sửa `name` → Lưu (200 OK, message success).
  3. Trên Tab B (chưa reload): sửa khác → Lưu.
- Input: 2 cập nhật liên tiếp không reload.
- Expected API:
  - Tab A: `200 OK`, message `Sản phẩm đã được cập nhật thành công.`
  - Tab B: `409 Conflict`, JSON `{ message: "Dữ liệu đã được thay đổi. Vui lòng tải lại trang trước khi cập nhật." }`
- UI: Hiển thị message rõ ràng và hướng dẫn reload.
- Acceptance: Không được silent overwrite; nếu client không gửi `updated_at`, server vẫn nên phát hiện (so sánh `updated_at`) và trả 409.

---

## 2. ID không tồn tại / ID không hợp lệ (CHI TIẾT)
### Case A: ID không hợp lệ (format không phải số hoặc không giải mã được)
- Mục tiêu: Kiểm tra khi URL chứa id dạng chữ (ví dụ `abc`).
- Steps:
  - Mở `/admin/products/abc` (GET API `/api/products/abc`).
  - Hoặc cố gắng mở Edit `/admin/products/edit/abc` hoặc gửi update.
- Input: `id = "abc"` (non-numeric, non-hash).
- Expected API: `400 Bad Request` (ưu tiên) hoặc `404 Not Found` nếu backend không phân biệt, JSON `{ "message": "ID không hợp lệ." }` hoặc `{ "message": "Không tìm thấy trang" }`.
- Expected UI: Hiển thị "Không tìm thấy trang" hoặc "ID không hợp lệ."; không crash; có link/quay về danh sách.
- Acceptance: Không hiển thị stack trace; HTTP 400 (ưu tiên) hoặc 404; message tiếng Việt rõ ràng.

### Case B: ID numeric nhưng không tồn tại
- Mục tiêu: Kiểm tra khi ID có định dạng số nhưng không có trong DB (ví dụ `99999999999`).
- Steps:
  - Mở `/admin/products/99999999999` hoặc gửi GET/PUT/DELETE tới API.
- Input: `id = 99999999999` (numeric, không tồn tại).
- Expected API: `404 Not Found`, JSON `{ "message": "Sản phẩm không tồn tại." }` hoặc `{ "message": "Không tìm thấy trang" }`.
- Expected UI: Hiển thị "Sản phẩm không tồn tại" / "Không tìm thấy trang"; redirect hoặc nút quay lại.
- Acceptance: Trả 404; không thực hiện thao tác destructive; thông báo thân thiện.

### Case C: Applied to all endpoints
- Mục tiêu: Đồng nhất xử lý cho GET/PUT/DELETE/restore/show.
- Steps: Thử thay `id` trên URL cho các action (view, edit, delete, restore).
- Expected: 400/404 tùy case; không thay đổi DB; message rõ ràng.

Curl ví dụ:

```bash
# Non-numeric
curl -i -X GET "http://localhost:8000/api/products/abc"
# Large numeric
curl -i -X GET "http://localhost:8000/api/products/99999999999"
# Update (kèm _method=PUT)
curl -i -X POST -F "_method=PUT" -F "name=Test" "http://localhost:8000/api/products/abc"
```

---

## 3. Validate form (Add / Update)
- Mục tiêu: Field-level validation với message cụ thể.
- Steps: Submit form với các lỗi (missing required, invalid format, out of range, duplicate slug).
- Examples & Expected:
  - `name = ""` → `422 Unprocessable Entity`, `{ errors: { name: "Tên là bắt buộc." } }`.
  - `price = -10` → `{ price: "Giá phải >= 0." }`.
  - `slug` duplicate → `409` hoặc `422` "Slug đã tồn tại.".
- Acceptance: Field-specific messages, HTTP 422 (or 400), UI focuses field lỗi.

---

## 4. Text quá tải / paste HTML
- Mục tiêu: Ngăn lưu raw HTML/script, hoặc strip tags.
- Steps: Paste HTML từ báo (vnexpress) vào `description` → Save.
- Expected: Either strip tags and save plain text OR reject with `422` and message "Nội dung không được chứa thẻ HTML.". Không lưu `<script>`.
- Acceptance: Không có XSS; UI hiển thị message hợp lý.

---

## 5. Khoảng trắng (spaces / full-width space)
- Mục tiêu: Treat whitespace-only input as empty.
- Steps: Paste ASCII spaces "   " and full-width space `　` into fields and Save.
- Expected: After normalize/trim → empty → `422` "Trường này là bắt buộc.".
- Acceptance: Both ASCII and full-width spaces considered empty.

---

## 6. Dữ liệu số (full-width numerals)
- Mục tiêu: Normalize or reject full-width digits `０１２３４５６７８９`.
- Steps: Input full-width numbers into numeric fields (price, stock).
- Expected: Prefer normalize to ASCII and accept; or reject with `422` "Số không hợp lệ. Vui lòng dùng chữ số 0-9.".
- Acceptance: Hành vi được tài liệu hoá; không crash.

---

## 7. Select/Option tampering
- Mục tiêu: Server validate select value exists.
- Steps: Tamper category_id → send non-existent id e.g. `9999` via devtools/Postman.
- Expected: `422` or `400` `{ category_id: "Giá trị không hợp lệ." }`.
- Acceptance: Không chấp nhận giá trị không có trong DB.

---

## 8. Duplicate create (double-submit)
- Mục tiêu: Ngăn tạo nhiều bản ghi do nhấn Save nhiều lần.
- Steps: Fill Add form → click Save rapidly multiple times.
- Expected: Client disables Save while pending; server enforces unique index & returns `409` on duplicate.
- Acceptance: Only 1 record created; server-side idempotency/unique constraint.

---

## 9. URL params validation (page)
- Mục tiêu: Validate `page` query param.
- Steps: Visit `/admin/products?page=abc` or `page=99999999`.
- Expected: Non-numeric → `400` or fallback to `page=1`; page too large → show empty list or redirect to last page.
- Acceptance: No exception; clear behavior.

---

## 10. File upload type
- Mục tiêu: Chỉ cho phép ảnh (jpg/png/gif/webp).
- Steps: Upload `sample.pdf` as image.
- Expected: `422`/`415` with message "Chỉ chấp nhận file ảnh (jpg, png, webp, gif)." and file not saved.
- Acceptance: MIME+magic check; not accepted.

---

## 11. Missing image on storage
- Mục tiêu: Frontend show placeholder when image file missing.
- Steps: Upload image A → delete file from storage manually → open product page.
- Expected: API returns `image: null` or frontend handles 404 for image request and shows placeholder.
- Acceptance: UI displays default image; no JS error.

---

## 12. Update without re-uploading image
- Mục tiêu: If update changes only text, image should stay the same.
- Steps: Update product text only (no new image) after previous upload.
- Expected: Image remains unchanged. To remove image user must explicitly request removal.
- Acceptance: No accidental image deletion.

---

## 13. Delete safety (method & CSRF)
- Mục tiêu: Prevent delete via GET or unauthenticated requests.
- Steps: Copy delete URL (if any) and open in new browser tab using GET.
- Expected: Delete performed only via `DELETE`/`POST`+CSRF; GET returns `405` or redirect; missing token returns `403/419`.
- Acceptance: Cannot delete via GET.

---

## 14. Misc checks
- Rate-limit / massive uploads / long inputs should be handled gracefully.

---

## How to use
- Manual: Follow steps and assert expected HTTP status & UI messages.
- Automation: Convert each case into Cypress / Playwright tests; use `failOnStatusCode: false` to assert 4xx/5xx.

---

> File created by QA checklist generator. If cần, tôi có thể chuyển các test-case sang kịch bản Cypress tự động.
