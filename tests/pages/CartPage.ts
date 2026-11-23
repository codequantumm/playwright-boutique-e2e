import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly rows: Locator;
  readonly emptyMessage: Locator;
  readonly promoInput: Locator;
  readonly applyPromoButton: Locator;
  readonly promoMessage: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly checkoutLink: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByTestId('cart-row');
    this.emptyMessage = page.getByTestId('cart-empty');
    this.promoInput = page.getByLabel('Code promo');
    this.applyPromoButton = page.getByRole('button', { name: 'Appliquer' });
    this.promoMessage = page.getByTestId('promo-message');
    this.subtotal = page.getByTestId('subtotal');
    this.discount = page.getByTestId('discount');
    this.shipping = page.getByTestId('shipping');
    this.total = page.getByTestId('total');
    this.checkoutLink = page.getByRole('link', { name: 'Passer au paiement' });
  }

  async goto() {
    await this.page.goto('/#/panier');
  }

  quantityInput(name: string): Locator {
    return this.page.getByLabel(`Quantité ${name}`);
  }

  async setQuantity(name: string, quantity: number) {
    const input = this.quantityInput(name);
    await input.fill(String(quantity));
    await input.blur(); // la mise à jour se déclenche à la sortie du champ
  }

  async remove(name: string) {
    await this.page.getByRole('button', { name: `Supprimer ${name}` }).click();
  }

  async applyPromo(code: string) {
    await this.promoInput.fill(code);
    await this.applyPromoButton.click();
  }

  async proceedToCheckout() {
    await this.checkoutLink.click();
  }
}
