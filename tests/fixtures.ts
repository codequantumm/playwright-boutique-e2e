import { test as base, expect } from '@playwright/test';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';

type Fixtures = {
  catalog: CatalogPage;
  cart: CartPage;
  checkout: CheckoutPage;
};

// Chaque test reçoit ses propres page objects, sur un contexte de navigateur neuf :
// pas de données partagées entre les tests, ils peuvent donc tourner en parallèle.
export const test = base.extend<Fixtures>({
  catalog: async ({ page }, use) => { await use(new CatalogPage(page)); },
  cart: async ({ page }, use) => { await use(new CartPage(page)); },
  checkout: async ({ page }, use) => { await use(new CheckoutPage(page)); },
});

export { expect };
