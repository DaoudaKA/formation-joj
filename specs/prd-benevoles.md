# PRD — Bénévoles

**Statut** : Validé

## Problème

Chaque discipline a besoin de bénévoles pour accueillir le public. Les responsables de discipline gèrent les inscriptions sur papier, et des créneaux débordent : plus de bénévoles que de places, ou des inscrits qu'on ne retrouve pas. Pendant les Jeux, un créneau mal tenu, c'est un accueil du public désorganisé.

## Utilisateurs

- Responsable de discipline : ouvre des créneaux d'accueil pour sa discipline, avec un nombre de places.
- Bénévole : s'inscrit à un créneau, et s'en désinscrit s'il ne peut plus venir.

## Proposition

Le responsable ouvre un créneau avec une capacité ; les bénévoles s'y inscrivent ; l'application refuse toute inscription au-delà de la capacité. La règle est tenue par l'application et non plus par la vigilance du responsable, ce que le papier ne permet pas.

## Mesure du succès

Pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième, avec un message qui dit que le créneau est complet.

## Tranches

### TR1 — Ouvrir un créneau et s'y inscrire, jamais au-delà de la capacité

Le responsable ouvre un créneau avec une capacité ; un bénévole s'y inscrit. Règle : une inscription sur un créneau complet est refusée.

### TR2 — Consulter un créneau et ses inscrits, sans doublon

On consulte un créneau, ses places restantes et la liste de ses inscrits. Règle : un même email ne peut pas s'inscrire deux fois au même créneau.

### TR3 — Se désinscrire, et un écran pour le bénévole

Le bénévole se désinscrit d'un créneau, ce qui libère une place. Un écran permet de voir un créneau, de s'y inscrire et de s'en désinscrire.

## Hors périmètre

- La modification ou la suppression d'un créneau.
- Les emails de confirmation.
- Les comptes des bénévoles.

## Hypothèses et risques

- Supposé : un créneau appartient à une discipline existante. Si un créneau peut être transverse (accueil général du site), le rattachement est à revoir.
- Supposé : sans compte, un bénévole est identifié par son nom et son email. Rien n'empêche alors de désinscrire quelqu'un d'autre en connaissant son email.
- Supposé : aucune vérification que celui qui ouvre un créneau est bien responsable de la discipline.
- Risque : deux bénévoles qui prennent la dernière place au même instant ; la règle de capacité doit tenir dans ce cas.
