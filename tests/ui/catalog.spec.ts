import { test, expect } from '../fixtures';
import { CURRENCIES, PRODUCTS } from '../data/catalog';

test.describe('Catalogue', () => {
  test.beforeEach(async ({ catalog }) => {
    await catalog.goto();
  });

  test('affiche les 6 produits du catalogue', { tag: '@smoke' }, async ({ catalog }) => {
    await expect(catalog.cards).toHaveCount(PRODUCTS.length);
    expect(await catalog.productNames()).toEqual(PRODUCTS.map((p) => p.name));
  });

  for (const category of ['soins', 'maison'] as const) {
    test(`filtre les produits de la catégorie « ${category} »`, { tag: '@regression' }, async ({ catalog }) => {
      await catalog.filterByCategory(category);
      const expected = PRODUCTS.filter((p) => p.category === category).map((p) => p.name);
      await expect(catalog.cards).toHaveCount(expected.length);
      expect(await catalog.productNames()).toEqual(expected);
    });
  }

  test('recherche un produit par son nom', { tag: '@regression' }, async ({ catalog }) => {
    await catalog.search('bougie');
    await expect(catalog.cards).toHaveCount(1);
    await expect(catalog.card('Bougie Cèdre')).toBeVisible();
  });

  test('affiche un message quand la recherche ne donne aucun résultat', { tag: '@regression' }, async ({ catalog }) => {
    await catalog.search('xyz');
    await expect(catalog.cards).toHaveCount(0);
    await expect(catalog.noResult).toBeVisible();
    await expect(catalog.noResult).toHaveText('Aucun produit ne correspond à votre recherche.');
  });

  // Test piloté par les données : un scénario par devise, valeurs attendues écrites en dur.
  for (const currency of CURRENCIES) {
    test(`affiche les prix en ${currency}`, { tag: '@regression' }, async ({ catalog }) => {
      await catalog.selectCurrency(currency);
      for (const product of PRODUCTS) {
        await expect(catalog.priceOf(product.name), `prix de ${product.name}`).toHaveText(product.prices[currency]);
      }
    });
  }

  test('conserve la devise choisie après rechargement', { tag: '@regression' }, async ({ catalog, page }) => {
    await catalog.selectCurrency('USD');
    await page.reload();
    await expect(catalog.currencySelect).toHaveValue('USD');
    await expect(catalog.priceOf('Savon Lavande')).toHaveText('$8.80');
  });
});
