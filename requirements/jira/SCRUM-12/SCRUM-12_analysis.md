# 📋 Phân Tích Requirement: SCRUM-12
## [Customer List & Management] US03: Delete Customer from List

## 1. Tổng Quan Ticket

| Thuộc tính | Giá trị |
|---|---|
| **Issue Key** | SCRUM-12 |
| **Loại** | Story |
| **Trạng thái** | In Progress |
| **Độ ưu tiên** | Medium |
| **Người giao** | Quan Le |
| **Người báo** | Hoàng Vũ Lê |
| **Ngày tạo** | 2026-06-05T16:33:53.155+0700 |
| **Cập nhật** | 2026-06-05T16:38:41.089+0700 |

---

## 2. User Story

> **As a** user,
> **I want to** delete a customer from the list,
> **So that** I can remove incorrect or obsolete records.

---

## 3. Phạm Vi Áp Dụng (Scope)

| Component / Page | Mô tả thay đổi | Loại thay đổi |
|---|---|---|
| **Customer List Table (Action Column)** | Hiển thị nút "Delete" (hoặc icon thùng rác) trên mỗi dòng của bảng danh sách khách hàng. | Modify |
| **Confirmation Pop-up (Modal)** | Thiết kế và hiển thị hộp thoại xác nhận khi nhấp nút Delete, gồm tiêu đề, thông điệp cảnh báo, nút "Yes" và "No". | New |
| **Data Update & Integrity** | Xóa bản ghi khách hàng khỏi DB, cập nhật lại bảng dữ liệu trên UI và phân trang mà không cần reload trang. | Modify |

---

## 4. Acceptance Criteria — Phân Tích Chi Tiết

### 4.1. AC 1: A “Delete” action is available for each customer
* **Phân tích kỹ thuật & UX:**
  * Tại cột Action của bảng danh sách khách hàng (đã định nghĩa ở SCRUM-10), mỗi dòng phải chứa nút hoặc biểu tượng Delete (ví dụ: icon hình thùng rác màu đỏ).
  * Nút Delete chỉ hiển thị cho người dùng có quyền chỉnh sửa/xóa dữ liệu.

### 4.2. AC 2: Upon clicking “Delete”: Opens a confirmation pop-up with a Yes/No option
* **Phân tích giao diện & Logic:**
  * Khi click vào nút Delete, hệ thống không được thực hiện xóa ngay mà phải hiển thị hộp thoại xác nhận (Modal Pop-up) nổi lên phía trên màn hình chính, làm mờ màn hình nền (Backdrop overlay) để ngăn người dùng thao tác ngoài modal.
  * Hộp thoại chứa câu hỏi chính xác: **"Are you sure to delete this customer?"**
  * Hộp thoại có 2 lựa chọn: **Yes** và **No**.
    * **Nếu chọn Yes:**
      1. Thực hiện gọi API xóa khách hàng khỏi cơ sở dữ liệu.
      2. Đóng hộp thoại xác nhận.
      3. UI cập nhật ngay lập tức: dòng khách hàng bị xóa biến mất khỏi bảng, tổng số bản ghi và phân trang tự động tính toán lại.
      4. Hiển thị thông báo (toast message) báo xóa thành công.
    * **Nếu chọn No (hoặc nhấn nút Close, click ra ngoài modal - tùy thiết kế):**
      1. Đóng hộp thoại xác nhận.
      2. Khách hàng vẫn được giữ nguyên trong danh sách, không có thay đổi nào trong DB.

---

## 5. Phụ Thuộc (Dependencies)

### 5.1. SCRUM-10: US01: View Customer List
* Cần có bảng danh sách khách hàng để hiển thị nút Delete trên từng dòng.
* Việc cập nhật lại danh sách sau khi xóa thành công phụ thuộc vào logic tải lại dữ liệu của bảng.

### 5.2. SCRUM-11: US02: View and Edit Customer from List
* Để click nút Delete mà không vô tình mở trang xem chi tiết (View Mode) của khách hàng, sự kiện click trên nút Delete phải được ngăn chặn nổi bọt (`event.stopPropagation()`).

---

## 6. Phân Tích Mockup/Screenshot

> [!NOTE]
> Không có file mockup đính kèm cho hộp thoại xác nhận xóa. Giao diện hộp thoại sẽ áp dụng theo chuẩn UI chung của hệ thống (Modal popup tiêu chuẩn).

---

## 7. Các Điểm Mơ Hồ & Rủi Ro

### 7.1. Điểm Mơ Hồ (Ambiguities)

| Mã | Câu hỏi (Ambiguity) | Nguy cơ (Impact) | Mức độ |
|---|---|---|---|
| **AMB-01** | Nhãn (Label) hiển thị của hai nút trên Modal xác nhận là gì? Có chính xác là "Yes" / "No" hay là "Delete" / "Cancel"? | Ảnh hưởng đến việc xác định locator chính xác cho Automation Test. | 🟡 Medium |
| **AMB-02** | Xử lý ràng buộc dữ liệu (Data Referential Integrity): Hệ thống có cho phép xóa một khách hàng đang có các giao dịch hoặc dự án liên kết không? | Nếu cho xóa bừa bãi sẽ gây lỗi toàn vẹn dữ liệu (orphan records). Nếu chặn xóa thì cần hiển thị thông báo lỗi như thế nào? | 🔴 High |
| **AMB-03** | Cơ chế xóa là Xóa vật lý (Hard Delete - mất vĩnh viễn khỏi DB) hay Xóa logic (Soft Delete - ẩn khỏi UI bằng cờ `is_deleted`)? | Quyết định cách verify dữ liệu trong database sau khi thực hiện hành động xóa. | 🟡 Medium |
| **AMB-04** | Người dùng chỉ có quyền Xem (Read-only user) có nhìn thấy nút Delete hay không? Nếu họ tìm cách gọi API xóa trực tiếp thì hệ thống có chặn không? | Rủi ro bypass bảo mật phân quyền API nếu chỉ ẩn nút trên UI. | 🔴 High |

### 7.2. Rủi Ro Kiểm Thử (Testing Risks)

| Mã | Tên rủi ro | Mô tả | Biện pháp giảm thiểu (Mitigation) |
|---|---|---|---|
| **RISK-01** | **Xung đột sự kiện (Event Bubbling)** | Người dùng click Delete nhưng hệ thống lại mở đồng thời trang xem chi tiết khách hàng (View Mode) do sự kiện nổi bọt. | Sử dụng `event.stopPropagation()` trên nút Delete. Viết test case kiểm tra UI sau khi click Delete chỉ hiển thị Modal xác nhận. |
| **RISK-02** | **Xóa nhầm do click đúp (Double click)** | Người dùng vô tình click đúp vào nút xác nhận "Yes" gửi đi nhiều request xóa cùng một lúc, gây ra lỗi HTTP 404 hoặc 500 ở request thứ hai. | Disable nút "Yes" ngay sau click lần đầu và hiển thị trạng thái loading trên nút. |
| **RISK-03** | **Lỗi phân trang khi dòng cuối cùng bị xóa** | Khi người dùng ở trang cuối (ví dụ: trang 2 có 1 bản ghi duy nhất) và thực hiện xóa bản ghi đó. Hệ thống không tự động lùi về trang trước (trang 1) dẫn đến bảng trống trơn và báo lỗi phân trang. | Viết test case kiểm tra hành vi phân trang khi xóa bản ghi cuối cùng của trang. |

---

## 8. Ma Trận Trạng Thái (State Transition Matrix)

| Trạng thái hiện tại | Sự kiện (Event) | Trạng thái tiếp theo | Mô tả hành vi UI |
|---|---|---|---|
| **Danh sách khách hàng** | Click nút Delete trên dòng | **Chờ xác nhận (Modal Open)** | Hiển thị Modal popup với nội dung "Are you sure to delete this customer?". Màn hình nền bị disable. |
| **Chờ xác nhận (Modal Open)** | Click nút "No" (hoặc nút X đóng modal) | **Danh sách khách hàng** | Đóng Modal. Danh sách giữ nguyên. |
| **Chờ xác nhận (Modal Open)** | Click nút "Yes" thành công | **Danh sách khách hàng** | Gọi API xóa, đóng Modal, dòng khách hàng biến mất khỏi bảng, hiển thị toast success. |
| **Chờ xác nhận (Modal Open)** | Click nút "Yes" thất bại (lỗi kết nối/lỗi DB) | **Chờ xác nhận (Modal Open)** | Giữ nguyên Modal, hiển thị toast lỗi (ví dụ: "Failed to delete customer"). |

---

## 9. Tóm Tắt Acceptance Criteria (Checklist)

- [ ] Cột Action trên danh sách khách hàng hiển thị nút Delete cho mỗi hàng.
- [ ] Click nút Delete mở Modal xác nhận nổi lên giữa màn hình, làm mờ nền.
- [ ] Nội dung modal hiển thị chính xác câu hỏi: "Are you sure to delete this customer?".
- [ ] Modal chứa đủ 2 nút lựa chọn Yes và No.
- [ ] Click nút No: Modal đóng lại, không xóa khách hàng.
- [ ] Click nút Yes: Bản ghi bị xóa khỏi DB, UI cập nhật mất dòng, phân trang tính toán lại, toast success hiển thị.

---

## 10. Khuyến Nghị Cho Kiểm Thử

1. **Test kịch bản phân trang đặc biệt:** Kiểm thử hành động xóa bản ghi duy nhất tại trang cuối cùng và xác thực hệ thống tự động đưa người dùng về trang liền trước.
2. **Test Event Bubbling:** Xác thực click nút Delete ngoài danh sách không kích hoạt mở trang View Mode của khách hàng đó.
3. **Test bảo mật phân quyền:** Xác thực tài khoản Read-only không thấy nút Delete và API xóa trả về 403 Forbidden nếu cố tình gọi bằng công cụ ngoài (như Postman).
