# MYC — trois fichiers, trois espaces

Application React + Vite + TypeScript. La navigation métier comprend exactement trois interfaces ; les paramètres sont ouverts dans un panneau latéral, sans multiplier les pages.

## 1. Chiffrage

Source : `YZA089A Product Costing Analysis Sheet v1.xlsx`, feuilles CAP 1, Data et Data 2.

Objectif : construire un coût unitaire. Les 18 lignes du fichier YZA089A rapprochent le total historique de 0,22599846666666668 USD par produit. Chaque coût peut être modifié et de nouvelles lignes ajoutées. La quantité à chiffrer est distincte d’une commande : le fichier ne donne aucune quantité commandée ou date de livraison. Les catalogues de Data et les hypothèses sont consultables dans la provenance. Les tarifs horaires ne sont pas automatiquement remplacés par les calculs d’amortissement de Data 2.

## 2. Calcul des besoins nets

Source : `YZA067A- Injection molding material requirements worksheet.xlsx`, feuille CBN.

Objectif : calculer les cycles et les masses à prévoir pour chaque composant. Le tableau présente les quantités et la consommation de matière principale/masterbatch. Le panneau d’un composant contient sa recette, ses poids, empreintes, cycles de démarrage et taux de rebut. Le stock affecté au dossier peut être saisi pour calculer un complément simple, hors stock de sécurité et réceptions datées.

Les méthodes historique Excel et rendement restent explicites. Aucun recyclage n’est déduit automatiquement. La référence du masterbatch du fichier d’origine reste à confirmer.

## 3. Project Management

La liste déroulante **Feuille** ouvre une page distincte pour chacune des six feuilles : Nomenclature et phases, Production Capacity, Capacity Planning Summary, Gantt Chart, MOD&MOI et JF. Les pages partagent les mêmes données ; la synthèse lit les calculs du programme au lieu de dupliquer les saisies. Le Gantt déplace ses barres avec les dates modifiées. Les jours fériés et les phases peuvent être ajoutés ou supprimés.

Source : `Project management MAJ KIKO 28-04-2026_650K Pieces.xlsx`.

Objectif : organiser les quantités dans le temps et vérifier les ressources. L’interface réunit les neuf opérations, quinze semaines, capacités, stocks prévisionnels par opération, besoins de personnel et dates du Gantt. Les quantités, réalisations, besoins clients, paramètres de capacité, heures indisponibles et informations historiques sont modifiables.

La capacité applique le rendement une seule fois. Le fichier historique l’applique deux fois à la métallisation ; son résultat d’origine reste visible pour comparaison. Les stocks sont calculés par opération face à la demande, sans simulation des consommations entre opérations. Effectifs et dates du Gantt restent des données indépendantes de la charge modifiée. Les jours fériés de référence sont consultables ; leur application nécessite un calendrier d’équipes qui n’est pas défini dans ces sources. La capacité reste donc indicative.

## Import, sauvegarde et nouveaux dossiers

Le bouton **Importer Excel** est commun aux trois interfaces. Le format est analysé puis une confirmation indique l’espace destinataire et les données reconnues avant intégration. Les erreurs numériques des cellules mappées bloquent l’import. L’import de chiffrage doit aussi rapprocher le total enregistré.

Chaque espace permet de créer un dossier puis d’ajouter ses éléments. Les exports CSV concernent le tableau affiché. Le menu **Données**, dans l’en-tête, permet la sauvegarde et la restauration JSON complètes.

## Supabase

L’espace partagé sans connexion utilise `public.myc_workspace` et les politiques de `supabase/setup.sql`. Les paramètres sont dans `.env.local`, exclu de Git. La révision du document protège contre l’écrasement d’une modification concurrente. En cas de conflit, exporter le JSON avant de recharger. Le mode aperçu disponible après une erreur réseau conserve les modifications en mémoire seulement.

Les anciennes collections sont conservées lors de la migration. Le planning détaillé n’est ajouté que s’il manque ; les modifications précédentes de la presse Cover sont conservées. Aucune donnée métier n’est publiée sur un hébergement OpenAI.

## Lancer et vérifier

```sh
npm install
npm run typecheck
npm test
npm run build
npm run preview
```

L’aperçu est disponible sur `http://127.0.0.1:5173/`. En mode preview, reconstruire après modification du code. Pour le développement : `npm run dev`. Le chargeur de configuration natif est utilisé pour éviter les problèmes de chemins Windows du chargeur esbuild.

## Organisation du code

- `src/App.tsx` : connexion, sauvegarde et navigation des trois espaces.
- `src/ProjectManagementView.tsx`, `MaterialsView.tsx`, `CostingView.tsx` : les trois interfaces métier ; `ProductionView.tsx` contient la feuille de programme hebdomadaire.
- `src/WorkspaceUI.tsx`, `workspace.css` : composants partagés et présentation.
- `src/workspace-model.ts`, `costing-engine.ts` : modèles et calculs.
- `src/workspace-import.ts`, `import-costing.ts` : reconnaissance et contrôle Excel.
- `src/data/` : références extraites des classeurs.

Le guide de styles React demandé précédemment est conservé dans `src/StyleGuide.tsx` comme documentation de développement. Il ne figure plus dans la navigation métier.

Les tests couvrent le rapprochement des coûts, les unités, le routage des trois classeurs, le stock hebdomadaire, la capacité, les paramètres invalides et le rendu statique des interfaces. Ils ne remplacent pas une vérification visuelle et clavier sur les navigateurs cibles.
