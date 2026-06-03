# TÀI LIỆU ĐẶC TẢ YÊU CẦU (REQUIREMENTS SPECIFICATION)
# MODULE: EMERGENCY ROOM (ER STATUS BOARD)

## 1. TỔNG QUAN (OVERVIEW)

Module Emergency Room (Bảng trạng thái phòng cấp cứu - ER Status Board) thuộc hệ thống Lumisight EMR là một bảng điều khiển trung tâm giúp các nhân viên y tế (Bác sĩ, Y tá, Điều phối viên) theo dõi, quản lý và cập nhật thông tin thời gian thực của tất cả bệnh nhân đang tiếp nhận điều trị tại khoa cấp cứu. 

Mục đích của module này là cung cấp cái nhìn toàn diện về tình trạng bệnh nhân, các chỉ số sinh tồn cơ bản, trạng thái thực hiện các chỉ định cận lâm sàng, nhân sự y tế phụ trách, và bước xử lý tiếp theo nhằm tối ưu hóa quy trình điều trị cấp cứu và giảm thiểu thời gian chờ đợi của bệnh nhân.

---

## 2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### Chức năng 2.1: Quản lý và theo dõi danh sách bệnh nhân (ER Status Board)
- Hệ thống hiển thị danh sách bệnh nhân dưới dạng các thẻ thông tin (Patient Cards) trực quan.
- Danh sách được chia thành các tab phân loại trạng thái bệnh nhân bao gồm:
  - Tab All: Hiển thị tổng số lượng bệnh nhân đang có trong khoa cấp cứu (ví dụ: All 1913).
  - Tab Intake: Hiển thị danh sách bệnh nhân đang ở bước tiếp nhận thông tin ban đầu (ví dụ: Intake 206).
  - Tab Receiving Care: Hiển thị danh sách bệnh nhân đang được điều trị và chăm sóc y tế (ví dụ: Receiving Care 635).
  - Tab Ready For Disposition: Hiển thị danh sách bệnh nhân đã hoàn thành điều trị cấp cứu và sẵn sàng cho việc xuất viện hoặc chuyển khoa (ví dụ: Ready For Disposition 539).
  - Tab My Patients: Hiển thị danh sách bệnh nhân được chỉ định trực tiếp cho tài khoản nhân viên y tế đang đăng nhập (ví dụ: My Patients 12).
- Trên mỗi thẻ bệnh nhân, hệ thống phải hiển thị đầy đủ các thông tin:
  - Họ và tên bệnh nhân.
  - Chỉ số phân loại cấp cứu ESI (Emergency Severity Index) kèm theo nút chỉnh sửa nhanh ESI.
  - Trạng thái xử lý chi tiết (ví dụ: Physician: In-progress, Disposition: In-progress).
  - Các thông tin cơ bản: Mã MRN (Medical Record Number), Ngày sinh (DOB), Tuổi (Age), Giới tính (Sex).
  - Thời gian đến khoa cấp cứu (Arrival Date & Time).
  - Các chỉ số sinh tồn (Vitals) gần nhất: Nhiệt độ (Temp - °F hoặc °C), Nhịp tim (HR - bpm), Chỉ số oxy trong máu (SpO2 - %), Nhịp thở (RR - brpm), Huyết áp (BP - mmHg), Thang đo mức độ đau (Pain Scale).
  - Số lượng chỉ định cận lâm sàng và dịch vụ y tế đang thực hiện: Xét nghiệm (LAB), Chẩn đoán hình ảnh (RAD), Thủ thuật (PROC), Thuốc (MEDS), Khác (OTH), Số lượng bình luận/trao đổi (CMTS).
  - Vị trí giường bệnh/phòng điều trị (Room/Bed).
  - Bác sĩ điều trị chính (Attending Physician) dưới dạng dropdown combobox.
  - Y tá phụ trách (Nurse) dưới dạng dropdown combobox.
  - Bước xử lý tiếp theo (Next Step) dưới dạng dropdown combobox.
  - Nút menu thao tác nhanh (more_vert).
  - Các nút hành động chính ở chân thẻ: Nút Process Intake, Nút Start Encounter hoặc Open Encounter.

### Chức năng 2.2: Bộ lọc danh sách bệnh nhân (Filters)
- Người dùng có thể lọc danh sách bệnh nhân trên bảng trạng thái bằng cách nhấn vào nút Filters.
- Hệ thống hỗ trợ lọc đa tiêu chí thông qua bảng điều khiển bên phải (Filter Panel):
  - Lọc theo mức độ cấp cứu: ESI Level.
  - Lọc theo phương thức đến: Arrival Mode.
  - Lọc theo mức độ ưu tiên: Priority.
  - Lọc theo bác sĩ điều trị: Current Attending Physician.
  - Lọc theo y tá phụ trách: Assigned Nurse.
  - Lọc theo khoảng ngày đến: Arrival Date (From Date và To Date).
  - Lọc theo khoảng giờ đến: Arrival Time (From Time và To Time).
  - Lọc bệnh nhân nguy kịch: Checkbox Critical Patients.
  - Lọc theo trạng thái chi tiết của bệnh nhân (Patient Status): Cho phép chọn một hoặc nhiều trạng thái như Intake (Waiting, In-Progress, Completed), Physician (Waiting, In-Progress, Completed), Disposition (Nurse, In-Progress, Ready), On-Hold.
  - Lọc theo chỉ định đang chờ xử lý (Pending Orders): Lab, Imaging, Other, Procedure, Medication.
  - Lọc theo chỉ định sẵn sàng đánh giá (Ready to Review): Lab, Imaging, Other, Procedure.
- Panel bộ lọc có nút Clear All để thiết lập lại toàn bộ bộ lọc về mặc định và nút Apply để áp dụng bộ lọc lên danh sách.

### Chức năng 2.3: Tìm kiếm bệnh nhân nhanh
- Hỗ trợ ô nhập liệu tìm kiếm ở đầu danh sách: Search by Patient name or MRN.
- Hệ thống thực hiện lọc danh sách bệnh nhân ngay lập tức dựa trên tên hoặc mã MRN được nhập vào.

### Chức năng 2.4: Tạo hồ sơ cấp cứu mới (Create ER Record)
- Người dùng nhấn nút Create ER Record trên bảng trạng thái để bắt đầu quy trình tạo hồ sơ.
- Quy trình gồm các bước:
  - Bước 2.4.1: Tìm kiếm bệnh nhân đã có sẵn trên hệ thống (Search Existing Patient) bằng cách nhập Tên hoặc mã MRN.
  - Hỗ trợ Tìm kiếm nâng cao (Advanced Search) mở rộng các trường tìm kiếm: Họ, Tên đệm, Tên, Giới tính khi sinh, Ngày sinh, Số điện thoại, Quốc gia, Bang, Thành phố.
  - Nếu tìm thấy bệnh nhân cũ, chọn bệnh nhân và nhấn nút Select để liên kết hồ sơ.
  - Bước 2.4.2: Nếu bệnh nhân chưa từng đăng ký trên hệ thống, nhấn nút Add New Patient để mở form tạo mới bệnh nhân.

### Chức năng 2.5: Đăng ký thông tin bệnh nhân mới (Add New Patient)
- Hỗ trợ 2 chế độ điền thông tin:
  - Chế độ nhanh (Quick Mode): Chỉ hiển thị các trường thông tin cơ bản và bắt buộc để tiếp nhận bệnh nhân nhanh chóng.
  - Chế độ đầy đủ (Full Mode): Hiển thị đầy đủ tất cả các phần thông tin hành chính, liên lạc, công việc, người liên quan, bảo hiểm và người bảo lãnh.
- Các phần thông tin chính của biểu mẫu đăng ký bao gồm:
  - Thông tin nhân khẩu học (Demographics): Loại bệnh nhân, Họ tên, Giới tính khi sinh, Ngày sinh, Nhóm chăm sóc, Email cổng bệnh nhân, Ảnh bệnh nhân (chỉ hiển thị ở chế độ đầy đủ), các thông tin mở rộng khác ở chế độ đầy đủ (Danh xưng, Hậu tố, Bản dạng giới, Xu hướng tình dục, Chủng tộc, Dân tộc, Ngôn ngữ ưu tiên, Quốc tịch, Trạng thái cư trú, Tình trạng hôn nhân, Tình trạng nhà ở, Đánh dấu tử vong, Cờ phân loại đặc biệt như VIP/Phụ nữ mang thai).
  - Thông tin giấy tờ định danh (Patient IDs): Cho phép thêm một hoặc nhiều loại giấy tờ định danh (ID Type, ID No, Ngày cấp, Ngày hết hạn, Ghi chú).
  - Thông tin liên lạc (Contact Info): Loại số điện thoại, Số điện thoại, Email liên lạc, Địa chỉ chi tiết (Permanent, Temporary, Present) gồm Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố, Quốc gia, Mã bưu chính.
  - Thông tin nghề nghiệp (Employment - chỉ có ở chế độ đầy đủ): Tên đơn vị tuyển dụng, Tình trạng việc làm, Nghề nghiệp, Mã nhân viên, Số điện thoại và địa chỉ nơi làm việc.
  - Người liên quan (Related Person): Cho phép thêm thông tin người liên hệ khẩn cấp khi không liên lạc được với bệnh nhân.
  - Thông tin bảo hiểm y tế (Coverage): Thêm thông tin thẻ bảo hiểm của bệnh nhân.
  - Người bảo lãnh thanh toán (Guarantor): Thêm thông tin người chịu trách nhiệm chi trả viện phí.

---

## 3. QUY TẮC TRƯỜNG DỮ LIỆU (FIELD SPECIFICATIONS)

Dưới đây là bảng đặc tả chi tiết cho các trường dữ liệu quan sát được trên giao diện của các biểu mẫu.

### Bảng 3.1: Các trường dữ liệu trong biểu mẫu tìm kiếm nâng cao (Advanced Search)

| Tên Trường (Label) | Loại thành phần UI | Quy tắc dữ liệu và Ràng buộc |
| --- | --- | --- |
| Search by Patient name or MRN | Ô nhập liệu văn bản | Nhập Tên bệnh nhân hoặc mã MRN để tìm kiếm nhanh |
| First Name | Ô nhập liệu văn bản | Nhập tên của bệnh nhân |
| Middle Name | Ô nhập liệu văn bản | Nhập tên đệm của bệnh nhân |
| Last Name | Ô nhập liệu văn bản | Nhập họ của bệnh nhân |
| Birth Sex | Hộp chọn (Combobox) | Chọn giới tính khi sinh từ danh sách |
| Date of Birth | Ô nhập văn bản / Lịch chọn | Định dạng MM/DD/YYYY, có nút chọn ngày dạng lịch biểu |
| Phone Number | Hộp chọn quốc gia & Ô số | Cho phép chọn quốc gia (mặc định PH) và nhập số điện thoại với đầu số tương ứng (mặc định +63) |
| Country | Hộp chọn (Combobox) | Chọn quốc gia sinh sống từ danh sách |
| State | Ô nhập liệu văn bản | Nhập Tỉnh / Bang sinh sống |
| City | Ô nhập liệu văn bản | Nhập Thành phố sinh sống |

### Bảng 3.2: Các trường dữ liệu trong biểu mẫu thêm bệnh nhân mới (Add New Patient)

| Tên Trường (Label) | Loại thành phần UI | Bắt buộc | Chế độ hiển thị | Quy tắc và Ràng buộc |
| --- | --- | --- | --- | --- |
| Add Patient using Quick Mode | Hộp kiểm (Checkbox) | Không | Cả hai | Mặc định tích chọn (Quick Mode). Bỏ chọn để chuyển sang Full Mode |
| Patient Type | Hộp chọn (Combobox) | Có | Cả hai | Chọn loại bệnh nhân từ danh sách hệ thống |
| Photo | Nút bấm tải ảnh / Chụp ảnh | Không | Full Mode | Hỗ trợ chụp ảnh trực tiếp qua camera hoặc tải file ảnh định dạng JPG, JPEG, PNG, SVG tối đa 8MB |
| Name Type | Hộp chọn (Combobox) | Không | Full Mode | Chọn loại tên (ví dụ: Tên khai sinh, Tên thường gọi) |
| Title | Hộp chọn (Combobox) | Không | Full Mode | Chọn danh xưng (ví dụ: Mr., Mrs., Ms., Dr.) |
| Suffix | Hộp chọn (Combobox) | Không | Full Mode | Chọn hậu tố tên từ danh sách |
| First Name | Ô nhập liệu văn bản | Có | Cả hai | Nhập tên bệnh nhân |
| Middle Name | Ô nhập liệu văn bản | Có | Cả hai | Nhập tên đệm bệnh nhân. Có nút Checkbox N/A bên cạnh, nếu tích chọn N/A thì trường này không bắt buộc nhập |
| Last Name | Ô nhập liệu văn bản | Có | Cả hai | Nhập họ bệnh nhân. Có nút Checkbox N/A bên cạnh, nếu tích chọn N/A thì trường này không bắt buộc nhập |
| Birth Sex | Hộp chọn (Combobox) | Có | Cả hai | Chọn giới tính khi sinh từ danh sách |
| Date of Birth | Ô nhập văn bản / Lịch chọn | Có | Cả hai | Định dạng MM/DD/YYYY. Có nút chọn ngày dạng lịch biểu. Có Checkbox Unknown bên cạnh, nếu tích chọn Unknown thì trường này không bắt buộc nhập |
| Age | Ô nhập văn bản | Không | Cả hai | Trường bị vô hiệu hóa (Disabled), tự động tính toán số tuổi dựa trên Date of Birth đã nhập |
| Gender Identity | Hộp chọn (Combobox) | Không | Full Mode | Chọn bản dạng giới của bệnh nhân từ danh sách |
| Sexual Orientation | Hộp chọn (Combobox) | Không | Full Mode | Chọn xu hướng tình dục của bệnh nhân |
| Race Category | Hộp chọn (Combobox) | Không | Full Mode | Chọn nhóm chủng tộc từ danh sách |
| Race | Hộp chọn (Combobox) | Không | Full Mode | Bị vô hiệu hóa ban đầu, chỉ khả dụng sau khi chọn Race Category |
| Ethnicity Group | Hộp chọn (Combobox) | Không | Full Mode | Chọn nhóm dân tộc từ danh sách |
| Ethnicity | Hộp chọn (Combobox) | Không | Full Mode | Bị vô hiệu hóa ban đầu, chỉ khả dụng sau khi chọn Ethnicity Group |
| Preferred Language | Hộp chọn (Combobox) | Không | Full Mode | Chọn ngôn ngữ ưu tiên giao tiếp, mặc định là English |
| Nationality | Hộp chọn (Combobox) | Không | Full Mode | Chọn quốc tịch của bệnh nhân |
| Residency Status | Hộp chọn (Combobox) | Không | Full Mode | Chọn trạng thái cư trú từ danh sách |
| Marital Status | Hộp chọn (Combobox) | Không | Full Mode | Chọn tình trạng hôn nhân (ví dụ: Độc thân, Đã kết hôn) |
| Housing Status | Hộp chọn (Combobox) | Không | Full Mode | Chọn tình trạng nhà ở từ danh sách |
| Care Group | Hộp chọn (Combobox) | Có | Cả hai | Chọn nhóm chăm sóc y tế từ danh sách |
| Patient Portal Email | Ô nhập liệu văn bản | Không | Cả hai | Nhập địa chỉ email đăng ký cổng thông tin bệnh nhân |
| Is the patient currently deceased? | Nút chọn một (Radio) | Không | Full Mode | Chọn Yes nếu bệnh nhân đã tử vong, chọn No nếu chưa |
| Flag | Hộp biểu tượng chọn | Không | Full Mode | Đánh dấu phân loại đặc biệt cho bệnh nhân bao gồm: VIP, Vulnerable (Dễ bị tổn thương), At Risk (Có nguy cơ), Pregnant (Mang thai) |
| ID Type | Hộp chọn (Combobox) | Có | Cả hai | Chọn loại giấy tờ định danh (trong phần Patient IDs) |
| ID No. | Ô nhập liệu văn bản | Có | Cả hai | Nhập số giấy tờ định danh |
| Issuance Date | Ô nhập văn bản / Lịch chọn | Không | Cả hai | Định dạng MM/DD/YYYY, ngày cấp giấy tờ |
| Expiration Date | Ô nhập văn bản / Lịch chọn | Không | Cả hai | Định dạng MM/DD/YYYY, ngày hết hạn giấy tờ |
| Remarks | Ô nhập liệu văn bản | Không | Cả hai | Nhập ghi chú thêm cho giấy tờ định danh |
| Phone Type | Hộp chọn (Combobox) | Có | Cả hai | Chọn loại số điện thoại liên lạc (trong phần Contact Info) |
| Phone Number | Hộp chọn quốc gia & Ô số | Có | Cả hai | Chọn quốc gia (mặc định PH) và nhập số điện thoại (tiền tố mặc định +63) |
| Contact Email | Ô nhập liệu văn bản | Có | Cả hai | Nhập địa chỉ email liên hệ của bệnh nhân |
| Address Category | Nút chọn một (Radio) | Không | Cả hai | Chọn phân loại địa chỉ: Permanent (Thường trú), Temporary (Tạm trú), Present (Hiện tại) |
| Address Type | Hộp chọn (Combobox) | Không | Cả hai | Chọn loại địa chỉ (ví dụ: Nhà riêng, Văn phòng) |
| Unit/Floor | Ô nhập liệu văn bản | Không | Cả hai | Nhập số căn hộ, số tầng nhà |
| House/Building Name | Ô nhập liệu văn bản | Không | Cả hai | Nhập tên tòa nhà, tên nhà |
| Blk/Lot No. | Ô nhập liệu văn bản | Không | Cả hai | Nhập số lô, số block |
| Street | Ô nhập liệu văn bản | Không | Cả hai | Nhập tên đường phố |
| Region | Hộp chọn (Combobox) | Không | Cả hai | Chọn vùng địa lý từ danh sách |
| Province | Hộp chọn (Combobox) | Không | Cả hai | Chọn tỉnh thành từ danh sách |
| City/Municipality | Hộp chọn (Combobox) | Không | Cả hai | Chọn thành phố/quận/huyện từ danh sách |
| Barangay | Hộp chọn (Combobox) | Không | Cả hai | Chọn phường/xã/ấp từ danh sách |
| Zip Code | Ô nhập liệu văn bản | Không | Cả hai | Nhập mã bưu chính |
| Country | Hộp chọn (Combobox) | Không | Cả hai | Chọn quốc gia địa chỉ, mặc định là Philippines |
| Use this address as default | Hộp kiểm (Checkbox) | Không | Cả hai | Tích chọn để đặt địa chỉ này làm địa chỉ mặc định liên hệ |

---

## 4. CÁC LUỒNG XỬ LÝ VÀ QUY TẮC NGHIỆP VỤ (BUSINESS RULES & WORKFLOWS)

### Luồng xử lý 4.1: Cập nhật chỉ số phân loại cấp cứu ESI (ESI Update Workflow)
- Các bước thực hiện:
  1. Người dùng quan sát thẻ bệnh nhân trên ER Status Board, tìm khu vực hiển thị ESI hiện tại (ví dụ: ESI-2) và nhấp vào nút chỉnh sửa nhanh edit ESI.
  2. Hệ thống hiển thị một menu dropdown chứa các mức độ phân loại bao gồm: ESI-1, ESI-2, ESI-3, ESI-4, ESI-5 và No ESI.
  3. Người dùng nhấp chọn một mức ESI mới từ danh sách.
  4. Hệ thống thực hiện cập nhật ngay lập tức chỉ số ESI của bệnh nhân trên giao diện và lưu trữ vào cơ sở dữ liệu.
  5. Nếu người dùng muốn hủy bỏ không cập nhật, nhấp chuột vào bất kỳ vị trí nào bên ngoài menu dropdown hoặc nhấn phím Escape trên bàn phím để đóng menu.

### Luồng xử lý 4.2: Phân công nhân sự y tế và xác định bước xử lý tiếp theo
- Các bước thực hiện:
  1. Trên thẻ bệnh nhân, người dùng có thể nhấp vào combobox Attending Physician để mở danh sách các bác sĩ điều trị và chọn một bác sĩ phụ trách chính cho bệnh nhân.
  2. Người dùng nhấp vào combobox Nurse để mở danh sách các y tá và chọn y tá phụ trách chăm sóc bệnh nhân.
  3. Người dùng nhấp vào combobox Next Step để chọn bước tiếp theo trong quy trình điều trị cấp cứu của bệnh nhân.
- Quy tắc nghiệp vụ (Business Rules):
  - Phụ thuộc trạng thái: Đối với những bệnh nhân đang ở một số trạng thái cụ thể như Disposition: In-progress, trường Next Step sẽ tự động được khóa (disabled) và điền sẵn giá trị mặc định là Disposition, người dùng không được phép thay đổi thủ công.
  - Đối với những bệnh nhân mới tiếp nhận, Next Step sẽ ở trạng thái mở và cho phép chọn từ các bước tiếp theo của quy trình (ví dụ: Physician, Intake, Disposition).

### Luồng xử lý 4.3: Hủy bỏ đăng ký bệnh nhân mới (Cancel Create Patient Workflow)
- Các bước thực hiện:
  1. Khi người dùng đang ở giao diện đăng ký bệnh nhân mới (Create Patient) và đã thực hiện thay đổi dữ liệu trên biểu mẫu.
  2. Người dùng nhấp vào nút Cancel hoặc thực hiện hành động chuyển trang (như click vào menu bên trái hoặc click breadcrumb quay lại ER Status Board).
  3. Hệ thống hiển thị một Dialog cảnh báo xác nhận với tiêu đề Warning Cancel close và nội dung: Are you sure you want to cancel? The changes you made will not be saved.
  4. Dialog cung cấp hai lựa chọn:
     - Nút Cancel: Đóng Dialog cảnh báo và giữ người dùng ở lại giao diện điền thông tin hiện tại, bảo toàn dữ liệu đã nhập.
     - Nút OK: Xác nhận hủy bỏ đăng ký, đóng biểu mẫu đăng ký, không lưu trữ các thay đổi và chuyển người dùng quay lại màn hình bảng trạng thái ER Status Board.
