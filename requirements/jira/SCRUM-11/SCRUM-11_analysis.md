# 📋 Phân Tích Requirement: SCRUM-11
## [Customer List & Management] US02: View and Edit Customer from List

## 1. Tổng Quan Ticket

| Thuộc tính | Giá trị |
|---|---|
| **Issue Key** | SCRUM-11 |
| **Loại** | Story |
| **Trạng thái** | In Progress |
| **Độ ưu tiên** | Medium |
| **Người giao** | Quan Le |
| **Người báo** | Hoàng Vũ Lê |
| **Ngày tạo** | 2026-06-05T16:30:08.147+0700 |
| **Cập nhật** | 2026-06-05T16:33:53.865+0700 |

---

## 2. User Story

> **As a** user,
> **I want to** open a customer record from the list,
> **So that** I can view or edit customer details.

---

## 3. Phạm Vi Áp Dụng (Scope)

| Component / Page | Mô tả thay đổi | Loại thay đổi |
|---|---|---|
| **Customer List Table** | Cấu hình cho phép click vào từng dòng (row clickable), đổi cursor thành pointer khi hover qua hàng. | Modify |
| **Customer Details View** | Tạo màn hình/component hiển thị chi tiết thông tin khách hàng ở chế độ xem (View mode). | New |
| **Edit Customer Flow** | Tích hợp biểu tượng bút chì (pencil icon) tại màn hình chi tiết để chuyển sang chế độ chỉnh sửa. | Modify / New |

---

## 4. Acceptance Criteria — Phân Tích Chi Tiết

### 4.1. AC 1: Each row in the table is clickable
* **Phân tích kỹ thuật & UX:**
  * Toàn bộ diện tích của dòng (trừ cột chứa các nút hành động như Edit/Delete hoặc checkbox chọn nhiều) phải nhận sự kiện click.
  * Khi người dùng hover chuột qua bất kỳ dòng nào, con trỏ chuột phải đổi sang dạng bàn tay (`cursor: pointer`) và dòng đó phải được highlight (đổi nhẹ màu nền) để tạo phản hồi thị giác tốt cho người dùng.

### 4.2. AC 2: Clicking the row: Opens the customer in View mode. All customer details are displayed
* **Phân tích giao diện & Dữ liệu:**
  * Khi click vào dòng, hệ thống phải mở giao diện xem thông tin khách hàng.
  * Tất cả các trường thông tin của khách hàng (được kế thừa từ SCRUM-10) phải được hiển thị đầy đủ và ở trạng thái **chỉ đọc (Read-only)**:
    1. Customer Name (Tên khách hàng)
    2. Primary Contact (Liên hệ chính)
    3. Phone (Số điện thoại)
    4. Email (Địa chỉ email)
    5. Service Location (Địa điểm dịch vụ)
    6. City, State (Thành phố, Bang)
    7. Status (Trạng thái: Active / Inactive)

### 4.3. AC 3: The user can edit customer details from this screen through the pencil icon
* **Phân tích tương tác:**
  * Màn hình View mode phải có một biểu tượng chiếc bút chì (pencil icon) được hiển thị ở vị trí dễ thấy (ví dụ: góc trên bên phải của trang hoặc bên cạnh tên khách hàng).
  * Khi click vào pencil icon:
    * *Phương án A (Inline Editing):* Các trường dữ liệu chỉ đọc chuyển thành các ô nhập liệu (input, select) ngay tại màn hình đó, đồng thời hiển thị nút "Save" và "Cancel".
    * *Phương án B (Redirect):* Hệ thống điều hướng người dùng sang trang Edit độc lập (ví dụ: `/customers/edit/:id`).

---

## 5. Phụ Thuộc (Dependencies)

### 5.1. SCRUM-10: US01: View Customer List
* Tính năng mở chi tiết khách hàng phụ thuộc hoàn toàn vào cấu trúc bảng danh sách khách hàng và dữ liệu được trả về của SCRUM-10.
* Sự kiện click dòng không được ảnh hưởng đến các nút Action (Edit/Delete) có sẵn của SCRUM-10.

---

## 6. Phân Tích Mockup/Screenshot

> [!NOTE]
> Hiện tại Jira ticket không đính kèm file mockup thiết kế chi tiết cho màn hình View mode. Giao diện chi tiết sẽ dựa trên khung dữ liệu chuẩn của khách hàng từ SCRUM-10.

---

## 7. Các Điểm Mơ Hồ & Rủi Ro

### 7.1. Điểm Mơ Hồ (Ambiguities)

| Mã | Câu hỏi (Ambiguity) | Nguy cơ (Impact) | Mức độ |
|---|---|---|---|
| **AMB-01** | View mode sẽ hiển thị dưới dạng nào: Một trang mới (Page), một panel trượt từ cạnh phải (Drawer) hay một hộp thoại nổi (Modal)? | Ảnh hưởng trực tiếp đến việc viết kịch bản test và thiết lập locator cho Automation. | 🔴 High |
| **AMB-02** | Khi nhấp vào pencil icon, luồng hoạt động sẽ là chỉnh sửa trực tiếp (Inline Edit) hay chuyển hướng trang (Redirect)? | Thay đổi hoàn toàn logic kiểm thử luồng chỉnh sửa dữ liệu và cách assert trạng thái form. | 🔴 High |
| **AMB-03** | Có cơ chế ngăn chặn nổi bọt sự kiện (Event Bubbling) khi click vào các nút Edit/Delete ở cột Action hay không? | Nếu click nút Delete mà hệ thống vừa thực hiện hành động xóa vừa mở View mode sẽ gây lỗi trải nghiệm người dùng nghiêm trọng. | 🟡 Medium |
| **AMB-04** | Quyền hạn truy cập: Một người dùng chỉ có quyền Xem (Read-only) có nhìn thấy pencil icon không? Click vào có bị báo lỗi không? | Rủi ro về bảo mật phân quyền (Authorization bypass). | 🟡 Medium |

### 7.2. Rủi Ro Kiểm Thử (Testing Risks)

| Mã | Tên rủi ro | Mô tả | Biện pháp giảm thiểu (Mitigation) |
|---|---|---|---|
| **RISK-01** | **Xung đột sự kiện (Event Bubbling)** | Click các nút hành động trong cột Action kích hoạt luôn sự kiện click row, dẫn đến mở View mode song song với hành động xóa/sửa. | Dev phải dùng `event.stopPropagation()` trên cột Action. QA cần viết test case kiểm tra hành vi click nút Action. |
| **RISK-02** | **Mất dữ liệu chưa lưu (Data Loss)** | Người dùng đang chỉnh sửa thông tin qua pencil icon nhưng vô tình click ra ngoài hoặc back trang khiến dữ liệu bị mất mà không có cảnh báo. | Tích hợp cảnh báo "Thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?" (Dirty check logic) khi ở chế độ edit. |
| **RISK-03** | **Hiển thị dữ liệu rỗng (Null/Empty values)** | Một số trường thông tin của khách hàng không bắt buộc bị rỗng trong database dẫn đến giao diện View mode bị méo mó hoặc crash. | Đảm bảo UI hiển thị dấu gạch ngang "—" hoặc để trống một cách thẩm mỹ, và test kỹ với các bản ghi có dữ liệu khuyết thiếu. |

---

## 8. Ma Trận Trạng Thái (State Transition Matrix)

| Trạng thái hiện tại | Sự kiện (Event) | Trạng thái tiếp theo | Mô tả hành vi UI |
|---|---|---|---|
| **Danh sách khách hàng** | Click vào dòng khách hàng | **Xem chi tiết (View Mode)** | Mở trang/panel chi tiết, dữ liệu hiển thị dạng Read-only. |
| **Danh sách khách hàng** | Click nút Edit ở cột Action | **Chỉnh sửa (Edit Mode)** | Điều hướng trực tiếp sang trang Edit form. |
| **Xem chi tiết (View Mode)** | Click vào pencil icon | **Chỉnh sửa (Edit Mode)** | Các trường thông tin chuyển sang dạng editable hoặc redirect sang Edit page. |
| **Chỉnh sửa (Edit Mode)** | Click nút Cancel | **Xem chi tiết (View Mode)** | Khôi phục trạng thái read-only, giữ nguyên dữ liệu cũ. |
| **Chỉnh sửa (Edit Mode)** | Click nút Save thành công | **Xem chi tiết (View Mode)** | Lưu dữ liệu mới vào DB, cập nhật UI và quay lại read-only. |

---

## 9. Tóm Tắt Acceptance Criteria (Checklist)

- [ ] Mỗi dòng trong bảng danh sách khách hàng có thể click được (trừ cột Action).
- [ ] Hover chuột vào dòng hiển thị cursor pointer và hiệu ứng highlight.
- [ ] Click vào dòng mở ra giao diện View mode chứa đầy đủ 7 trường thông tin của khách hàng.
- [ ] Trạng thái mặc định trong View mode là Read-only.
- [ ] Có biểu tượng pencil icon hiển thị trên giao diện View mode.
- [ ] Click pencil icon kích hoạt chế độ chỉnh sửa (Inline hoặc Redirect) thành công.

---

## 10. Khuyến Nghị Cho Kiểm Thử

1. **Kiểm tra kỹ Event Propagation:** Đảm bảo khi click nút Edit/Delete ở cột Action ngoài bảng danh sách thì hệ thống thực hiện đúng chức năng của nút đó mà không mở View mode.
2. **Kiểm tra Back Navigation:** Khi từ View mode quay lại danh sách khách hàng, đảm bảo trạng thái tìm kiếm/lọc và phân trang trước đó của danh sách vẫn được giữ nguyên.
3. **Kiểm tra hiển thị dữ liệu dài (Text Overflow):** Đối với các thông tin chi tiết quá dài hiển thị trên View mode, đảm bảo UI responsive tốt, không bị tràn màn hình hay vỡ layout.
