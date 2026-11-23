export type Currency = 'EUR' | 'USD' | 'GBP';

export interface ProductExpectation {
  name: string;
  category: 'soins' | 'maison';
  /** Prix attendus, écrits en dur : ils ne sont pas calculés avec le code de l'application. */
  prices: Record<Currency, string>;
}

export const PRODUCTS: ProductExpectation[] = [
  { name: 'Savon Lavande', category: 'soins', prices: { EUR: '8,00 €', USD: '$8.80', GBP: '£6.80' } },
  { name: 'Crème Hydratante', category: 'soins', prices: { EUR: '20,00 €', USD: '$22.00', GBP: '£17.00' } },
  { name: 'Gel Douche Agrumes', category: 'soins', prices: { EUR: '10,00 €', USD: '$11.00', GBP: '£8.50' } },
  { name: 'Bougie Cèdre', category: 'maison', prices: { EUR: '24,00 €', USD: '$26.40', GBP: '£20.40' } },
  { name: 'Diffuseur Brume', category: 'maison', prices: { EUR: '30,00 €', USD: '$33.00', GBP: '£25.50' } },
  { name: 'Plaid Lin', category: 'maison', prices: { EUR: '60,00 €', USD: '$66.00', GBP: '£51.00' } },
];

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP'];

export const CUSTOMER = {
  fullName: 'Camille Martin',
  email: 'camille.martin@example.com',
  address: '12 rue des Tests, 57100 Thionville',
};
