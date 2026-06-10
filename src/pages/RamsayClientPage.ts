import { Page, test, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RamsayClientPage extends BasePage {
  // Navigation Link
  readonly settingsSidebarLink = this.page.locator("a[href='/settings']");
  readonly clientTabBtn = this.page.locator('div.ant-tabs-tab-btn:has-text("Client")');
  
  // Client Table Locators
  readonly clientTable = this.page.locator('table');
  readonly clientRows = this.page.locator('tbody tr.ant-table-row');
  
  // Các cột theo Acceptance Criteria của SCRUM-10
  readonly headerCustomerName = this.page.locator('thead th').filter({ hasText: 'Customer Name' });
  readonly headerPrimaryContact = this.page.locator('thead th').filter({ hasText: 'Primary Contact' });
  readonly headerPhone = this.page.locator('thead th').filter({ hasText: 'Phone' });
  readonly headerEmail = this.page.locator('thead th').filter({ hasText: 'Email' });
  readonly headerServiceLocation = this.page.locator('thead th').filter({ hasText: 'Service Location' });
  readonly headerCityState = this.page.locator('thead th').filter({ hasText: 'City, State' });
  readonly headerStatus = this.page.locator('thead th').filter({ hasText: 'Status' });
  readonly headerAction = this.page.locator('thead th').filter({ hasText: 'Action' });

  // Search and Pagination Locators
  readonly searchInput = this.page.locator('input[placeholder="Search..."]');
  readonly searchInputAC = this.page.locator('input[placeholder="Search by Customer Name"]');
  readonly statusFilterAC = this.page.locator('div.status-filter-ac'); // Bộ lọc Status theo AC
  
  readonly paginationPrev = this.page.locator('li.ant-pagination-prev');
  readonly paginationNext = this.page.locator('li.ant-pagination-next');
  readonly paginationItem = this.page.locator('li.ant-pagination-item');
  readonly activePageItem = this.page.locator('li.ant-pagination-item-active');

  // Add/Edit Client Modal Locators
  readonly addClientBtn = this.page.locator('button:has-text("Add client")');
  readonly programNameInput = this.page.locator('input[placeholder="Program name"]');
  readonly brandsSelector = this.page.locator('div.ant-modal-content .ant-select-selector');
  readonly saveBtn = this.page.locator('div.ant-modal-content button:has-text("Save")');
  readonly cancelBtn = this.page.locator('div.ant-modal-content button:has-text("Cancel")');
  readonly modalCloseBtn = this.page.locator('div.ant-modal-content button.ant-modal-close');

  // Delete Confirmation Modal Locators
  readonly deleteConfirmModal = this.page.locator('div.ant-modal-content').filter({ hasText: 'Delete Client' });
  readonly deleteConfirmBtn = this.page.locator('div.ant-modal-content button').filter({ hasText: 'Delete' });
  readonly deleteCancelBtn = this.page.locator('div.ant-modal-content button').filter({ hasText: 'Cancel' });

  constructor(page: Page) {
    super(page);
  }

  // Điều hướng tới Settings và chọn tab Client
  async navigateToClientTab() {
    await test.step('Navigate to Settings -> Client tab', async () => {
      await this.clickElement(this.settingsSidebarLink);
      await this.waitForPageLoad();
      await this.clickElement(this.clientTabBtn);
      await this.waitForPageLoad();
    });
  }

  // Lấy locator của một dòng Client cụ thể dựa vào tên
  getClientRow(name: string) {
    return this.page.locator('tbody tr.ant-table-row').filter({ hasText: name });
  }

  // Click vào nút Action (dấu ba chấm ...) của một Client cụ thể
  async clickClientActions(name: string) {
    await test.step(`Click actions menu (...) for client: "${name}"`, async () => {
      const row = this.getClientRow(name);
      const actionsBtn = row.locator('button.ant-dropdown-trigger');
      await this.clickElement(actionsBtn);
    });
  }

  // Click chọn 'Edit' trong dropdown menu
  async selectEditFromMenu(name: string) {
    await test.step(`Select Edit option for client: "${name}"`, async () => {
      await this.clickClientActions(name);
      // Selector của ant dropdown menu item chứa text 'Edit'
      const editOpt = this.page.locator('.ant-dropdown-menu-item').filter({ hasText: 'Edit' });
      await this.clickElement(editOpt);
      await this.waitForPageLoad();
    });
  }

  // Click chọn 'Delete' trong dropdown menu
  async selectDeleteFromMenu(name: string) {
    await test.step(`Select Delete option for client: "${name}"`, async () => {
      await this.clickClientActions(name);
      // Selector của ant dropdown menu item chứa text 'Delete'
      const deleteOpt = this.page.locator('.ant-dropdown-menu-item').filter({ hasText: 'Delete' });
      await this.clickElement(deleteOpt);
      await this.waitForPageLoad();
    });
  }

  // Điền form Add/Edit Client
  async fillClientForm(name: string, brand?: string) {
    await test.step(`Fill Client form with Name: "${name}"`, async () => {
      await this.programNameInput.fill(name);
      
      if (brand) {
        await this.clickElement(this.brandsSelector);
        // Tìm và click option tương ứng trong dropdown select của Ant Design
        const option = this.page.locator('.ant-select-item-option').filter({ hasText: brand });
        await this.clickElement(option);
      }
    });
  }
}
