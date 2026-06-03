import { Page, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class StatusBoardPage extends BasePage {
  // Locators chính của Status Board
  readonly searchInput = this.page.getByRole('textbox', { name: 'Search by Patient name or MRN' });
  readonly filtersBtn = this.page.getByRole('button', { name: /Filters/ });
  readonly createErRecordBtn = this.page.getByRole('button', { name: /Create ER Record/ });
  
  // Locators bộ lọc Filters Panel
  readonly filterPanel = this.page.locator('div.filter-panel, div').filter({ hasText: 'Filters' }); // Khung bộ lọc
  readonly filterEsiLevel = this.page.getByRole('combobox', { name: 'ESI Level' });
  readonly filterAssignedNurse = this.page.getByRole('combobox', { name: 'Assigned Nurse' });
  readonly filterCriticalPatientsCheckbox = this.page.getByRole('checkbox', { name: 'Critical Patients' });
  readonly filterPatientStatus = this.page.getByRole('combobox', { name: 'Patient Status' });
  readonly filterClearAllBtn = this.page.getByRole('button', { name: 'Clear All' });
  readonly filterApplyBtn = this.page.getByRole('button', { name: 'Apply' });

  constructor(page: Page) {
    super(page);
  }

  // Chuyển đổi tab danh sách bệnh nhân
  async switchTab(tabName: 'All' | 'Intake' | 'Receiving Care' | 'Ready For Disposition' | 'My Patients') {
    await test.step(`Switch status board tab to: "${tabName}"`, async () => {
      const tabLocator = this.page.getByRole('tab').filter({ hasText: tabName });
      await this.clickElement(tabLocator);
      await this.waitForPageLoad();
    });
  }

  // Lấy số lượng hiển thị trên tab
  async getTabCount(tabName: string): Promise<string> {
    return await test.step(`Get count for tab: "${tabName}"`, async () => {
      const tabLocator = this.page.getByRole('tab').filter({ hasText: tabName });
      const fullText = await tabLocator.innerText();
      return fullText.replace(tabName, '').trim();
    });
  }

  // Tìm kiếm nhanh bệnh nhân
  async searchPatient(query: string) {
    await test.step(`Search patient in status board for: "${query}"`, async () => {
      await this.typeText(this.searchInput, query);
      await this.page.keyboard.press('Enter');
      await this.waitForPageLoad();
    });
  }

  // Mở bộ lọc, điền các tiêu chí và nhấn Apply
  async applyFilters(filters: { esiLevel?: string; nurse?: string; criticalOnly?: boolean; status?: string }) {
    await test.step(`Apply filters: ${JSON.stringify(filters)}`, async () => {
      await this.clickElement(this.filtersBtn);
      
      if (filters.esiLevel) {
        await this.selectDropdownOption(this.filterEsiLevel, filters.esiLevel);
      }
      if (filters.nurse) {
        await this.selectDropdownOption(this.filterAssignedNurse, filters.nurse);
      }
      if (filters.criticalOnly !== undefined) {
        const isChecked = await this.filterCriticalPatientsCheckbox.isChecked();
        if (filters.criticalOnly !== isChecked) {
          await this.filterCriticalPatientsCheckbox.click();
        }
      }
      if (filters.status) {
        await this.selectDropdownOption(this.filterPatientStatus, filters.status);
      }
      
      await this.clickElement(this.filterApplyBtn);
      await this.waitForPageLoad();
    });
  }

  // Nhấn nút Clear All bộ lọc
  async clearAllFilters() {
    await test.step('Clear all active filters', async () => {
      await this.clickElement(this.filtersBtn);
      await this.clickElement(this.filterClearAllBtn);
      await this.clickElement(this.filterApplyBtn);
      await this.waitForPageLoad();
    });
  }

  // Lấy thẻ bệnh nhân (Card) cụ thể
  getPatientCard(patientNameOrMrn: string) {
    return this.page.locator('div').filter({ hasText: patientNameOrMrn }).first();
  }

  // Click vào nút edit ESI trên thẻ bệnh nhân và chọn mức ESI mới
  async quickUpdateEsi(patientName: string, newEsiLevel: string) {
    await test.step(`Quick update ESI level of "${patientName}" to "${newEsiLevel}"`, async () => {
      const card = this.getPatientCard(patientName);
      const esiBtn = card.locator('button').filter({ hasText: /ESI-/ });
      await this.clickElement(esiBtn);
      
      // Chọn mức ESI mới từ menu dropdown
      const option = this.page.getByRole('option', { name: newEsiLevel, exact: true });
      await this.clickElement(option);
      await this.waitForPageLoad();
    });
  }

  // Cập nhật Attending Physician cho bệnh nhân
  async quickAssignPhysician(patientName: string, doctorName: string) {
    await test.step(`Quick assign physician "${doctorName}" to patient "${patientName}"`, async () => {
      const card = this.getPatientCard(patientName);
      const physicianCombobox = card.getByRole('combobox', { name: 'Attending Physician' });
      await this.selectDropdownOption(physicianCombobox, doctorName);
      await this.waitForPageLoad();
    });
  }

  // Cập nhật Nurse cho bệnh nhân
  async quickAssignNurse(patientName: string, nurseName: string) {
    await test.step(`Quick assign nurse "${nurseName}" to patient "${patientName}"`, async () => {
      const card = this.getPatientCard(patientName);
      const nurseCombobox = card.getByRole('combobox', { name: 'Nurse' });
      await this.selectDropdownOption(nurseCombobox, nurseName);
      await this.waitForPageLoad();
    });
  }

  // Cập nhật Next Step cho bệnh nhân
  async quickUpdateNextStep(patientName: string, nextStepName: string) {
    await test.step(`Quick update next step of "${patientName}" to "${nextStepName}"`, async () => {
      const card = this.getPatientCard(patientName);
      const nextStepCombobox = card.getByRole('combobox', { name: 'Next Step' });
      await this.selectDropdownOption(nextStepCombobox, nextStepName);
      await this.waitForPageLoad();
    });
  }

  // Đi đến màn hình Create ER Record
  async goToCreateErRecord() {
    await test.step('Go to Create ER Record page', async () => {
      await this.clickElement(this.createErRecordBtn);
      await this.waitForPageLoad();
    });
  }

  // Nhấn nút Process Intake trên thẻ bệnh nhân
  async clickProcessIntake(patientName: string) {
    await test.step(`Click Process Intake for patient: "${patientName}"`, async () => {
      const card = this.getPatientCard(patientName);
      const processBtn = card.getByRole('button', { name: 'Process Intake' });
      await this.clickElement(processBtn);
      await this.waitForPageLoad();
    });
  }

  // Nhấn nút Start/Open Encounter trên thẻ bệnh nhân
  async clickEncounterButton(patientName: string) {
    await test.step(`Click Encounter button for patient: "${patientName}"`, async () => {
      const card = this.getPatientCard(patientName);
      const encounterBtn = card.getByRole('button').filter({ hasText: /Encounter/ });
      await this.clickElement(encounterBtn);
      await this.waitForPageLoad();
    });
  }
}
