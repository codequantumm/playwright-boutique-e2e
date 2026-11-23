import { expect, type Locator, type Page } from '@playwright/test';
import type { Currency } from '../data/catalog';

export class CatalogPage {
  readonly cards: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly currencySelect: Locator;
  readonly cartCount: Locator;
  readonly noResult: Locator;

  constructor(private readonly page: Page) {
    this.cards = page.getByTestId('product-card');
    this.searchInput = page.getByLabel('Rechercher');
    this.categoryFilter = page.getByLabel('Catégorie');
    this.currencySelect = page.getByLabel('Devise');
    this.cartCount = page.getByTestId('cart-count');
    this.noResult = page.getByTestId('no-result');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.cards.first()).toBeVisible();
  }

  card(name: string): Locator {
    return this.cards.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  priceOf(name: string): Locator {
    return this.card(name).getByTestId('product-price');
  }

  async productNames(): Promise<string[]> {
    return this.cards.getByRole('heading').allTextContents();
  }

  async addToCart(name: string) {
    await this.page.getByRole('button', { name: `Ajouter ${name} au panier` }).click();
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  async filterByCategory(category: 'all' | 'soins' | 'maison') {
    await this.categoryFilter.selectOption(category);
  }

  async selectCurrency(currency: Currency) {
    await this.currencySelect.selectOption(currency);
  }

  async openCart() {
    await this.page.getByTestId('cart-link').click();
  }
}
