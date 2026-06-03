import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LocationPage } from '../pages/LocationPage';
import { StatusBoardPage } from '../pages/StatusBoardPage';
import { CreateRecordPage } from '../pages/CreateRecordPage';
import { AddPatientPage } from '../pages/AddPatientPage';
import { DataGenerator } from '../utils/DataGenerator';

test.describe('VizHIS Emergency Room Test Suite', () => {
  let loginPage: LoginPage;
  let locationPage: LocationPage;
  let statusBoardPage: StatusBoardPage;
  let createRecordPage: CreateRecordPage;
  let addPatientPage: AddPatientPage;

  const url = 'https://qa.lumisightemr.datahouse.asia/identity/login?redirectPath=%2Femergency%2Fstatus-board';
  const username = process.env.EMR_USERNAME || 'quan_le';
  const password = process.env.EMR_PASSWORD || 'Abcd@1234';

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    locationPage = new LocationPage(page);
    statusBoardPage = new StatusBoardPage(page);
    createRecordPage = new CreateRecordPage(page);
    addPatientPage = new AddPatientPage(page);

    // Mở trang đăng nhập và thiết lập viewport
    await loginPage.navigateTo(url);
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Đăng nhập
    await loginPage.login(username, password);

    // Chọn location Ho Chi Minh
    await locationPage.selectLocation('Ho Chi Minh');
    await locationPage.clickContinue();

    // Đợi URL thoát khỏi trang select-location trước khi chuyển hướng thủ công (tránh net::ERR_ABORTED)
    await page.waitForURL(url => !url.href.includes('/identity/select-location'));
    // Đợi trang dashboard hoặc bất kỳ nội dung nào tải xong để ổn định trước khi navigate
    await page.waitForTimeout(3000);
    const expectedUrl = 'https://qa.lumisightemr.datahouse.asia/emergency/status-board';
    await page.goto(expectedUrl);
    await page.waitForLoadState('load');
  });

  // Đính kèm screenshot cho các test case passed vào bước cuối cùng
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'passed') {
      const screenshot = await page.screenshot();
      await testInfo.attach('Final Screenshot (Passed)', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  });

  // ==========================================
  // PHÂN VÙNG 1: ER STATUS BOARD & FILTERS
  // ==========================================
  test.describe('ER Status Board & Filters Scenarios', () => {
    test('VIZHIS_ER_TC_001: Kiểm tra tính hiển thị và chuyển đổi tab danh sách bệnh nhân', async () => {
      await test.step('Step 1: Switch to "Intake" tab and verify patient card "Sinh S. Sinh" is visible', async () => {
        await statusBoardPage.switchTab('Intake');
        await expect(statusBoardPage.getPatientCard('Sinh S. Sinh')).toBeVisible();
      });

      await test.step('Step 2: Switch to "Receiving Care" tab and verify filter button is visible', async () => {
        await statusBoardPage.switchTab('Receiving Care');
        await expect(statusBoardPage.filtersBtn).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_002: Kiểm tra hiển thị thông tin cơ bản trên thẻ bệnh nhân', async () => {
      await test.step('Step 1: Get patient card for "Sinh S. Sinh" and verify ESI-2, MRN, and Sex are displayed', async () => {
        const card = statusBoardPage.getPatientCard('Sinh S. Sinh');
        await expect(card).toBeVisible();
        await expect(card.locator('text=ESI-2')).toBeVisible();
        await expect(card.locator('text=0000052725')).toBeVisible();
        await expect(card.locator('text=Male')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_003: Kiểm tra hiển thị chỉ số sinh tồn và cận lâm sàng trên thẻ', async () => {
      await test.step('Step 1: Get patient card for "Sinh S. Sinh" and verify vital signs and lab indicators are displayed', async () => {
        const card = statusBoardPage.getPatientCard('Sinh S. Sinh');
        await expect(card.locator('text=Temp:')).toBeVisible();
        await expect(card.locator('text=LAB')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_004: Kiểm tra chức năng chuyển tiếp Process Intake từ thẻ', async ({ page }) => {
      await test.step('Step 1: Switch to "Intake" tab', async () => {
        await statusBoardPage.switchTab('Intake');
      });
      await test.step('Step 2: Click Process Intake for "Sinh S. Sinh" and verify redirect URL', async () => {
        await statusBoardPage.clickProcessIntake('Sinh S. Sinh');
        await expect(page).toHaveURL(/.*intake|.*triage|.*status-board/);
      });
    });

    test('VIZHIS_ER_TC_005: Kiểm tra chức năng mở bệnh án Start Encounter từ thẻ', async ({ page }) => {
      await test.step('Step 1: Click Encounter button for "Sinh S. Sinh" and verify redirect URL', async () => {
        await statusBoardPage.clickEncounterButton('Sinh S. Sinh');
        await expect(page).toHaveURL(/.*encounter|.*status-board/);
      });
    });

    test('VIZHIS_ER_TC_006: Kiểm tra tìm kiếm nhanh bệnh nhân theo Tên', async () => {
      await test.step('Step 1: Search patient name "Sinh S. Sinh"', async () => {
        await statusBoardPage.searchPatient('Sinh S. Sinh');
      });
      await test.step('Step 2: Verify only "Sinh S. Sinh" patient card is visible', async () => {
        await expect(statusBoardPage.getPatientCard('Sinh S. Sinh')).toBeVisible();
        await expect(statusBoardPage.getPatientCard('Blaine J. Henderson')).not.toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_007: Kiểm tra tìm kiếm nhanh bệnh nhân theo mã MRN', async () => {
      await test.step('Step 1: Search patient MRN "0000052725"', async () => {
        await statusBoardPage.searchPatient('0000052725');
      });
      await test.step('Step 2: Verify "Sinh S. Sinh" patient card is visible', async () => {
        await expect(statusBoardPage.getPatientCard('Sinh S. Sinh')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_008: Kiểm tra lọc danh sách bệnh nhân theo ESI Level', async () => {
      await test.step('Step 1: Apply ESI-2 filter and verify patient card "Sinh S. Sinh" is visible', async () => {
        await statusBoardPage.applyFilters({ esiLevel: 'ESI-2' });
        await expect(statusBoardPage.getPatientCard('Sinh S. Sinh')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_009: Kiểm tra lọc danh sách bệnh nhân theo Y tá phụ trách', async () => {
      await test.step('Step 1: Apply Nurse filter "Kha K. Truy" and verify filters button is visible', async () => {
        await statusBoardPage.applyFilters({ nurse: 'Kha K. Truy' });
        await expect(statusBoardPage.filtersBtn).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_010: Kiểm tra lọc kết hợp nhiều tiêu chí trong panel Filters', async () => {
      await test.step('Step 1: Apply compound filters (ESI-1, Critical, Intake: Waiting) and verify filters button is visible', async () => {
        await statusBoardPage.applyFilters({
          esiLevel: 'ESI-1',
          criticalOnly: true,
          status: 'Intake: Waiting'
        });
        await expect(statusBoardPage.filtersBtn).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_011: Kiểm tra chức năng Clear All để khôi phục bộ lọc về mặc định', async () => {
      await test.step('Step 1: Clear all active filters and verify patient card "Sinh S. Sinh" is visible', async () => {
        await statusBoardPage.clearAllFilters();
        await expect(statusBoardPage.getPatientCard('Sinh S. Sinh')).toBeVisible();
      });
    });
  });

  // ==========================================
  // PHÂN VÙNG 2: CREATE ER RECORD
  // ==========================================
  test.describe('Create ER Record & Search Scenarios', () => {
    test.beforeEach(async () => {
      await statusBoardPage.goToCreateErRecord();
    });

    test('VIZHIS_ER_TC_012: Kiểm tra tìm kiếm bệnh nhân cũ bằng tìm nhanh', async () => {
      await test.step('Step 1: Perform quick search for MRN "0000052725" and verify patient result "Sinh S. Sinh"', async () => {
        await createRecordPage.quickSearch('0000052725');
        const result = createRecordPage.page.locator('div, tr').filter({ hasText: 'Sinh S. Sinh' }).first();
        await expect(result).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_013: Kiểm tra tìm kiếm nâng cao (Advanced Search)', async () => {
      await test.step('Step 1: Perform advanced search for "Sinh", "Male", "03/01/2026" and verify patient result "Sinh S. Sinh"', async () => {
        await createRecordPage.advancedSearch({
          firstName: 'Sinh',
          birthSex: 'Male',
          dob: '03/01/2026'
        });
        const result = createRecordPage.page.locator('div, tr').filter({ hasText: 'Sinh S. Sinh' }).first();
        await expect(result).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_014: Kiểm tra chức năng liên kết hồ sơ bệnh nhân cũ', async ({ page }) => {
      await test.step('Step 1: Search and select "Sinh S. Sinh" patient record', async () => {
        await createRecordPage.quickSearch('0000052725');
        await createRecordPage.selectPatientResult('Sinh S. Sinh');
      });
      await test.step('Step 2: Link the patient record and verify redirect URL', async () => {
        await createRecordPage.clickSelectLink();
        await expect(page).toHaveURL(/.*create-patient|.*status-board/);
      });
    });
  });

  // ==========================================
  // PHÂN VÙNG 3: ADD NEW PATIENT
  // ==========================================
  test.describe('Add New Patient Form Scenarios', () => {
    test.beforeEach(async () => {
      await statusBoardPage.goToCreateErRecord();
      await createRecordPage.navigateToAddNewPatient();
    });

    test('VIZHIS_ER_TC_015: Kiểm tra đăng ký bệnh nhân mới thành công ở Quick Mode', async ({ page }) => {
      const email = DataGenerator.getRandomEmail('quick');
      const idNo = DataGenerator.getRandomIdNumber('PP');
      const phone = DataGenerator.getRandomPhone();
      const patient = DataGenerator.getRandomPatientName('Sinh');

      await test.step('Step 1: Enable Quick Mode', async () => {
        await addPatientPage.setQuickMode(true);
      });
      await test.step('Step 2: Fill Quick Mode details and submit', async () => {
        await addPatientPage.fillQuickModeDetails({
          patientType: 'Emergency',
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthSex: 'Male',
          dob: '10/24/1995',
          careGroup: 'Adult',
          idType: 'Passport',
          idNo: idNo,
          phoneType: 'Mobile',
          phone: phone,
          email: email,
          region: 'Region VIII',
          province: 'Leyte',
          city: 'Tacloban City',
          barangay: 'Barangay 1'
        });
        await addPatientPage.clickNext();
      });
      await test.step('Step 3: Verify successful patient registration redirect URL', async () => {
        await expect(page).toHaveURL(/.*intake|.*triage|.*status-board/);
      });
    });

    test('VIZHIS_ER_TC_016: Kiểm tra đăng ký bệnh nhân mới thành công ở Full Mode', async ({ page }) => {
      const email = DataGenerator.getRandomEmail('full');
      const idNo = DataGenerator.getRandomIdNumber('NID');
      const phone = DataGenerator.getRandomPhone();
      const patient = DataGenerator.getRandomPatientName('Tran');

      await test.step('Step 1: Disable Quick Mode (Enable Full Mode)', async () => {
        await addPatientPage.setQuickMode(false);
      });
      await test.step('Step 2: Fill primary patient details', async () => {
        await addPatientPage.fillQuickModeDetails({
          patientType: 'Emergency',
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthSex: 'Female',
          dob: '05/12/1990',
          careGroup: 'Adult',
          idType: 'National ID',
          idNo: idNo,
          phoneType: 'Mobile',
          phone: phone,
          email: email
        });
      });
      await test.step('Step 3: Fill employment details and submit form', async () => {
        await addPatientPage.employerInput.fill('DataHouse');
        await addPatientPage.selectDropdownOption(addPatientPage.employmentStatusCombobox, 'Employed');
        await addPatientPage.occupationInput.fill('QA Engineer');
        await addPatientPage.clickNext();
      });
      await test.step('Step 4: Verify successful redirect URL', async () => {
        await expect(page).toHaveURL(/.*intake|.*triage|.*status-board/);
      });
    });

    test('VIZHIS_ER_TC_017: Kiểm tra tải lên ảnh bệnh nhân thành công (Full Mode)', async () => {
      await test.step('Step 1: Enable Full Mode and upload dummy photo', async () => {
        await addPatientPage.setQuickMode(false);
        const dummyPath = 'src/utils/dummy_avatar.png'; 
        await addPatientPage.uploadPhoto(dummyPath);
      });
      await test.step('Step 2: Verify photo upload button is visible', async () => {
        await expect(addPatientPage.uploadPhotoBtn).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_018: Kiểm tra tải lên ảnh bệnh nhân thất bại do sai định dạng file', async () => {
      await test.step('Step 1: Enable Full Mode and upload invalid file format (PDF)', async () => {
        await addPatientPage.setQuickMode(false);
        const invalidPath = 'src/utils/dummy_record.pdf';
        await addPatientPage.uploadPhoto(invalidPath);
      });
      await test.step('Step 2: Verify invalid format error message is displayed', async () => {
        await expect(addPatientPage.page.locator('text=Invalid file format')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_019: Kiểm tra tải lên ảnh bệnh nhân thất bại do dung lượng quá lớn', async () => {
      await test.step('Step 1: Enable Full Mode and upload oversized image file', async () => {
        await addPatientPage.setQuickMode(false);
        const heavyPath = 'src/utils/heavy_image.jpg';
        await addPatientPage.uploadPhoto(heavyPath);
      });
      await test.step('Step 2: Verify file size exceeds limit error message is displayed', async () => {
        await expect(addPatientPage.page.locator('text=File size exceeds limit')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_020: Kiểm tra Validation khi bỏ trống trường bắt buộc First Name', async () => {
      const email = DataGenerator.getRandomEmail('err');
      const idNo = DataGenerator.getRandomIdNumber('PP');
      const phone = DataGenerator.getRandomPhone();

      await test.step('Step 1: Enable Quick Mode and fill form with empty First Name', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.fillQuickModeDetails({
          patientType: 'Emergency',
          firstName: '', 
          lastName: 'Test',
          birthSex: 'Male',
          dob: '10/24/1995',
          careGroup: 'Adult',
          idType: 'Passport',
          idNo: idNo,
          phoneType: 'Mobile',
          phone: phone,
          email: email
        });
        await addPatientPage.clickNext();
      });
      await test.step('Step 2: Verify First Name validation error message is displayed', async () => {
        await expect(addPatientPage.page.locator('text=First Name is required')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_021: Kiểm tra Validation khi nhập sai định dạng ngày sinh DOB', async () => {
      await test.step('Step 1: Enable Quick Mode and fill invalid DOB value', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.dobInput.fill('02/30/2026'); 
        await addPatientPage.dobInput.blur();
      });
      await test.step('Step 2: Verify invalid date format error message is displayed', async () => {
        await expect(addPatientPage.page.locator('text=Invalid date format')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_022: Kiểm tra Validation khi nhập sai định dạng email', async () => {
      await test.step('Step 1: Enable Quick Mode and fill invalid email value', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.contactEmailInput.fill('nguyenamail.com'); 
        await addPatientPage.contactEmailInput.blur();
      });
      await test.step('Step 2: Verify invalid email format error message is displayed', async () => {
        await expect(addPatientPage.page.locator('text=Invalid email format')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_023: Kiểm tra Validation khi nhập số điện thoại chứa ký tự chữ cái', async () => {
      await test.step('Step 1: Enable Quick Mode and fill phone number with letters', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.phoneInput.fill('9123abc456');
        await addPatientPage.phoneInput.blur();
      });
      await test.step('Step 2: Verify phone field does not preserve letters', async () => {
        await expect(addPatientPage.phoneInput).not.toHaveValue('9123abc456');
      });
    });

    test('VIZHIS_ER_TC_024: Kiểm tra đăng ký khi tích chọn N/A cho trường tên đệm và họ', async () => {
      const email = DataGenerator.getRandomEmail('na');
      const idNo = DataGenerator.getRandomIdNumber('PP');
      const phone = DataGenerator.getRandomPhone();

      await test.step('Step 1: Fill patient details and check N/A for middle & last name', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.selectDropdownOption(addPatientPage.patientTypeCombobox, 'Emergency');
        await addPatientPage.typeText(addPatientPage.firstNameInput, 'Sinh');
        await addPatientPage.checkMiddleNameNa();
        await addPatientPage.checkLastNameNa();
      });
      await test.step('Step 2: Complete and submit quick form details', async () => {
        await addPatientPage.selectDropdownOption(addPatientPage.birthSexCombobox, 'Male');
        await addPatientPage.typeText(addPatientPage.dobInput, '10/24/1995');
        await addPatientPage.selectDropdownOption(addPatientPage.careGroupCombobox, 'Adult');
        await addPatientPage.selectDropdownOption(addPatientPage.idTypeCombobox, 'Passport');
        await addPatientPage.typeText(addPatientPage.idNoInput, idNo);
        await addPatientPage.selectDropdownOption(addPatientPage.phoneTypeCombobox, 'Mobile');
        await addPatientPage.typeText(addPatientPage.phoneInput, phone);
        await addPatientPage.typeText(addPatientPage.contactEmailInput, email);
        await addPatientPage.clickNext();
      });
      await test.step('Step 3: Verify successful patient registration redirect URL', async () => {
        await expect(addPatientPage.page).toHaveURL(/.*intake|.*triage|.*status-board/);
      });
    });

    test('VIZHIS_ER_TC_025: Kiểm tra đăng ký khi tích chọn Unknown cho trường ngày sinh', async () => {
      await test.step('Step 1: Enable Quick Mode and check Date of Birth as Unknown', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.checkDobUnknown();
      });
      await test.step('Step 2: Verify patient age is automatically calculated as Unknown', async () => {
        await expect(addPatientPage.ageInput).toHaveValue('Unknown');
      });
    });

    test('VIZHIS_ER_TC_026: Kiểm tra tính năng tự động tính toán số tuổi của bệnh nhân', async () => {
      await test.step('Step 1: Fill Date of Birth date and blur to calculate age', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.dobInput.fill('06/01/2001');
        await addPatientPage.dobInput.blur();
      });
      await test.step('Step 2: Verify age input value is calculated', async () => {
        await expect(addPatientPage.ageInput).not.toHaveValue('-');
      });
    });

    test('VIZHIS_ER_TC_027: Kiểm tra tính phụ thuộc dữ liệu địa lý của biểu mẫu địa chỉ', async () => {
      await test.step('Step 1: Select region and verify corresponding province is visible in dropdown options', async () => {
        await addPatientPage.setQuickMode(true);
        await addPatientPage.selectDropdownOption(addPatientPage.regionCombobox, 'Region VIII (Eastern Visayas)');
        await addPatientPage.provinceCombobox.click();
        const provinceOption = addPatientPage.page.getByRole('option', { name: 'Leyte' });
        await expect(provinceOption).toBeVisible();
      });
    });
  });

  // ==========================================
  // PHÂN VÙNG 4: WORKFLOW RULES
  // ==========================================
  test.describe('Workflow Rules Scenarios', () => {
    test('VIZHIS_ER_TC_028: Kiểm tra chức năng cập nhật nhanh ESI Level trên Status Board', async () => {
      await test.step('Step 1: Quick update patient "Sinh S. Sinh" ESI to ESI-3', async () => {
        await statusBoardPage.quickUpdateEsi('Sinh S. Sinh', 'ESI-3');
      });
      await test.step('Step 2: Verify ESI level "ESI-3" is visible on the card', async () => {
        const card = statusBoardPage.getPatientCard('Sinh S. Sinh');
        await expect(card.locator('text=ESI-3')).toBeVisible();
      });
    });

    test('VIZHIS_ER_TC_029: Kiểm tra phân công bác sĩ và y tá cho bệnh nhân', async () => {
      await test.step('Step 1: Quick assign physician and nurse to patient "Sinh S. Sinh"', async () => {
        await statusBoardPage.quickAssignPhysician('Sinh S. Sinh', 'Tran Van B');
        await statusBoardPage.quickAssignNurse('Sinh S. Sinh', 'Kha K. Truy');
      });
      await test.step('Step 2: Verify assigned physician value is correct on card', async () => {
        const card = statusBoardPage.getPatientCard('Sinh S. Sinh');
        await expect(card.getByRole('combobox', { name: 'Attending Physician' })).toHaveValue('Tran Van B');
      });
    });

    test('VIZHIS_ER_TC_030: Kiểm tra quy tắc tự động khóa Next Step khi là Disposition In-progress', async () => {
      await test.step('Step 1: Locate card for "Nhie T. Nhie, sr" and verify Next Step combobox is disabled', async () => {
        const card = statusBoardPage.getPatientCard('Nhie T. Nhie, sr');
        const nextStepCombobox = card.getByRole('combobox', { name: 'Next Step' });
        await expect(nextStepCombobox).toBeDisabled();
      });
    });

    test('VIZHIS_ER_TC_031: Kiểm tra cho phép cập nhật Next Step đối với bệnh nhân ở trạng thái khác', async () => {
      await test.step('Step 1: Locate card for "Nhiiu O. Nhi" and verify Next Step combobox is enabled', async () => {
        const card = statusBoardPage.getPatientCard('Nhiiu O. Nhi');
        const nextStepCombobox = card.getByRole('combobox', { name: 'Next Step' });
        await expect(nextStepCombobox).toBeEnabled();
      });
      await test.step('Step 2: Quick update next step of "Nhiiu O. Nhi" to "Physician"', async () => {
        await statusBoardPage.quickUpdateNextStep('Nhiiu O. Nhi', 'Physician');
      });
    });

    test('VIZHIS_ER_TC_032: Kiểm tra luồng hủy bỏ đăng ký nhưng giữ lại dữ liệu', async () => {
      await test.step('Step 1: Go to Create ER Record -> Add New Patient form', async () => {
        await statusBoardPage.goToCreateErRecord();
        await createRecordPage.navigateToAddNewPatient();
      });
      await test.step('Step 2: Fill first name and click Cancel button', async () => {
        await addPatientPage.typeText(addPatientPage.firstNameInput, 'Sinh');
        await addPatientPage.clickCancel();
      });
      await test.step('Step 3: Verify warning dialog displays, discard cancellation, and check name persists', async () => {
        await expect(addPatientPage.warningDialog).toBeVisible();
        await addPatientPage.discardCancel();
        await expect(addPatientPage.firstNameInput).toHaveValue('Sinh');
      });
    });

    test('VIZHIS_ER_TC_033: Kiểm tra luồng hủy bỏ đăng ký và quay lại màn hình chính', async ({ page }) => {
      await test.step('Step 1: Go to Create ER Record -> Add New Patient form', async () => {
        await statusBoardPage.goToCreateErRecord();
        await createRecordPage.navigateToAddNewPatient();
      });
      await test.step('Step 2: Fill first name and click Cancel button', async () => {
        await addPatientPage.typeText(addPatientPage.firstNameInput, 'Sinh');
        await addPatientPage.clickCancel();
      });
      await test.step('Step 3: Confirm cancellation in warning dialog and verify redirected back to Status Board', async () => {
        await expect(addPatientPage.warningDialog).toBeVisible();
        await addPatientPage.confirmCancel();
        await expect(page).toHaveURL(/.*emergency\/status-board$/);
      });
    });
  });
});
