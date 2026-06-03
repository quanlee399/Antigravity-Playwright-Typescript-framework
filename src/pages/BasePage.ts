import { Page, expect, test } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Chờ trang tải xong dựa trên trạng thái loadstate (Không ghi log để tránh dư thừa step)
  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Chờ element hiển thị và sẵn sàng tương tác
  async waitForElementVisible(selector: string) {
    await test.step(`Wait for element to be visible: "${selector}"`, async () => {
      const locator = this.page.locator(selector);
      await expect(locator).toBeVisible();
    });
  }

  // Điền text vào element sau khi kiểm tra hiển thị
  async typeText(locator: any, text: string) {
    const locatorStr = locator.toString();
    await test.step(`Type "${text}" into field: ${locatorStr}`, async () => {
      await expect(locator).toBeVisible();
      await locator.fill(text);
    });
  }

  // Click vào element sau khi kiểm tra hiển thị và enable
  async clickElement(locator: any) {
    const locatorStr = locator.toString();
    await test.step(`Click on element: ${locatorStr}`, async () => {
      await expect(locator).toBeVisible();
      await expect(locator).toBeEnabled();
      await locator.click();
    });
  }

  // Chọn tùy chọn từ dropdown combobox
  async selectDropdownOption(comboboxLocator: any, optionText: string) {
    const comboboxStr = comboboxLocator.toString();
    await test.step(`Select option "${optionText}" from combobox: ${comboboxStr}`, async () => {
      await this.clickElement(comboboxLocator);
      const option = this.page.getByRole('option', { name: optionText, exact: true });
      await this.clickElement(option);
    });
  }
}
