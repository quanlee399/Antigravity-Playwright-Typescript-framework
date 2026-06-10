import { Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class RamsayLoginPage extends BasePage {
  // Locators dựa trên khảo sát thực tế
  readonly emailInput = this.page.locator('input#email');
  readonly passwordInput = this.page.locator('input#password');
  readonly loginBtn = this.page.locator('button.ant-btn-primary:has-text("Login")');

  constructor(page: Page) {
    super(page);
  }

  // Điều hướng tới trang đăng nhập Ramsay Sales
  async navigateTo(url: string) {
    await test.step(`Navigate to Ramsay Login URL: "${url}"`, async () => {
      await this.page.goto(url);
      await this.waitForPageLoad();
    });
  }

  // Thực hiện đăng nhập
  async login(username: string, password: string) {
    await test.step(`Login to Ramsay Sales with email: "${username}"`, async () => {
      await this.typeText(this.emailInput, username);
      await this.typeText(this.passwordInput, password);
      await this.clickElement(this.loginBtn);
      await this.waitForPageLoad();
    });
  }
}
