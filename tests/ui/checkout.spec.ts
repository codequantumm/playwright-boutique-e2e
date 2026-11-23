import { test, expect } from '../fixtures';
import { CUSTOMER } from '../data/catalog';

test.describe('Paiement', () => {
  test('parcours d\'achat complet : du catalogue à la confirmation', { tag: '@smoke' }, async ({ catalog, cart, checkout }) => {
    await test.step('Ajouter un produit au panier', async () => {
      await catalog.goto();
      await catalog.addToCart('Savon Lavande');
      await catalog.openCart();
      await expect(cart.total).toHaveText('13,00 €'); // 8 € + 5 € de livraison
    });

    await test.step('Renseigner les informations et payer', async () => {
      await cart.proceedToCheckout();
      await checkout.fill(CUSTOMER);
      await checkout.pay();
    });

    await test.step('Vérifier la confirmation et le panier vidé', async () => {
      await expect(checkout.confirmationHeading).toBeVisible();
      await expect(checkout.orderId).toHaveText(/^CMD-\d{6}$/);
      await expect(checkout.orderTotal).toHaveText('13,00 €');
      await expect(catalog.cartCount).toHaveText('0');
    });
  });

  test('applique le code promo jusqu\'à la confirmation', { tag: '@regression' }, async ({ catalog, cart, checkout }) => {
    await catalog.goto();
    await catalog.addToCart('Plaid Lin');
    await catalog.openCart();
    await cart.applyPromo('BIENVENUE10');
    await cart.proceedToCheckout();
    await checkout.fill(CUSTOMER);
    await checkout.pay();
    await expect(checkout.orderTotal).toHaveText('54,00 €');
  });

  test.describe('Validation du formulaire', { tag: '@regression' }, () => {
    test.beforeEach(async ({ catalog, cart }) => {
      await catalog.goto();
      await catalog.addToCart('Bougie Cèdre');
      await catalog.openCart();
      await cart.proceedToCheckout();
    });

    test('signale tous les champs obligatoires vides', async ({ checkout }) => {
      await checkout.pay();
      await expect(checkout.error('fullName')).toHaveText('Le nom est obligatoire.');
      await expect(checkout.error('email')).toHaveText('Veuillez saisir une adresse e-mail valide.');
      await expect(checkout.error('address')).toHaveText("L'adresse de livraison est obligatoire.");
      await expect(checkout.confirmationHeading).toBeHidden();
    });

    for (const invalidEmail of ['camille', 'camille@', 'camille@example', 'camille @example.com']) {
      test(`refuse l'adresse e-mail « ${invalidEmail} »`, async ({ checkout }) => {
        await checkout.fill({ ...CUSTOMER, email: invalidEmail });
        await checkout.pay();
        await expect(checkout.error('email')).toBeVisible();
        await expect(checkout.error('fullName')).toBeHidden();
        await expect(checkout.error('address')).toBeHidden();
      });
    }
  });

  test('indique que le panier est vide si on accède directement au paiement', { tag: '@regression' }, async ({ page, cart }) => {
    await page.goto('/#/paiement');
    await expect(cart.emptyMessage).toBeVisible();
  });

  test('affiche une erreur et conserve le panier si le paiement échoue (API simulée en 500)',
    { tag: '@regression' }, async ({ page, catalog, cart, checkout }) => {
      await page.route('**/api/orders', (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Erreur serveur' }) }));

      await catalog.goto();
      await catalog.addToCart('Savon Lavande');
      await catalog.openCart();
      await cart.proceedToCheckout();
      await checkout.fill(CUSTOMER);
      await checkout.pay();

      await expect(checkout.paymentError).toHaveText('Le paiement a échoué. Veuillez réessayer.');
      await expect(checkout.confirmationHeading).toBeHidden();
      await expect(catalog.cartCount).toHaveText('1'); // le panier n'est pas vidé
      await expect(checkout.payButton).toBeEnabled();  // on peut réessayer
    });
});
