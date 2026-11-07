# CLAUDE.md

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

- Une fonctionnalité suit `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge` ; les principes sont dans `specs/constitution.md`.
- Test d'abord, vu en échec pour la bonne raison (`pnpm tdd:red <fichier>`), puis le code minimal.
- Ordre d'une fonctionnalité (README, « Ajouter une fonctionnalité ») : schéma partagé → entité → cas d'usage → table et migration → repository Drizzle → controller et e2e → fausse API → écran.
- Une tâche = un commit Conventional Commits ; `pnpm verify` tourne au pré-commit, jamais de `--no-verify`. `pnpm check` avant de déclarer fini.
- Celui qui produit ne valide pas : le sous-agent `relecteur` relit une fonctionnalité terminée.

## Architecture

- `packages/shared` : schémas Zod d'entrée et de réponse, importés par l'API et le front. Le front n'importe jamais `apps/api`.
- API : un module par domaine dans `apps/api/src/modules/<domaine>/`, sur le modèle de `disciplines` : `domain/` (entités, règles, erreurs), `application/` (port repository + `use-cases/`), `infra/` (table, mapper, repository Drizzle), `http/` (controller).
- `domain/` reste du TypeScript pur : ni NestJS, ni Drizzle (vérifié par oxlint).
- Le controller valide (DTO `createZodDto`), appelle un cas d'usage, sérialise (`@ZodSerializerDto`). Aucune règle métier.
- Le `<nom>.module.ts` relie le port abstrait à son implémentation Drizzle ; il est importé dans `src/app.module.ts`.
- Transverse dans `src/core/` (config, base, erreurs, santé). Migrations générées par `pnpm db:generate`, jamais éditées à la main.
- Front : `src/routes/` (TanStack Router, un fichier = une route), `src/features/<nom>/api/` (`<nom>.api.ts` sans React, `<nom>.queries.ts` hooks TanStack Query) et `components/`, `src/components/ui/` (shadcn).
- `src/mocks/` est la fausse API (MSW) des tests du front : même contrat et mêmes codes d'erreur que l'API.

## Concepts appréciés

- TypeScript strict (`noUncheckedIndexedAccess`), pas de `any` ; types dérivés des schémas (`z.infer`).
- Entité à constructeur privé : `Discipline.create()` applique les règles, `Discipline.restore()` relit la base sans les rejouer ; modifications par méthodes (`rename()`).
- Le domaine ne fait pas confiance à la validation HTTP : il revérifie ses invariants.
- Une classe par cas d'usage, `@Injectable()`, une seule méthode publique `execute()`.
- Port = classe abstraite dans `application/`, qui ne contient que ce dont les cas d'usage ont besoin.
- Commentaires courts en français qui disent le pourquoi (JSDoc sur les classes et les ports).

## Bonnes pratiques

- Toute erreur métier est une `AppError` : une classe par domaine (`DisciplineError`) et une table code → catégorie (VALIDATION, NOT_FOUND, CONFLICT, BUSINESS_RULE) dans `domain/<nom>.errors.ts`, avec des fabriques (`disciplineNotFound(id)`).
- Seul `ProblemDetailsFilter` transforme une erreur en réponse HTTP (400/404/409/422, RFC 9457). Jamais de `HttpException` dans un module.
- Toute entrée (corps, paramètres) est validée par un schéma Zod de `packages/shared`, jamais à la main.
- Unicité : vérifiée par le cas d'usage pour un message clair, et garantie par une contrainte en base.
- Aucun secret dans le code : les valeurs viennent de `apps/api/.env` (ignoré par git).
- Tests API : `*.spec.ts` (domaine, et cas d'usage avec le repository en mémoire de `application/testing/`), `*.int.spec.ts` (repository Drizzle sur PGlite), `test/*.e2e.spec.ts` (supertest, via `createTestApp()`).
- Tests front : `*.test.tsx` à côté du fichier, commençant par un commentaire qui dit ce qu'il prouve ; un audit `*.a11y.test.tsx` par état d'écran.

## Nommage

- Fichiers en kebab-case, suffixés par leur rôle : `create-discipline.ts`, `discipline.mapper.ts`, `disciplines.schema.ts`, `drizzle-discipline.repository.ts`, `in-memory-discipline.repository.ts`.
- Classes en PascalCase ; cas d'usage = verbe + entité (`CreateDiscipline`, `ListDisciplines`) ; implémentations préfixées par la technique (`DrizzleDisciplineRepository`).
- Codes d'erreur en SCREAMING_SNAKE_CASE préfixés par l'entité : `DISCIPLINE_NAME_TAKEN`.
- Schémas Zod en camelCase suffixés `Schema` (`createDisciplineSchema`), types en PascalCase (`CreateDisciplineInput`, `DisciplineResponse`), constantes en majuscules (`DISCIPLINE_CATEGORIES`).
- Colonnes en base en snake_case (`created_at`), propriétés TS en camelCase (`createdAt`) ; le mapper traduit.
- Titres de tests en anglais, préfixés par la spec et le scénario : `it('000-AS2: rejects a discipline without a name (400, RFC 9457)')`.
- Commits : Conventional Commits en anglais, avec la tâche et le scénario si spec : `feat(benevoles): T03 refuse a full slot (001-AS2)`.
