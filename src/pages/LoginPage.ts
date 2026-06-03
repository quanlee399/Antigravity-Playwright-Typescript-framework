import { Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators sử dụng các thuộc tính semantic ổn định đã khảo sát từ DOM
  readonly usernameInput = this.page.getByRole('textbox', { name: 'Username' });
  readonly passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  readonly loginBtn = this.page.getByRole('button', { name: 'Log In' });

  constructor(page: Page) {
    super(page);
  }

  // Điều hướng tới trang đăng nhập
  async navigateTo(url: string) {
    await test.step(`Navigate to URL: "${url}"`, async () => {
      await this.page.goto(url);
      await this.waitForPageLoad();
    });
  }

  // Thực hiện đăng nhập vào hệ thống
  async login(username: string, password: string) {
    await test.step(`Login to EMR portal with username: "${username}"`, async () => {
      await this.typeText(this.usernameInput, username);
      await this.typeText(this.passwordInput, password);
      await this.clickElement(this.loginBtn);
      await this.waitForPageLoad();
    });
  }
}
