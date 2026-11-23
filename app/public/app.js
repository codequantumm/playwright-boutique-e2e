/* Boutique de démonstration "Maison Verte" – JavaScript natif, sans framework. */
(function () {
  const app = document.getElementById('app');
  const currencySelect = document.getElementById('currency');
  const cartCount = document.querySelector('[data-testid="cart-count"]');

  const state = {
    products: [],
    cart: load('cart', []),            // [{ id, quantity }]
    currency: load('currency', 'EUR'),
    promo: load('promo', ''),
    search: '',
    category: 'all',
  };

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.setItem('currency', JSON.stringify(state.currency));
    localStorage.setItem('promo', JSON.stringify(state.promo));
  }

  const money = (eur) => Pricing.formatPrice(Math.round((eur * Pricing.RATES[state.currency] + Number.EPSILON) * 100) / 100, state.currency);
  const fmt = (amount) => Pricing.formatPrice(amount, state.currency);
  const productById = (id) => state.products.find((p) => p.id === id);
  const cartLines = () => state.cart
    .map((item) => ({ ...item, product: productById(item.id) }))
    .filter((line) => line.product);

  function updateHeader() {
    cartCount.textContent = String(state.cart.reduce((sum, item) => sum + item.quantity, 0));
    currencySelect.value = state.currency;
  }

  /* ---------- Catalogue ---------- */
  function renderCatalog() {
    app.innerHTML = `
      <h1>Catalogue</h1>
      <div class="filters">
        <label>Rechercher <input type="search" id="search"></label>
        <label>Catégorie
          <select id="category">
            <option value="all">Toutes</option>
            <option value="soins">Soins</option>
            <option value="maison">Maison</option>
          </select>
        </label>
      </div>
      <p data-testid="no-result" hidden>Aucun produit ne correspond à votre recherche.</p>
      <div class="grid" id="grid"></div>`;
    document.getElementById('category').value = state.category;
    document.getElementById('search').value = state.search;
    document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; renderGrid(); });
    document.getElementById('category').addEventListener('change', (e) => { state.category = e.target.value; renderGrid(); });
    renderGrid();
  }

  function renderGrid() {
    const term = state.search.trim().toLowerCase();
    const visible = state.products.filter((p) =>
      (state.category === 'all' || p.category === state.category) && p.name.toLowerCase().includes(term));
    document.getElementById('grid').innerHTML = visible.map((p) => `
      <article class="card" data-testid="product-card" data-product-id="${p.id}">
        <h2>${p.name}</h2>
        <p class="cat">${p.category}</p>
        <p class="price" data-testid="product-price">${money(p.price)}</p>
        <button type="button" data-add="${p.id}" aria-label="Ajouter ${p.name} au panier">Ajouter au panier</button>
      </article>`).join('');
    document.querySelector('[data-testid="no-result"]').hidden = visible.length > 0;
    document.querySelectorAll('[data-add]').forEach((button) =>
      button.addEventListener('click', () => addToCart(button.dataset.add)));
  }

  function addToCart(id) {
    const existing = state.cart.find((item) => item.id === id);
    if (existing) existing.quantity = Math.min(99, existing.quantity + 1);
    else state.cart.push({ id, quantity: 1 });
    save();
    updateHeader();
  }

  /* ---------- Panier ---------- */
  function totals() {
    return Pricing.computeTotals(
      cartLines().map((l) => ({ priceEur: l.product.price, quantity: l.quantity })),
      state.promo,
      state.currency);
  }

  function renderCart() {
    const lines = cartLines();
    if (lines.length === 0) {
      app.innerHTML = `<h1>Panier</h1>
        <p data-testid="cart-empty">Votre panier est vide.</p>
        <a href="#/">Retour au catalogue</a>`;
      return;
    }
    const t = totals();
    const promoApplied = Pricing.findPromo(state.promo) !== null;
    app.innerHTML = `<h1>Panier</h1>
      <table>
        <thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th><th></th></tr></thead>
        <tbody>${lines.map((l) => `
          <tr data-testid="cart-row" data-product-id="${l.id}">
            <td>${l.product.name}</td>
            <td>${money(l.product.price)}</td>
            <td><input type="number" min="1" max="99" value="${l.quantity}" aria-label="Quantité ${l.product.name}" data-qty="${l.id}"></td>
            <td>${money(l.product.price * l.quantity)}</td>
            <td><button type="button" class="link" data-remove="${l.id}" aria-label="Supprimer ${l.product.name}">Supprimer</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="promo">
        <label>Code promo <input id="promo"></label>
        <button type="button" id="apply-promo">Appliquer</button>
        <p role="status" data-testid="promo-message"></p>
      </div>
      <div class="totals">
        <div>Sous-total <span data-testid="subtotal">${fmt(t.subtotal)}</span></div>
        ${promoApplied ? `<div>Remise <span data-testid="discount">-${fmt(t.discount)}</span></div>` : ''}
        <div>Livraison <span data-testid="shipping">${t.shipping === 0 ? 'Offerte' : fmt(t.shipping)}</span></div>
        <div class="grand">Total <span data-testid="total">${fmt(t.total)}</span></div>
      </div>
      <p><a class="button" href="#/paiement">Passer au paiement</a></p>`;

    document.querySelectorAll('[data-qty]').forEach((input) =>
      input.addEventListener('change', () => {
        const value = Math.min(99, Math.max(1, parseInt(input.value, 10) || 1));
        state.cart.find((item) => item.id === input.dataset.qty).quantity = value;
        save(); updateHeader(); renderCart();
      }));
    document.querySelectorAll('[data-remove]').forEach((button) =>
      button.addEventListener('click', () => {
        state.cart = state.cart.filter((item) => item.id !== button.dataset.remove);
        save(); updateHeader(); renderCart();
      }));
    document.getElementById('promo').value = state.promo;
    document.getElementById('apply-promo').addEventListener('click', () => {
      const code = document.getElementById('promo').value.trim();
      if (Pricing.findPromo(code) === null) {
        state.promo = '';
        save(); renderCart();
        document.querySelector('[data-testid="promo-message"]').textContent = 'Code promo invalide.';
        return;
      }
      state.promo = code.toUpperCase();
      save(); renderCart();
      document.querySelector('[data-testid="promo-message"]').textContent = `Code ${state.promo} appliqué : -10 %`;
    });
  }

  /* ---------- Paiement ---------- */
  const MESSAGES = {
    fullName: 'Le nom est obligatoire.',
    email: 'Veuillez saisir une adresse e-mail valide.',
    address: "L'adresse de livraison est obligatoire.",
  };

  function renderCheckout() {
    if (cartLines().length === 0) {
      app.innerHTML = `<h1>Paiement</h1>
        <p data-testid="cart-empty">Votre panier est vide.</p>
        <a href="#/">Retour au catalogue</a>`;
      return;
    }
    const t = totals();
    app.innerHTML = `<h1>Paiement</h1>
      <p>Total à régler : <strong data-testid="checkout-total">${fmt(t.total)}</strong></p>
      <div class="banner" role="alert" data-testid="payment-error" hidden>Le paiement a échoué. Veuillez réessayer.</div>
      <form class="form" id="checkout-form" novalidate>
        <label>Nom complet <input id="fullName" autocomplete="name"></label>
        <p class="error" role="alert" data-testid="error-fullName" hidden></p>
        <label>Adresse e-mail <input id="email" type="email" autocomplete="email"></label>
        <p class="error" role="alert" data-testid="error-email" hidden></p>
        <label>Adresse de livraison <textarea id="address" rows="3"></textarea></label>
        <p class="error" role="alert" data-testid="error-address" hidden></p>
        <button type="submit">Payer ${fmt(t.total)}</button>
      </form>`;
    document.getElementById('checkout-form').addEventListener('submit', submitOrder);
  }

  function showError(field, message) {
    const el = document.querySelector(`[data-testid="error-${field}"]`);
    el.hidden = !message;
    el.textContent = message || '';
    document.getElementById(field).setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  async function submitOrder(event) {
    event.preventDefault();
    const values = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      address: document.getElementById('address').value.trim(),
    };
    const invalid = {
      fullName: values.fullName.length < 2,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email),
      address: values.address.length < 5,
    };
    Object.keys(invalid).forEach((field) => showError(field, invalid[field] ? MESSAGES[field] : ''));
    if (Object.values(invalid).some(Boolean)) return;

    const banner = document.querySelector('[data-testid="payment-error"]');
    banner.hidden = true;
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          items: state.cart,
          promoCode: state.promo,
          currency: state.currency,
        }),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const order = await response.json();
      sessionStorage.setItem('lastOrder', JSON.stringify(order));
      state.cart = [];
      state.promo = '';
      save(); updateHeader();
      location.hash = '#/confirmation';
    } catch {
      banner.hidden = false;
      button.disabled = false;
    }
  }

  function renderConfirmation() {
    let order = null;
    try { order = JSON.parse(sessionStorage.getItem('lastOrder')); } catch { /* ignore */ }
    if (!order) {
      app.innerHTML = `<h1>Confirmation</h1><p>Aucune commande récente.</p><a href="#/">Retour au catalogue</a>`;
      return;
    }
    app.innerHTML = `<div class="ok">
      <h1>Merci pour votre commande</h1>
      <p>Numéro de commande : <strong data-testid="order-id">${order.orderId}</strong></p>
      <p>Montant réglé : <strong data-testid="order-total">${Pricing.formatPrice(order.total, order.currency)}</strong></p>
      </div>
      <p><a href="#/">Continuer mes achats</a></p>`;
  }

  /* ---------- Routage ---------- */
  function route() {
    updateHeader();
    const hash = location.hash || '#/';
    if (hash === '#/panier') return renderCart();
    if (hash === '#/paiement') return renderCheckout();
    if (hash === '#/confirmation') return renderConfirmation();
    return renderCatalog();
  }

  currencySelect.addEventListener('change', () => {
    state.currency = currencySelect.value;
    save();
    route();
  });
  window.addEventListener('hashchange', route);

  fetch('/api/products')
    .then((response) => response.json())
    .then((products) => { state.products = products; route(); })
    .catch(() => { app.innerHTML = '<p class="banner" role="alert">Le catalogue est indisponible.</p>'; });
})();
