# 001 — Bénévoles : ouvrir un créneau et s'y inscrire

**Statut** : Validée
**PRD** : specs/prd-benevoles.md, TR1

## Contexte

Les responsables de discipline tiennent les inscriptions des bénévoles d'accueil sur papier, et des créneaux débordent. Cette tranche met en place le cœur du besoin : un créneau a une capacité, et l'application refuse toute inscription au-delà, au lieu de compter sur la vigilance du responsable.

## User stories

- En tant que responsable de discipline, je veux ouvrir un créneau d'accueil pour ma discipline avec un nombre de places, afin de cadrer le nombre de bénévoles attendus.
- En tant que bénévole, je veux m'inscrire à un créneau avec mon nom et mon email, afin de réserver ma place.
- En tant que responsable, je veux qu'une inscription sur un créneau complet soit refusée, afin que le créneau ne déborde jamais.

## Scénarios d'acceptation

### AS1 — Ouvrir un créneau

- **Étant donné** la discipline « Lutte » · **Quand** le responsable ouvre un créneau pour « Lutte » le 1er novembre 2026 de 9 h à 12 h, avec 2 places · **Alors** le créneau est enregistré avec sa discipline, ses horaires, sa capacité de 2 et aucun inscrit.

### AS2 — Capacité invalide

- **Étant donné** une capacité nulle, négative, non entière ou absente · **Quand** le responsable ouvre le créneau · **Alors** c'est refusé, la réponse dit pourquoi, et aucun créneau n'est enregistré.

### AS3 — Horaires incohérents

- **Étant donné** une fin égale ou antérieure au début, ou un horaire manquant · **Quand** le responsable ouvre le créneau · **Alors** c'est refusé, la réponse dit pourquoi, et aucun créneau n'est enregistré.

### AS4 — Discipline inexistante

- **Étant donné** une discipline qui n'existe pas · **Quand** le responsable ouvre un créneau pour elle · **Alors** c'est refusé, l'application dit que la discipline est introuvable, et aucun créneau n'est enregistré.

### AS5 — S'inscrire à un créneau

- **Étant donné** un créneau de 2 places sans inscrit · **Quand** Awa Diop (awa@example.sn) s'y inscrit · **Alors** l'inscription est acceptée avec son nom et son email (espaces autour retirés), et le créneau compte 1 inscrit.

### AS6 — Nom ou email invalide

- **Étant donné** un nom vide ou fait d'espaces, ou un email absent ou mal formé · **Quand** le bénévole s'inscrit · **Alors** c'est refusé, la réponse dit pourquoi, et le nombre d'inscrits ne change pas.

### AS7 — Créneau complet

- **Étant donné** un créneau de 2 places qui compte déjà 2 inscrits · **Quand** un troisième bénévole s'y inscrit · **Alors** c'est refusé avec un message qui dit que le créneau est complet, et le créneau compte toujours 2 inscrits.

### AS8 — Dernière place prise au même instant

- **Étant donné** un créneau auquel il reste une seule place · **Quand** deux bénévoles s'y inscrivent au même instant · **Alors** une seule inscription est acceptée, l'autre est refusée comme en AS7, et le créneau ne dépasse jamais sa capacité.

### AS9 — Créneau inexistant

- **Étant donné** un créneau qui n'existe pas · **Quand** un bénévole s'y inscrit · **Alors** c'est refusé, et l'application dit que le créneau est introuvable.

## Hors périmètre

- Consulter un créneau, ses places restantes et la liste de ses inscrits (TR2).
- Le refus d'un même email inscrit deux fois au même créneau (TR2).
- La désinscription et l'écran du bénévole (TR3) ; cette tranche n'a pas d'écran.
- La modification ou la suppression d'un créneau, les emails de confirmation, les comptes.

## Questions ouvertes

- Un créneau se définit par une discipline, un début, une fin et une capacité : hypothèse retenue, le PRD ne le précise pas. Pas de limite haute de capacité ni d'interdiction des créneaux passés.
- Statuts et codes d'erreur non donnés par la demande : le plan les choisira (refus de créneau complet en conflit ou règle métier).
- Comme le PRD, on ne vérifie pas que celui qui ouvre un créneau est bien responsable de la discipline.
