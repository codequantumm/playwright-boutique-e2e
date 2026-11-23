# Boutique en ligne : tests E2E et API avec Playwright

Projet de démonstration de tests automatisés avec **Playwright** et **TypeScript**, sur une boutique en ligne fictive (« Maison Verte »). Il reprend les situations que l'on rencontre sur un e-commerce : parcours d'achat, panier, code promo, règles de livraison, multi-devises et validation de formulaire.

> La boutique est fictive et sert uniquement de cible de test. Elle est fournie dans le dépôt (`app/`) : le projet se lance donc en deux commandes, sans dépendre d'un site externe.

## Ce qui est testé

| Domaine | Exemples de scénarios |
| --- | --- |
| Catalogue | Affichage des produits, filtre par catégorie, recherche, message « aucun résultat » |
| Multi-devises | Prix attendus en EUR, USD et GBP, devise conservée après rechargement |
| Panier | Ajout et regroupement, quantité, suppression, persistance, quantité minimale |
| Code promo | Code valide, insensible à la casse, code invalide |
| Règle métier | Livraison offerte à partir de 50 € **après remise** (tests aux limites : 48 €, 50 € pile, 60 €, 50 € remisé) |
| Paiement | Parcours complet jusqu'à la confirmation, validation du formulaire, panier vide |
| Résilience | Erreur serveur simulée (500) : message d'erreur, panier conservé, nouvel essai possible |
| API | Codes de statut (201, 400, 404), format des réponses, total recalculé côté serveur, prix client ignoré |

**71 exécutions** : 40 sur ordinateur (Chromium) et 31 sur mobile (Pixel 5). Les 9 tests d'API ne tournent que sur ordinateur.

## Installation et lancement

Prérequis : Node.js 20 ou plus.

```bash
npm install
npx playwright install chromium
npm test
```

La boutique de démonstration est lancée automatiquement avant les tests. Pour la consulter à la main : `npm start`, puis http://localhost:4173.

| Commande | Rôle |
| --- | --- |
| `npm test` | Lance tous les tests |
| `npm run test:smoke` | Lance uniquement les tests de fumée (`@smoke`), les plus rapides |
| `npm run test:regression` | Lance les tests de non-régression (`@regression`) |
| `npm run test:ui` | Ouvre le mode interactif de Playwright |
| `npm run report` | Ouvre le rapport HTML du dernier lancement |
| `npm run typecheck` | Vérifie le code TypeScript |

## Choix techniques

- **Page Object Model** (`tests/pages/`) : chaque page a sa classe. Si l'interface change, on corrige à un seul endroit.
- **Sélecteurs orientés utilisateur** : `getByRole`, `getByLabel`, puis `data-testid` seulement quand il n'existe pas de meilleur repère. Cela rend les tests plus lisibles et plus stables.
- **Valeurs attendues écrites en dur** (`tests/data/catalog.ts`) : elles ne sont pas calculées avec le code de l'application. Sinon, un bug de calcul serait reproduit dans le test et passerait inaperçu.
- **Tests indépendants** : chaque test démarre avec un navigateur neuf. Ils peuvent donc s'exécuter en parallèle, dans n'importe quel ordre.
- **Tests pilotés par les données** : un scénario par devise, un par cas limite de livraison, un par e-mail invalide.
- **Tags** `@smoke` et `@regression` pour choisir quoi lancer selon le contexte (vérification rapide ou campagne complète).
- **Simulation réseau** (`page.route`) pour tester un échec de paiement sans casser le serveur.
- **Traces et captures d'écran** conservées uniquement en cas d'échec, pour faciliter le diagnostic.
- **Intégration continue** : `.github/workflows/playwright.yml` lance les tests à chaque push et publie le rapport HTML.

## Vérifier que les tests détectent vraiment les anomalies

Des tests qui passent ne prouvent rien tant qu'on ne sait pas s'ils échouent quand il le faut. Deux bugs ont été introduits volontairement dans `app/public/pricing.js` :

1. `netEur >= FREE_SHIPPING_THRESHOLD_EUR` remplacé par `>` : le test « 50 € pile : livraison offerte » échoue.
2. Taux USD `1.1` remplacé par `1.2` : les tests de prix en USD, du panier en USD et de persistance de la devise échouent.

Vous pouvez reproduire l'expérience en modifiant ces lignes puis en lançant `npm test`.

## Structure

```
app/                 Boutique de démonstration (serveur Node.js sans dépendance)
  public/              Pages, scripts et règles de prix
  server.js            Sert la boutique et l'API (/api/products, /api/orders)
tests/
  pages/               Page Objects (catalogue, panier, paiement)
  data/                Données de test et valeurs attendues
  ui/                  Scénarios de bout en bout
  api/                 Tests d'API
  fixtures.ts          Fixtures Playwright partagées
playwright.config.ts   Configuration (navigateurs, rapports, serveur)
.github/workflows/     Intégration continue
```

## Limites

Projet pédagogique : pas de vraie base de données, pas de vrai paiement, pas de tests de charge ni d'accessibilité automatisés. Les prochaines étapes naturelles seraient d'ajouter des vérifications d'accessibilité (axe) et des tests visuels.

*Auteure : Nora Hamida*
