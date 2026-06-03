import { Page, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class AddPatientPage extends BasePage {
  // Locators chính
  readonly quickModeCheckbox = this.page.locator('input[type="checkbox"]').first(); // Add Patient using Quick Mode
  readonly nextBtn = this.page.getByRole('button', { name: 'Next', exact: true });
  readonly cancelBtn = this.page.getByRole('button', { name: 'Cancel', exact: true });
  readonly backToSearchBtn = this.page.getByRole('button', { name: 'Back to Search' });

  // Demographics Locators
  readonly patientTypeCombobox = this.page.getByRole('combobox', { name: 'Patient Type *' });
  readonly firstNameInput = this.page.getByRole('textbox', { name: 'First Name *' });
  readonly middleNameInput = this.page.getByRole('textbox', { name: 'Middle Name *' });
  readonly middleNameNaCheckbox = this.page.locator('div').filter({ hasText: 'Middle Name' }).locator('img').first();
  readonly lastNameInput = this.page.getByRole('textbox', { name: 'Last Name *' });
  readonly lastNameNaCheckbox = this.page.locator('div').filter({ hasText: 'Last Name' }).locator('img').first();
  readonly birthSexCombobox = this.page.getByRole('combobox', { name: 'Birth Sex *' });
  readonly dobInput = this.page.getByRole('textbox', { name: 'Date of Birth *' });
  readonly dobUnknownCheckbox = this.page.locator('div').filter({ hasText: 'Date of Birth' }).locator('img').first();
  readonly ageInput = this.page.getByRole('textbox', { name: 'Age' });
  readonly careGroupCombobox = this.page.getByRole('combobox', { name: 'Care Group *' });
  readonly portalEmailInput = this.page.getByRole('textbox', { name: 'Email' }).first();

  // Full Mode Demographics
  readonly languageCombobox = this.page.getByRole('combobox', { name: 'Preferred Language' });
  readonly nationalityCombobox = this.page.getByRole('combobox', { name: 'Nationality' });
  readonly fileInput = this.page.locator('input[type="file"]');
  readonly uploadPhotoBtn = this.page.getByRole('button', { name: 'Upload Photo' });

  // Patient IDs Locators
  readonly idTypeCombobox = this.page.getByRole('combobox', { name: 'ID Type *' });
  readonly idNoInput = this.page.getByRole('textbox', { name: 'ID No. *' });

  // Contact Info Locators
  readonly phoneTypeCombobox = this.page.getByRole('combobox', { name: 'Phone Type *' });
  readonly phoneInput = this.page.getByRole('textbox', { name: 'Phone Number *' });
  readonly contactEmailInput = this.page.getByRole('textbox', { name: 'Contact Email *' });
  
  // Address Locators
  readonly regionCombobox = this.page.getByRole('combobox', { name: 'Region' });
  readonly provinceCombobox = this.page.getByRole('combobox', { name: 'Province' });
  readonly cityCombobox = this.page.getByRole('combobox', { name: 'City/Municipality' });
  readonly barangayCombobox = this.page.getByRole('combobox', { name: 'Barangay' });
  readonly zipCodeInput = this.page.getByRole('textbox', { name: 'Zip Code' });
  readonly countryCombobox = this.page.getByRole('combobox', { name: 'Country' });

  // Employment Locators (Full Mode)
  readonly employerInput = this.page.getByRole('textbox', { name: 'Employer' });
  readonly employmentStatusCombobox = this.page.getByRole('combobox', { name: 'Employment Status' });
  readonly occupationInput = this.page.getByRole('textbox', { name: 'Occupation' });

  // Buttons mở rộng (Full Mode)
  readonly addRelatedPersonBtn = this.page.getByRole('button', { name: 'Add Related Person' });
  readonly addCoverageBtn = this.page.getByRole('button', { name: 'Add Coverage for this Patient' });
  readonly addGuarantorBtn = this.page.getByRole('button', { name: 'Add Guarantor' });

  // Dialog warning
  readonly warningDialog = this.page.locator('div[role="dialog"]').filter({ hasText: 'Warning Cancel close' });
  readonly dialogOkBtn = this.page.getByRole('button', { name: 'OK', exact: true });
  readonly dialogCancelBtn = this.page.getByRole('button', { name: 'Cancel', exact: true });

  constructor(page: Page) {
    super(page);
  }

  // Bật/tắt chế độ Quick Mode
  async setQuickMode(enable: boolean) {
    await test.step(`Set Quick Mode to: ${enable}`, async () => {
      const isChecked = await this.quickModeCheckbox.isChecked();
      if (enable !== isChecked) {
        await this.quickModeCheckbox.click();
        await this.waitForPageLoad();
      }
    });
  }

  // Điền form thông tin cơ bản (Quick Mode)
  async fillQuickModeDetails(details: {
    patientType: string;
    firstName: string;
    lastName: string;
    birthSex: string;
    dob: string;
    careGroup: string;
    idType: string;
    idNo: string;
    phoneType: string;
    phone: string;
    email: string;
    region?: string;
    province?: string;
    city?: string;
    barangay?: string;
  }) {
    await test.step(`Fill Quick Mode patient details for: ${details.firstName} ${details.lastName}`, async () => {
      await this.selectDropdownOption(this.patientTypeCombobox, details.patientType);
      await this.typeText(this.firstNameInput, details.firstName);
      await this.typeText(this.lastNameInput, details.lastName);
      await this.selectDropdownOption(this.birthSexCombobox, details.birthSex);
      await this.typeText(this.dobInput, details.dob);
      await this.selectDropdownOption(this.careGroupCombobox, details.careGroup);
      
      // Điền ID
      await this.selectDropdownOption(this.idTypeCombobox, details.idType);
      await this.typeText(this.idNoInput, details.idNo);

      // Điền Contact Info
      await this.selectDropdownOption(this.phoneTypeCombobox, details.phoneType);
      await this.typeText(this.phoneInput, details.phone);
      await this.typeText(this.contactEmailInput, details.email);

      // Điền Địa chỉ (Cascading Dropdown)
      if (details.region) {
        await this.selectDropdownOption(this.regionCombobox, details.region);
      }
      if (details.province) {
        await this.selectDropdownOption(this.provinceCombobox, details.province);
      }
      if (details.city) {
        await this.selectDropdownOption(this.cityCombobox, details.city);
      }
      if (details.barangay) {
        await this.selectDropdownOption(this.barangayCombobox, details.barangay);
      }
    });
  }

  // Check N/A cho Middle Name và Last Name
  async checkMiddleNameNa() {
    await test.step('Check Middle Name as N/A', async () => {
      await this.clickElement(this.middleNameNaCheckbox);
    });
  }

  async checkLastNameNa() {
    await test.step('Check Last Name as N/A', async () => {
      await this.clickElement(this.lastNameNaCheckbox);
    });
  }

  // Check Unknown cho DOB
  async checkDobUnknown() {
    await test.step('Check Date of Birth as Unknown', async () => {
      await this.clickElement(this.dobUnknownCheckbox);
    });
  }

  // Tải ảnh đại diện lên biểu mẫu
  async uploadPhoto(filePath: string) {
    await test.step(`Upload patient photo from path: "${filePath}"`, async () => {
      await this.fileInput.setInputFiles(filePath);
      await this.clickElement(this.uploadPhotoBtn);
      await this.waitForPageLoad();
    });
  }

  // Lưu thông tin (Click Next)
  async clickNext() {
    await test.step('Click Next button to submit patient form', async () => {
      await this.clickElement(this.nextBtn);
      await this.waitForPageLoad();
    });
  }

  // Hủy biểu mẫu
  async clickCancel() {
    await test.step('Click Cancel button to discard patient registration', async () => {
      await this.clickElement(this.cancelBtn);
    });
  }

  // Đồng ý đóng form trên warning dialog
  async confirmCancel() {
    await test.step('Confirm cancellation in warning dialog', async () => {
      await this.clickElement(this.dialogOkBtn);
      await this.waitForPageLoad();
    });
  }

  // Hủy bỏ việc đóng form trên warning dialog
  async discardCancel() {
    await test.step('Discard cancellation in warning dialog', async () => {
      await this.clickElement(this.dialogCancelBtn);
    });
  }
}
