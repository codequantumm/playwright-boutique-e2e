import { test, expect } from '@playwright/test';

const validCustomer = {
  fullName: 'Camille Martin',
  email: 'camille.martin@example.com',
  address: '12 rue des Tests, 57100 Thionville',
};

test.describe('API', { tag: '@regression' }, () => {
  test('GET /api/products renvoie le catalogue complet et bien formé', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const products = await response.json();
    expect(products).toHaveLength(6);
    for (const product of products) {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.stringMatching(/^(soins|maison)$/),
        price: expect.any(Number),
      });
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('POST /api/orders crée une commande valide (201)', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { ...validCustomer, items: [{ id: 'savon-lavande', quantity: 1 }], currency: 'EUR' },
    });
    expect(response.status()).toBe(201);
    const order = await response.json();
    expect(order.orderId).toMatch(/^CMD-\d{6}$/);
    expect(order).toMatchObject({ total: 13, currency: 'EUR' });
  });

  test('applique le code promo et la livraison offerte côté serveur', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { ...validCustomer, items: [{ id: 'plaid-lin', quantity: 1 }], promoCode: 'BIENVENUE10', currency: 'EUR' },
    });
    expect(response.status()).toBe(201);
    expect((await response.json()).total).toBe(54);
  });

  test('convertit le total dans la devise demandée', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { ...validCustomer, items: [{ id: 'savon-lavande', quantity: 1 }], currency: 'GBP' },
    });
    expect(await response.json()).toMatchObject({ total: 11.05, currency: 'GBP' });
  });

  test('rejette une commande sans article (400)', async ({ request }) => {
    const response = await request.post('/api/orders', { data: { ...validCustomer, items: [] } });
    expect(response.status()).toBe(400);
    expect((await response.json()).errors).toHaveProperty('items');
  });

  test('rejette une adresse e-mail invalide (400)', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { ...validCustomer, email: 'pas-un-email', items: [{ id: 'plaid-lin', quantity: 1 }] },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).errors).toHaveProperty('email');
  });

  test('rejette un produit inconnu ou une quantité invalide (400)', async ({ request }) => {
    for (const items of [[{ id: 'inconnu', quantity: 1 }], [{ id: 'plaid-lin', quantity: 0 }], [{ id: 'plaid-lin', quantity: 100 }]]) {
      const response = await request.post('/api/orders', { data: { ...validCustomer, items } });
      expect(response.status(), JSON.stringify(items)).toBe(400);
    }
  });

  test('ignore un prix envoyé par le client : le total est recalculé côté serveur', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { ...validCustomer, items: [{ id: 'plaid-lin', quantity: 1, price: 1 }], currency: 'EUR' },
    });
    expect((await response.json()).total).toBe(60);
  });

  test('renvoie 404 sur une route inconnue', async ({ request }) => {
    const response = await request.get('/api/inconnue');
    expect(response.status()).toBe(404);
  });
});
