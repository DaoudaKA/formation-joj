# PRD — Résultats des épreuves

**Statut** : Validé

## Problème

Les JOJ Dakar 2026 (31 octobre – 13 novembre) se jouent sur plusieurs sites à Dakar, Diamniadio et Saly. Le public ne sait pas quelles épreuves sont à venir, en cours ou terminées, ni qui a gagné ; les journalistes recoupent les classements à la main d'une source à l'autre ; une erreur de résultat publiée se corrige mal, car l'ancienne valeur est écrasée sans trace.

## Utilisateurs

- Responsable résultats d'un site : crée les épreuves de son site, fait avancer leur statut et publie leur classement.
- Public et journaliste : consultent les épreuves, leur statut et leurs résultats, sans recouper plusieurs sources.

## Proposition

Une source unique des résultats. Une épreuve appartient à une discipline existante, a un nom, un site, une date et une heure, et un statut à venir, en cours ou terminée, qui n'avance que dans cet ordre. Son classement complet ne se publie qu'une fois terminée, et l'application refuse tout classement incohérent ; les médailles en sont déduites, jamais saisies. Un tableur partagé centraliserait aussi, mais il ne tiendrait ni l'ordre des statuts, ni la cohérence des rangs, ni l'historique des corrections.

## Mesure du succès

Pendant la démo : je crée une épreuve à venir, je la passe en cours ; la publication de son classement est refusée tant qu'elle n'est pas terminée ; je la termine, je publie un classement de cinq athlètes, et sa fiche affiche le podium avec l'or, l'argent et le bronze, puis le classement complet avec les pays.

## Tranches

### TR1 — Créer une épreuve et faire avancer son statut

Le responsable crée une épreuve, toujours à venir, rattachée à une discipline existante, puis la passe en cours, puis terminée. Règle : le statut n'avance que dans l'ordre à venir → en cours → terminée, jamais en arrière ni en sautant une étape.

### TR2 — Publier le classement d'une épreuve terminée

Le responsable publie le classement complet : rang, athlète, pays, performance. Règles : seulement si l'épreuve est terminée ; rangs à partir de 1, sans trou ni doublon ; un athlète n'apparaît qu'une fois. Les rangs 1, 2 et 3 reçoivent l'or, l'argent et le bronze.

### TR3 — Consulter les épreuves et leur fiche

Écran public : la liste des épreuves, filtrable par jour, site et statut ; la fiche d'une épreuve avec son statut, son site, son horaire et, si elle est terminée, son podium et son classement complet.

### TR4 — Tableau des médailles par pays

Le public voit le nombre d'or, d'argent et de bronze par pays, calculé à partir des classements publiés.

### TR5 — Rectifier un classement publié

Le responsable rectifie un classement publié avec un motif obligatoire ; chaque version reste consultable, avec son motif.

## Hors périmètre

- Les ex æquo, le direct point par point, les qualifications et tableaux à élimination, les épreuves par équipes, la suppression d'une épreuve, les notifications, et les comptes des responsables : sans authentification, n'importe qui peut modifier un résultat, ce qui suffit pour la démo mais pas pour les Jeux.

## Hypothèses et risques

- Hypothèse : la liste des sites est fixe et connue d'avance, et la date d'une épreuve tombe entre le 31 octobre et le 13 novembre 2026 ; sinon, il faudra enrichir les sites, et une date erronée passerait inaperçue. Hypothèse : l'athlète est désigné par son nom et son pays, sans fichier d'athlètes, et la performance est un texte libre (temps, distance, points) ; deux homonymes d'un même pays seraient confondus, et un rang contredit par la performance ne serait pas détecté.
