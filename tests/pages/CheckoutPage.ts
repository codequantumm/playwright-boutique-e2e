import type { Locator, Page } from '@playwright/test';

export type CheckoutField = 'fullName' | 'email' | 'address';

export class CheckoutPage {
  readonly fullName: Locator;
  readonly email: Locator;
  readonly address: Locator;
  readonly payButton: Locator;
  readonly paymentError: Locator;
  readonly confirmationHeading: Locator;
  readonly orderId: Locator;
  readonly orderTotal: Locator;

  constructor(private readonly page: Page) {
    this.fullName = page.getByLabel('Nom complet');
    this.email = page.getByLabel('Adresse e-mail');
    this.address = page.getByLabel('Adresse de livraison');
    this.payButton = page.getByRole('button', { name: /^Payer/ });
    this.paymentError = page.getByTestId('payment-error');
    this.confirmationHeading = page.getByRole('heading', { name: 'Merci pour votre commande' });
    this.orderId = page.getByTestId('order-id');
    this.orderTotal = page.getByTestId('order-total');
  }

  error(field: CheckoutField): Locator {
    return this.page.getByTestId(`error-${field}`);
  }

  async fill(customer: { fullName: string; email: string; address: string }) {
    await this.fullName.fill(customer.fullName);
    await this.email.fill(customer.email);
    await this.address.fill(customer.address);
  }

  async pay() {
    await this.payButton.click();
  }
}
