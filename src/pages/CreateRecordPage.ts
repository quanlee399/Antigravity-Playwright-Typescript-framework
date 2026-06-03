import { Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class CreateRecordPage extends BasePage {
  // Locators
  readonly searchPatientInput = this.page.getByRole('textbox', { name: 'Search by Patient name or MRN' });
  readonly advancedSearchBtn = this.page.getByRole('button', { name: /Advanced Search/ });
  readonly addNewPatientBtn = this.page.getByRole('button', { name: /Add New Patient/ });
  readonly selectBtn = this.page.getByRole('button', { name: 'Select' });
  readonly clearSearchBtn = this.page.getByRole('button', { name: 'Clear Search' });

  // Advanced Search Locators
  readonly advFirstNameInput = this.page.getByRole('textbox', { name: 'First Name' });
  readonly advMiddleNameInput = this.page.getByRole('textbox', { name: 'Middle Name' });
  readonly advLastNameInput = this.page.getByRole('textbox', { name: 'Last Name' });
  readonly advBirthSexCombobox = this.page.getByRole('combobox', { name: 'Birth Sex' });
  readonly advDobInput = this.page.getByPlaceholder('MM/DD/YYYY');
  readonly advPhoneInput = this.page.getByPlaceholder('Phone');
  readonly advCountryCombobox = this.page.getByRole('combobox', { name: 'Country' });
  readonly advStateInput = this.page.getByRole('textbox', { name: 'State' });
  readonly advCityInput = this.page.getByRole('textbox', { name: 'City' });
  readonly advClearBtn = this.page.locator('div').filter({ hasText: 'Advanced Search' }).getByText('Clear Search');

  constructor(page: Page) {
    super(page);
  }

  // Tìm kiếm nhanh bệnh nhân cũ
  async quickSearch(query: string) {
    await test.step(`Perform quick search for patient: "${query}"`, async () => {
      await this.typeText(this.searchPatientInput, query);
      await this.page.keyboard.press('Enter');
      await this.waitForPageLoad();
    });
  }

  // Tìm kiếm nâng cao (Advanced Search)
  async advancedSearch(criteria: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    birthSex?: string;
    dob?: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
  }) {
    await test.step(`Perform advanced search with criteria: ${JSON.stringify(criteria)}`, async () => {
      // Mở Advanced Search nếu chưa mở
      const isExpanded = await this.advFirstNameInput.isVisible();
      if (!isExpanded) {
        await this.clickElement(this.advancedSearchBtn);
      }

      if (criteria.firstName) await this.typeText(this.advFirstNameInput, criteria.firstName);
      if (criteria.middleName) await this.typeText(this.advMiddleNameInput, criteria.middleName);
      if (criteria.lastName) await this.typeText(this.advLastNameInput, criteria.lastName);
      if (criteria.birthSex) await this.selectDropdownOption(this.advBirthSexCombobox, criteria.birthSex);
      if (criteria.dob) await this.typeText(this.advDobInput, criteria.dob);
      if (criteria.phone) await this.typeText(this.advPhoneInput, criteria.phone);
      if (criteria.country) await this.selectDropdownOption(this.advCountryCombobox, criteria.country);
      if (criteria.state) await this.typeText(this.advStateInput, criteria.state);
      if (criteria.city) await this.typeText(this.advCityInput, criteria.city);

      // Kích hoạt tìm kiếm
      await this.page.keyboard.press('Enter');
      await this.waitForPageLoad();
    });
  }

  // Chọn một kết quả bệnh nhân trong danh sách tìm thấy
  async selectPatientResult(patientNameOrMrn: string) {
    await test.step(`Select patient result containing: "${patientNameOrMrn}"`, async () => {
      const resultItem = this.page.locator('div, tr').filter({ hasText: patientNameOrMrn }).first();
      await this.clickElement(resultItem);
    });
  }

  // Nhấn nút Select để liên kết hồ sơ
  async clickSelectLink() {
    await test.step(`Click Select button to link record`, async () => {
      await this.clickElement(this.selectBtn);
      await this.waitForPageLoad();
    });
  }

  // Đi đến form Add New Patient
  async navigateToAddNewPatient() {
    await test.step(`Navigate to Add New Patient page`, async () => {
      await this.clickElement(this.addNewPatientBtn);
      await this.waitForPageLoad();
    });
  }
}
