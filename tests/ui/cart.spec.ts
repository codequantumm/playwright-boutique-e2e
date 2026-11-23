import { test, expect } from '../fixtures';

test.describe('Panier', { tag: '@regression' }, () => {
  test.beforeEach(async ({ catalog }) => {
    await catalog.goto();
  });

  test('met à jour le compteur et regroupe les ajouts du même produit', async ({ catalog, cart }) => {
    await catalog.addToCart('Savon Lavande');
    await expect(catalog.cartCount).toHaveText('1');
    await catalog.addToCart('Savon Lavande');
    await expect(catalog.cartCount).toHaveText('2');

    await catalog.openCart();
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.quantityInput('Savon Lavande')).toHaveValue('2');
    await expect(cart.subtotal).toHaveText('16,00 €');
  });

  test('recalcule les montants quand la quantité change', async ({ catalog, cart }) => {
    await catalog.addToCart('Bougie Cèdre');
    await catalog.openCart();
    await cart.setQuantity('Bougie Cèdre', 3);
    await expect(cart.subtotal).toHaveText('72,00 €');
    await expect(cart.total).toHaveText('72,00 €');
  });

  test('ramène la quantité à 1 si on saisit 0', async ({ catalog, cart }) => {
    await catalog.addToCart('Bougie Cèdre');
    await catalog.openCart();
    await cart.setQuantity('Bougie Cèdre', 0);
    await expect(cart.quantityInput('Bougie Cèdre')).toHaveValue('1');
  });

  test('supprime un article et affiche le panier vide', async ({ catalog, cart }) => {
    await catalog.addToCart('Plaid Lin');
    await catalog.openCart();
    await cart.remove('Plaid Lin');
    await expect(cart.emptyMessage).toHaveText('Votre panier est vide.');
    await expect(catalog.cartCount).toHaveText('0');
  });

  test('conserve le panier après rechargement de la page', async ({ catalog, cart, page }) => {
    await catalog.addToCart('Gel Douche Agrumes');
    await catalog.openCart();
    await page.reload();
    await expect(cart.rows).toHaveCount(1);
    await expect(catalog.cartCount).toHaveText('1');
  });

  test.describe('Code promo', () => {
    test.beforeEach(async ({ catalog, cart }) => {
      await catalog.addToCart('Plaid Lin');
      await catalog.openCart();
      await expect(cart.discount).toHaveCount(0);
    });

    test('applique une remise de 10 % avec un code valide', async ({ cart }) => {
      await cart.applyPromo('BIENVENUE10');
      await expect(cart.promoMessage).toHaveText('Code BIENVENUE10 appliqué : -10 %');
      await expect(cart.discount).toHaveText('-6,00 €');
      await expect(cart.total).toHaveText('54,00 €');
    });

    test('accepte le code sans tenir compte des majuscules', async ({ cart }) => {
      await cart.applyPromo('bienvenue10');
      await expect(cart.discount).toHaveText('-6,00 €');
    });

    test('refuse un code invalide sans modifier le total', async ({ cart }) => {
      await cart.applyPromo('FAUXCODE');
      await expect(cart.promoMessage).toHaveText('Code promo invalide.');
      await expect(cart.discount).toHaveCount(0);
      await expect(cart.total).toHaveText('60,00 €');
    });
  });

  // Règle métier : la livraison (5 €) est offerte à partir de 50 € APRÈS remise.
  const shippingCases = [
    { title: '48 € : livraison payante', items: [['Savon Lavande', 6]], promo: '', shipping: '5,00 €', total: '53,00 €' },
    { title: '50 € pile : livraison offerte', items: [['Crème Hydratante', 1], ['Gel Douche Agrumes', 3]], promo: '', shipping: 'Offerte', total: '50,00 €' },
    { title: '60 € : livraison offerte', items: [['Plaid Lin', 1]], promo: '', shipping: 'Offerte', total: '60,00 €' },
    { title: '50 € avec remise (45 € net) : livraison payante', items: [['Crème Hydratante', 1], ['Gel Douche Agrumes', 3]], promo: 'BIENVENUE10', shipping: '5,00 €', total: '50,00 €' },
  ] as const;

  for (const c of shippingCases) {
    test(`seuil de livraison offerte – ${c.title}`, async ({ catalog, cart }) => {
      for (const [name, quantity] of c.items) {
        await catalog.addToCart(name);
        if (quantity > 1) {
          // les ajouts successifs incrémentent la quantité
          for (let i = 1; i < quantity; i++) await catalog.addToCart(name);
        }
      }
      await catalog.openCart();
      if (c.promo) await cart.applyPromo(c.promo);
      await expect(cart.shipping).toHaveText(c.shipping);
      await expect(cart.total).toHaveText(c.total);
    });
  }

  test('affiche les montants dans la devise choisie', async ({ catalog, cart }) => {
    await catalog.selectCurrency('USD');
    await catalog.addToCart('Savon Lavande');
    await catalog.openCart();
    await expect(cart.subtotal).toHaveText('$8.80');
    await expect(cart.shipping).toHaveText('$5.50');
    await expect(cart.total).toHaveText('$14.30');
  });
});
