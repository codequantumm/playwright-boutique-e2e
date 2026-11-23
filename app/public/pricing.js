// Règles de prix partagées entre le navigateur et le serveur de démonstration.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const RATES = { EUR: 1, USD: 1.1, GBP: 0.85 };
  const FREE_SHIPPING_THRESHOLD_EUR = 50; // appliqué après remise
  const SHIPPING_EUR = 5;
  const PROMOS = { BIENVENUE10: 0.1 };

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  function formatPrice(amount, currency) {
    const fixed = amount.toFixed(2);
    if (currency === 'USD') return '$' + fixed;
    if (currency === 'GBP') return '£' + fixed;
    return fixed.replace('.', ',') + ' €';
  }

  function findPromo(code) {
    const rate = PROMOS[String(code || '').trim().toUpperCase()];
    return rate === undefined ? null : rate;
  }

  // lines : [{ priceEur, quantity }]
  function computeTotals(lines, promoCode, currency) {
    const rate = RATES[currency] || 1;
    const subtotalEur = lines.reduce((sum, l) => sum + l.priceEur * l.quantity, 0);
    const promo = findPromo(promoCode);
    const discountEur = promo ? subtotalEur * promo : 0;
    const netEur = subtotalEur - discountEur;
    const shippingEur = lines.length === 0 || netEur >= FREE_SHIPPING_THRESHOLD_EUR ? 0 : SHIPPING_EUR;
    const subtotal = round2(subtotalEur * rate);
    const discount = round2(discountEur * rate);
    const shipping = round2(shippingEur * rate);
    const total = round2(subtotal - discount + shipping);
    return { subtotal, discount, shipping, total, currency: RATES[currency] ? currency : 'EUR' };
  }

  return { RATES, formatPrice, findPromo, computeTotals };
});
