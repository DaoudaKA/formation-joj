# 001 — Bénévoles : ouvrir un créneau et s'y inscrire : plan

**Statut** : Validé

## 1. Résumé

On construit le module `volunteers` de l'API. Il permet d'ouvrir un créneau d'accueil rattaché à une discipline existante, avec des horaires et une capacité, puis d'inscrire un bénévole à ce créneau avec son nom et son email. Une fois les tâches terminées, l'appelant de l'API peut ouvrir un créneau et y inscrire des bénévoles, et l'application refuse toute inscription au-delà de la capacité, y compris quand deux bénévoles prennent la dernière place au même instant. Le travail tient en cinq tâches, dans l'ordre des couches : le créneau dans le domaine, l'inscription dans le domaine, les cas d'usage, la persistance, puis les routes HTTP. La consultation d'un créneau, le refus des doublons, la désinscription et tout écran sont laissés aux tranches suivantes ; la fausse API du front n'est pas touchée.

Les mots de la spec et leur nom dans le code :

| Dans la spec          | Dans le code         | Ce que c'est                                                                  |
| --------------------- | -------------------- | ----------------------------------------------------------------------------- |
| bénévoles (le module) | `volunteers`         | le module de l'API qui regroupe créneaux et inscriptions                      |
| créneau               | `Slot`               | une plage horaire d'accueil d'une discipline, avec un nombre de places        |
| capacité              | `capacity`           | le nombre de places du créneau, un entier supérieur ou égal à 1               |
| nombre d'inscrits     | `registeredCount`    | le nombre d'inscriptions déjà acceptées sur le créneau                        |
| début, fin            | `startsAt`, `endsAt` | les horaires du créneau, en date et heure ISO 8601                            |
| inscription           | `Registration`       | l'inscription d'un bénévole, identifié par son nom et son email, à un créneau |
| ouvrir un créneau     | `OpenSlot`           | le cas d'usage qui crée un créneau                                            |
| s'inscrire            | `RegisterVolunteer`  | le cas d'usage qui inscrit un bénévole à un créneau                           |

## 2. Fichiers par couche

On crée le module `volunteers`, organisé comme le module Disciplines : un dossier par couche dans `apps/api/src/modules/volunteers/`. Les chemins ci-dessous sont relatifs à ce dossier, sauf pour shared, `app.module.ts` et le test e2e.

- **shared** : `packages/shared/src/volunteers.ts` contient les schémas Zod. `openSlotSchema` décrit le corps de l'ouverture d'un créneau (`disciplineId`, `startsAt`, `endsAt`, `capacity`, avec une fin postérieure au début). `registerVolunteerSchema` décrit le corps de l'inscription (`name` non vide une fois les espaces retirés, `email` valide). `slotIdParamsSchema` valide le paramètre `:slotId`. `slotSchema` et `registrationSchema` décrivent les réponses. Le fichier est exporté par `packages/shared/src/index.ts`.
- **domain** : `domain/volunteers.errors.ts` déclare la classe `VolunteerError`, la table des codes vers leur catégorie et les fabriques (`slotNotFound(id)`, `slotFull(id)`, `slotDisciplineNotFound(id)`). `domain/slot.ts` est l'entité `Slot` : `Slot.create()` revérifie la capacité et les horaires, `Slot.restore()` relit la base sans rejouer les règles, et `slot.register()` crée une `Registration` ou lève `SLOT_FULL` si le créneau est complet. `domain/registration.ts` est l'entité `Registration` : elle retire les espaces autour du nom et de l'email, et revérifie que le nom n'est pas vide et que l'email est bien formé.
- **application** : `application/slot.repository.ts` est le port `SlotRepository`, avec `findById`, `disciplineExists`, `insert` et `addRegistration`. Cette dernière enregistre une inscription seulement s'il reste une place, de façon atomique, et lève `SLOT_FULL` sinon. `application/testing/in-memory-slot.repository.ts` est sa version en mémoire pour les tests. `application/use-cases/open-slot.ts` vérifie que la discipline existe, puis enregistre le créneau. `application/use-cases/register-volunteer.ts` lit le créneau, appelle `slot.register()`, puis `addRegistration`.
- **infra** : `infra/volunteers.schema.ts` déclare les tables `slots` et `registrations`. `infra/slot.mapper.ts` traduit une ligne en entité et inversement. `infra/drizzle-slot.repository.ts` implémente le port ; dans une transaction, `addRegistration` incrémente le nombre d'inscrits par une seule mise à jour conditionnelle (seulement s'il reste une place), puis insère l'inscription.
- **http** : `http/slots.controller.ts` expose deux routes. `volunteers.module.ts` relie `SlotRepository` à `DrizzleSlotRepository` ; il est ajouté aux `imports` de `apps/api/src/app.module.ts`.
  - `POST /api/slots` ouvre un créneau et renvoie 201 avec le créneau (`id`, `disciplineId`, `startsAt`, `endsAt`, `capacity`, `registeredCount` à 0, `createdAt`).
  - `POST /api/slots/:slotId/registrations` inscrit un bénévole et renvoie 201 avec l'inscription (`id`, `slotId`, `name`, `email`, `createdAt`).
- **web** : rien. La spec ne contient pas d'écran ; la fausse API du front sera complétée avec l'écran de TR3.

## 3. Données

On stocke les créneaux et les inscriptions dans deux nouvelles tables. Migration : `pnpm db:generate --name=create-slots-and-registrations`.

- `slots` : `id` (uuid, clé primaire), `discipline_id` (uuid, clé étrangère vers `disciplines.id`), `starts_at` et `ends_at` (timestamptz, précision milliseconde), `capacity` (entier), `registered_count` (entier, 0 par défaut), `created_at`.
  - La clé étrangère garantit qu'un créneau appartient à une discipline existante (AS4).
  - `CHECK (capacity >= 1)` protège la capacité (AS2) ; `CHECK (ends_at > starts_at)` protège les horaires (AS3).
  - `CHECK (registered_count BETWEEN 0 AND capacity)` garantit en base qu'un créneau ne dépasse jamais sa capacité, même quand deux inscriptions arrivent au même instant (AS7, AS8).
- `registrations` : `id` (uuid, clé primaire), `slot_id` (uuid, clé étrangère vers `slots.id`), `name` (texte), `email` (texte), `created_at`. La clé étrangère garantit qu'une inscription vise un créneau existant (AS9).

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`), avec un code stable et un statut HTTP. Un corps mal formé est d'abord refusé par le schéma Zod, avec le code générique `VALIDATION_FAILED` (400) ; le domaine revérifie ensuite avec ses propres codes.

| Code AppError                | Catégorie  | HTTP | Quand                                                 | Scénario |
| ---------------------------- | ---------- | ---- | ----------------------------------------------------- | -------- |
| `SLOT_CAPACITY_INVALID`      | VALIDATION | 400  | la capacité n'est pas un entier supérieur ou égal à 1 | AS2      |
| `SLOT_TIME_RANGE_INVALID`    | VALIDATION | 400  | la fin est égale ou antérieure au début               | AS3      |
| `SLOT_DISCIPLINE_NOT_FOUND`  | NOT_FOUND  | 404  | la discipline du créneau n'existe pas                 | AS4      |
| `REGISTRATION_NAME_REQUIRED` | VALIDATION | 400  | le nom est vide ou fait seulement d'espaces           | AS6      |
| `REGISTRATION_EMAIL_INVALID` | VALIDATION | 400  | l'email est mal formé                                 | AS6      |
| `SLOT_FULL`                  | CONFLICT   | 409  | le créneau a déjà autant d'inscrits que de places     | AS7, AS8 |
| `SLOT_NOT_FOUND`             | NOT_FOUND  | 404  | aucun créneau n'a cet identifiant                     | AS9      |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit ; chaque route a aussi son test e2e dans `apps/api/test/slots.e2e.spec.ts`.

| Scénario | Fichier de test                                   | Niveau        | Ce que le test vérifie                                                                                             |
| -------- | ------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| AS1      | `domain/slot.spec.ts`, e2e                        | unitaire, e2e | le créneau a sa discipline, ses horaires, une capacité de 2 et 0 inscrit ; la route répond 201                     |
| AS2      | `domain/slot.spec.ts`, e2e                        | unitaire, e2e | `SLOT_CAPACITY_INVALID` pour 0, -1 et 1,5 ; la route répond 400 sur `capacity`, y compris s'il manque              |
| AS3      | `domain/slot.spec.ts`, e2e                        | unitaire, e2e | `SLOT_TIME_RANGE_INVALID` pour une fin égale ou antérieure au début ; 400 si un horaire manque                     |
| AS4      | `application/volunteers.application.spec.ts`, e2e | unitaire, e2e | `SLOT_DISCIPLINE_NOT_FOUND` et aucun créneau enregistré ; la route répond 404                                      |
| AS5      | `application/volunteers.application.spec.ts`, e2e | unitaire, e2e | l'inscription garde le nom et l'email sans espaces autour, et le créneau compte 1 inscrit ; 201                    |
| AS6      | `domain/registration.spec.ts`, e2e                | unitaire, e2e | `REGISTRATION_NAME_REQUIRED` et `REGISTRATION_EMAIL_INVALID` ; la route répond 400                                 |
| AS7      | `domain/slot.spec.ts`, e2e                        | unitaire, e2e | `SLOT_FULL` au troisième bénévole, et toujours 2 inscrits ; la route répond 409                                    |
| AS8      | `infra/drizzle-slot.repository.int.spec.ts`       | intégration   | deux inscriptions lancées ensemble sur la dernière place : une acceptée, l'autre `SLOT_FULL`, 1 inscrit lu en base |
| AS9      | `application/volunteers.application.spec.ts`, e2e | unitaire, e2e | `SLOT_NOT_FOUND` ; la route répond 404                                                                             |

## 6. Tâches

Six au plus, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [ ] T01 [001-AS1, AS2, AS3] Écrire d'abord `domain/slot.spec.ts` (« 001-AS1: creates a slot with its discipline, times, capacity and no registration »), puis les schémas de `packages/shared/src/volunteers.ts`, `domain/volunteers.errors.ts` et `Slot.create()`
- [ ] T02 [001-AS5, AS6, AS7] Écrire d'abord `domain/registration.spec.ts` et la suite de `domain/slot.spec.ts` (« 001-AS7: rejects a registration on a full slot »), puis `domain/registration.ts` et `slot.register()`
- [ ] T03 [001-AS4, AS5, AS9] Écrire d'abord `application/volunteers.application.spec.ts` (« 001-AS4: refuses a slot for an unknown discipline »), puis le port `SlotRepository`, sa version en mémoire, `OpenSlot` et `RegisterVolunteer`
- [ ] T04 [001-AS1, AS5, AS8] Écrire d'abord `infra/drizzle-slot.repository.int.spec.ts` (« 001-AS8: accepts only one of two simultaneous registrations for the last place »), puis `infra/volunteers.schema.ts`, la migration, `infra/slot.mapper.ts` et `DrizzleSlotRepository`
- [ ] T05 [001-AS1, AS2, AS3, AS4, AS5, AS6, AS7, AS9] Écrire d'abord `apps/api/test/slots.e2e.spec.ts` (« 001-AS7: rejects a registration on a full slot (409, SLOT_FULL) »), puis `http/slots.controller.ts`, `volunteers.module.ts` et son ajout dans `app.module.ts`
