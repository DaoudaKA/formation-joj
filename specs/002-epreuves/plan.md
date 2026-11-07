# 002 — Épreuves : créer une épreuve et faire avancer son statut : plan

**Statut** : Validé

## 1. Résumé

On construit le module `events` de l'API. Il permet de créer une épreuve rattachée à une discipline existante, avec un nom, un site de la liste des sites des Jeux, une date et une heure comprises entre le 31 octobre et le 13 novembre 2026 ; l'épreuve naît toujours à venir. Une fois les tâches terminées, l'appelant de l'API peut créer une épreuve puis demander le statut visé, en cours puis terminée, et l'application refuse tout statut qui recule, reste sur place ou saute une étape. Le travail tient en cinq tâches, dans l'ordre des couches : la création de l'épreuve dans le domaine, le changement de statut dans le domaine, les cas d'usage, la persistance, puis les routes HTTP. La consultation, la liste, la modification et la suppression d'une épreuve, le classement et tout écran sont laissés aux tranches suivantes ; la fausse API du front n'est pas touchée.

Les mots de la spec et leur nom dans le code :

| Dans la spec         | Dans le code        | Ce que c'est                                                                       |
| -------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| épreuves (le module) | `events`            | le module de l'API qui regroupe les épreuves                                       |
| épreuve              | `Event`             | une compétition d'une discipline, à un site, une date et une heure, avec un statut |
| site                 | `site`              | le lieu de l'épreuve, une valeur de `EVENT_SITES` : `dakar`, `diamniadio`, `saly`  |
| date et heure        | `startsAt`          | le début de l'épreuve, en date et heure ISO 8601                                   |
| statut               | `status`            | l'avancement de l'épreuve, une valeur de `EVENT_STATUSES`                          |
| à venir              | `scheduled`         | le statut d'une épreuve qui n'a pas commencé ; celui de toute épreuve créée        |
| en cours             | `in-progress`       | le statut d'une épreuve qui se déroule                                             |
| terminée             | `finished`          | le statut d'une épreuve achevée                                                    |
| période des Jeux     | `GAMES_PERIOD`      | du 31 octobre 2026 à 00 h au 13 novembre 2026 à 23 h 59, heure de Dakar (UTC)      |
| créer une épreuve    | `CreateEvent`       | le cas d'usage qui enregistre une nouvelle épreuve                                 |
| changer son statut   | `ChangeEventStatus` | le cas d'usage qui fait passer une épreuve au statut demandé                       |

## 2. Fichiers par couche

On crée le module `events`, organisé comme le module Disciplines : un dossier par couche dans `apps/api/src/modules/events/`. Les chemins ci-dessous sont relatifs à ce dossier, sauf pour shared, `app.module.ts` et le test e2e.

- **shared** : `packages/shared/src/events.ts` contient les constantes et les schémas Zod ; il est exporté par `packages/shared/src/index.ts`.
  - `EVENT_SITES`, `EVENT_STATUSES`, `EVENT_NAME_MAX_LENGTH` (100) et `GAMES_PERIOD` (début et fin de la période des Jeux) sont les listes et limites partagées par le schéma et le domaine.
  - `createEventSchema` décrit le corps de la création : `disciplineId` (uuid), `name` (texte non vide une fois les espaces retirés, 100 caractères au plus), `site` (une valeur de `EVENT_SITES`) et `startsAt` (date et heure ISO 8601 avec fuseau, comprise dans `GAMES_PERIOD`). Un champ `status` envoyé à la création est retiré par le schéma, car Zod ignore les clés inconnues : l'épreuve naît toujours à venir.
  - `changeEventStatusSchema` décrit le corps du changement de statut : `status`, une valeur de `EVENT_STATUSES`.
  - `eventIdParamsSchema` valide le paramètre `:eventId`, et `eventSchema` décrit l'épreuve renvoyée par l'API.
- **domain** : deux fichiers.
  - `domain/events.errors.ts` déclare la classe `EventError`, la table des codes vers leur catégorie et les fabriques `eventNotFound(id)`, `eventDisciplineNotFound(id)` et `eventStatusTransitionInvalid(from, to)`.
  - `domain/event.ts` est l'entité `Event`. `Event.create()` retire les espaces autour du nom et revérifie le nom, le site et la date, puis fixe le statut à `scheduled`. `Event.restore()` relit la base sans rejouer les règles. `event.changeStatus(status)` revérifie que le statut est connu, puis n'accepte que le statut qui suit immédiatement le statut actuel dans `EVENT_STATUSES` ; tout autre statut, y compris le statut actuel, lève `EVENT_STATUS_TRANSITION_INVALID` sans rien modifier.
- **application** : quatre fichiers.
  - `application/event.repository.ts` est le port `EventRepository`, avec `findById`, `disciplineExists`, `insert` et `update`.
  - `application/testing/in-memory-event.repository.ts` est sa version en mémoire pour les tests.
  - `application/use-cases/create-event.ts` vérifie que la discipline existe, sinon lève `EVENT_DISCIPLINE_NOT_FOUND`, puis crée l'épreuve et l'enregistre.
  - `application/use-cases/change-event-status.ts` lit l'épreuve, sinon lève `EVENT_NOT_FOUND`, appelle `event.changeStatus()`, puis enregistre l'épreuve modifiée.
- **infra** : trois fichiers.
  - `infra/events.schema.ts` déclare la table `events`.
  - `infra/event.mapper.ts` traduit une ligne en entité et inversement.
  - `infra/drizzle-event.repository.ts` implémente le port avec Drizzle.
- **http** : `http/events.controller.ts` expose deux routes. `events.module.ts` relie `EventRepository` à `DrizzleEventRepository` ; il est ajouté aux `imports` de `apps/api/src/app.module.ts`.
  - `POST /api/events` crée une épreuve et renvoie 201 avec l'épreuve (`id`, `disciplineId`, `name`, `site`, `startsAt`, `status` à `scheduled`, `createdAt`).
  - `PATCH /api/events/:eventId/status` fait passer l'épreuve au statut demandé et renvoie 200 avec l'épreuve modifiée.
- **web** : rien. La spec ne contient pas d'écran ; la fausse API du front sera complétée avec l'écran de TR3.

## 3. Données

On stocke les épreuves dans une nouvelle table. Migration : `pnpm db:generate --name=create-events`.

- `events` : `id` (uuid, clé primaire), `discipline_id` (uuid, clé étrangère vers `disciplines.id`), `name` (varchar 100), `site` (varchar 50), `starts_at` (timestamptz, précision milliseconde), `status` (varchar 20), `created_at` (timestamptz, précision milliseconde).
  - La clé étrangère garantit qu'une épreuve appartient à une discipline existante (AS5).
  - `CHECK (site IN ('dakar', 'diamniadio', 'saly'))` garantit en base qu'un site est dans la liste des Jeux (AS3).
  - `CHECK (status IN ('scheduled', 'in-progress', 'finished'))` garantit en base qu'un statut est connu (AS9).
  - La période des Jeux et l'ordre des statuts sont des règles du domaine, vérifiées par l'entité : elles ne sont pas dupliquées en base.
  - Le nom n'est pas unique, comme le dit la spec.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`), avec un code stable et un statut HTTP. Un corps ou un paramètre mal formé est d'abord refusé par le schéma Zod, avec le code générique `VALIDATION_FAILED` (400) et le champ en cause ; le domaine revérifie ensuite avec ses propres codes.

| Code AppError                     | Catégorie     | HTTP | Quand                                                                     | Scénario |
| --------------------------------- | ------------- | ---- | ------------------------------------------------------------------------- | -------- |
| `EVENT_NAME_REQUIRED`             | VALIDATION    | 400  | le nom est vide ou fait seulement d'espaces                               | AS2      |
| `EVENT_NAME_TOO_LONG`             | VALIDATION    | 400  | le nom dépasse 100 caractères une fois les espaces retirés                | AS2      |
| `EVENT_SITE_UNKNOWN`              | VALIDATION    | 400  | le site n'est pas dans `EVENT_SITES`                                      | AS3      |
| `EVENT_DATE_OUTSIDE_GAMES`        | VALIDATION    | 400  | la date et l'heure sont invalides ou hors de la période des Jeux          | AS4      |
| `EVENT_DISCIPLINE_NOT_FOUND`      | NOT_FOUND     | 404  | la discipline de l'épreuve n'existe pas                                   | AS5      |
| `EVENT_STATUS_TRANSITION_INVALID` | BUSINESS_RULE | 422  | le statut demandé n'est pas celui qui suit immédiatement le statut actuel | AS7, AS8 |
| `EVENT_STATUS_UNKNOWN`            | VALIDATION    | 400  | le statut demandé n'est pas dans `EVENT_STATUSES`                         | AS9      |
| `EVENT_NOT_FOUND`                 | NOT_FOUND     | 404  | aucune épreuve n'a cet identifiant                                        | AS10     |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit ; chaque route a aussi son test e2e dans `apps/api/test/events.e2e.spec.ts`.

| Scénario | Fichier de test                               | Niveau        | Ce que le test vérifie                                                                                                                                                                      |
| -------- | --------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS1      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | l'épreuve a le nom sans espaces autour, sa discipline, son site, sa date et le statut `scheduled` ; la route répond 201, même si le corps contient un `status`                              |
| AS2      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_NAME_REQUIRED` pour un nom vide ou d'espaces, `EVENT_NAME_TOO_LONG` pour 101 caractères ; la route répond 400 sur `name`, y compris s'il manque, et aucune épreuve n'est enregistrée |
| AS3      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_SITE_UNKNOWN` pour « Thiès » ; la route répond 400 sur `site`, y compris s'il manque                                                                                                 |
| AS4      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_DATE_OUTSIDE_GAMES` pour le 30 octobre à 23 h 59 et le 14 novembre à 00 h, acceptation des deux bornes ; la route répond 400 sur `startsAt` s'il manque ou est mal formé             |
| AS5      | `application/events.application.spec.ts`, e2e | unitaire, e2e | `EVENT_DISCIPLINE_NOT_FOUND` et aucune épreuve enregistrée ; la route répond 404                                                                                                            |
| AS6      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | l'épreuve passe de `scheduled` à `in-progress`, puis à `finished` ; la route répond 200 à chaque fois et le statut est relu                                                                 |
| AS7      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_STATUS_TRANSITION_INVALID` de `scheduled` à `finished`, et le statut reste `scheduled` ; la route répond 422                                                                         |
| AS8      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_STATUS_TRANSITION_INVALID` pour un retour en arrière et pour le même statut, et le statut ne change pas ; 422                                                                        |
| AS9      | `domain/event.spec.ts`, e2e                   | unitaire, e2e | `EVENT_STATUS_UNKNOWN` pour « annulée » ; la route répond 400 sur `status`, y compris s'il manque, et l'épreuve reste `scheduled`                                                           |
| AS10     | `application/events.application.spec.ts`, e2e | unitaire, e2e | `EVENT_NOT_FOUND` ; la route répond 404                                                                                                                                                     |

## 6. Tâches

Six au plus, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [x] T01 [002-AS1, AS2, AS3, AS4] Écrire d'abord `domain/event.spec.ts` (« 002-AS1: creates a scheduled event with its trimmed name, discipline, site and date »), puis les constantes et schémas de `packages/shared/src/events.ts`, `domain/events.errors.ts` et `Event.create()`
- [ ] T02 [002-AS6, AS7, AS8, AS9] Écrire d'abord la suite de `domain/event.spec.ts` (« 002-AS7: refuses to skip a status and keeps the event scheduled »), puis `event.changeStatus()`
- [ ] T03 [002-AS5, AS6, AS10] Écrire d'abord `application/events.application.spec.ts` (« 002-AS5: refuses an event for an unknown discipline »), puis le port `EventRepository`, sa version en mémoire, `CreateEvent` et `ChangeEventStatus`
- [ ] T04 [002-AS1, AS6] Écrire d'abord `infra/drizzle-event.repository.int.spec.ts` (« 002-AS6: persists the status change of an event »), puis `infra/events.schema.ts`, la migration, `infra/event.mapper.ts` et `DrizzleEventRepository`
- [ ] T05 [002-AS1, AS2, AS3, AS4, AS5, AS6, AS7, AS8, AS9, AS10] Écrire d'abord `apps/api/test/events.e2e.spec.ts` (« 002-AS7: refuses to skip a status (422, EVENT_STATUS_TRANSITION_INVALID) »), puis `http/events.controller.ts`, `events.module.ts` et son ajout dans `app.module.ts`
