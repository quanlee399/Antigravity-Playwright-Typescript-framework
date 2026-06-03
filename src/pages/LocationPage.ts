import { Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LocationPage extends BasePage {
  // Locators
  readonly searchLocationInput = this.page.getByRole('textbox', { name: 'Search for a Location' });
  readonly continueBtn = this.page.getByRole('button', { name: 'Continue' });

  constructor(page: Page) {
    super(page);
  }

  // Chọn location dựa vào tên địa điểm
  async selectLocation(locationName: string) {
    await test.step(`Select location: "${locationName}"`, async () => {
      // Nếu danh sách dài, tìm kiếm trước
      if (await this.searchLocationInput.isVisible()) {
        await this.typeText(this.searchLocationInput, locationName);
      }
      
      // Tìm phần tử radio ứng với locationName
      const locationRadio = this.page.locator('div').filter({ hasText: locationName }).getByRole('radio').first();
      await this.clickElement(locationRadio);
    });
  }

  // Nhấn tiếp tục để vào Status Board
  async clickContinue() {
    await test.step(`Click Continue button to confirm location`, async () => {
      await this.clickElement(this.continueBtn);
      await this.waitForPageLoad();
    });
  }
}
