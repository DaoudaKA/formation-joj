# 002 — Épreuves : créer une épreuve et faire avancer son statut

**Statut** : Validée
**PRD** : specs/prd-resultats.md, TR1

## Contexte

Le public ne sait pas quelles épreuves sont à venir, en cours ou terminées. Cette tranche pose la base de la source unique des résultats : le responsable résultats d'un site crée ses épreuves, puis fait avancer leur statut, et l'application refuse tout statut qui recule ou saute une étape.

## User stories

- En tant que responsable résultats d'un site, je veux créer une épreuve d'une discipline existante, avec son nom, son site, sa date et son heure, afin qu'elle figure au programme comme à venir.
- En tant que responsable, je veux passer une épreuve en cours puis terminée, afin que son statut reflète ce qui se passe sur le terrain.
- En tant que responsable, je veux qu'un statut qui recule ou saute une étape soit refusé, afin qu'une erreur de manipulation ne fausse pas le programme.

## Scénarios d'acceptation

### AS1 — Créer une épreuve

- **Étant donné** la discipline « Lutte » · **Quand** le responsable crée l'épreuve « Lutte -60 kg garçons » (espaces autour compris) pour « Lutte », au site de Diamniadio, le 3 novembre 2026 à 10 h · **Alors** elle est enregistrée sous le nom « Lutte -60 kg garçons », avec sa discipline, son site, sa date et son heure, et le statut à venir.

### AS2 — Nom vide ou trop long

- **Étant donné** un nom absent, vide, fait d'espaces ou de plus de 100 caractères · **Quand** le responsable crée l'épreuve · **Alors** c'est refusé, la réponse dit pourquoi, et aucune épreuve n'est enregistrée.

### AS3 — Site hors de la liste

- **Étant donné** un site absent ou autre que ceux de la liste des sites des Jeux · **Quand** le responsable crée l'épreuve · **Alors** c'est refusé, la réponse dit pourquoi, et aucune épreuve n'est enregistrée.

### AS4 — Date hors des Jeux

- **Étant donné** une date et une heure absentes, mal formées, ou en dehors du 31 octobre au 13 novembre 2026 · **Quand** le responsable crée l'épreuve · **Alors** c'est refusé, la réponse dit pourquoi, et aucune épreuve n'est enregistrée.

### AS5 — Discipline inexistante

- **Étant donné** une discipline qui n'existe pas · **Quand** le responsable crée une épreuve pour elle · **Alors** c'est refusé, l'application dit que la discipline est introuvable, et aucune épreuve n'est enregistrée.

### AS6 — Passer une épreuve en cours, puis terminée

- **Étant donné** une épreuve à venir · **Quand** le responsable la passe en cours, puis terminée · **Alors** chaque changement est accepté, et l'épreuve est d'abord en cours, puis terminée.

### AS7 — Sauter une étape

- **Étant donné** une épreuve à venir · **Quand** le responsable la passe directement à terminée · **Alors** c'est refusé avec un message qui dit que le statut doit avancer dans l'ordre, et l'épreuve reste à venir.

### AS8 — Revenir en arrière ou rester sur place

- **Étant donné** une épreuve terminée, ou en cours · **Quand** le responsable la repasse à un statut antérieur ou au même statut · **Alors** c'est refusé comme en AS7, et le statut ne change pas.

### AS9 — Statut inconnu

- **Étant donné** une épreuve à venir · **Quand** le responsable demande un statut absent ou autre que à venir, en cours ou terminée · **Alors** c'est refusé, la réponse dit pourquoi, et l'épreuve reste à venir.

### AS10 — Épreuve inexistante

- **Étant donné** une épreuve qui n'existe pas · **Quand** le responsable change son statut · **Alors** c'est refusé, et l'application dit que l'épreuve est introuvable.

## Hors périmètre

- Le classement et les médailles (TR2), la liste, les filtres et la fiche publique (TR3) ; cette tranche n'a pas d'écran.
- La modification et la suppression d'une épreuve, et la gestion de la liste des sites.

## Questions ouvertes

- Liste des sites : le PRD la dit fixe sans la donner. Hypothèse : trois sites, Dakar, Diamniadio et Saly ; le plan pourra l'affiner.
- Le responsable demande le statut visé (et non « l'étape suivante »), sinon la règle de l'étape sautée n'aurait pas d'objet. Un statut fourni à la création est ignoré : l'épreuve naît toujours à venir.
- Pas d'unicité du nom d'une épreuve, et pas de contrôle que le responsable appartient au site (comme le PRD, pas de comptes).
- Statuts et codes d'erreur non donnés par la demande : le plan les choisira (transition interdite en conflit ou règle métier).
