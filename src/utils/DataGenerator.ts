export class DataGenerator {
  // Hàm sinh timestamp duy nhất
  static getTimestamp(): string {
    return Date.now().toString();
  }

  // Sinh email ngẫu nhiên có tiền tố để dễ truy vết
  static getRandomEmail(prefix: string): string {
    return `${prefix}_${this.getTimestamp()}@auto.test`;
  }

  // Sinh số điện thoại ngẫu nhiên có độ dài 9 số sau mã vùng
  static getRandomPhone(): string {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    return `9${randomDigits}`;
  }

  // Sinh mã số ID ngẫu nhiên (ví dụ Passport)
  static getRandomIdNumber(prefix: string): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `${prefix}${randomDigits}`;
  }

  // Sinh tên bệnh nhân ngẫu nhiên
  static getRandomPatientName(firstNamePrefix: string): { firstName: string; lastName: string } {
    const timestamp = this.getTimestamp();
    return {
      firstName: `${firstNamePrefix}`,
      lastName: `Auto${timestamp}`
    };
  }
}
