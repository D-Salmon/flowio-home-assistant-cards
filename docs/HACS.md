# Installation HACS et manuelle

## Avant publication

La version 0.4.0 ajoute la carte globale `custom:flowio-dashboard-card`. Modifier `package.json` ou les notes ne constitue pas une release : le bundle doit être vérifié par l’intégration continue avant publication.

Voir [la procédure de release](RELEASE.md) : lockfile testé et fusionné, contrôle de l'interface HA, puis workflow stable qui crée uniquement un brouillon. La publication publique est manuelle et distincte.

Le workflow **Publish HACS prerelease (manual)** peut publier une beta depuis `main` ou une branche `feature/*`. Il exécute les tests sur le commit choisi et crée une préversion publique. Ne pas le confondre avec la préparation d'une stable : celle-ci s'effectue depuis `main`. Choisir un nouveau numéro beta, jamais un tag déjà utilisé.

## Après publication : HACS

1. Ajouter https://github.com/D-Salmon/flowio-home-assistant-cards aux dépôts personnalisés HACS, catégorie **Dashboard**.
2. Télécharger explicitement la version publiée souhaitée. Le dépôt n'est pas ajouté automatiquement au catalogue HACS par défaut.
3. Vérifier la ressource `/hacsfiles/flowio-home-assistant-cards/flowio-home-assistant-cards.js`, type module JavaScript.
4. Supprimer les anciennes ressources manuelles ou en double, puis recharger le frontend.

Le nom du bundle correspond à hacs.json et à l'asset de release. Le téléchargement réel via HACS doit être contrôlé lors de la première installation. Une préversion peut nécessiter d'activer les versions beta dans HACS ; un brouillon n'est pas une release installable publique.

Pour l’installation la plus simple, ajouter ensuite la carte **Flow.io Tableau de bord** dans Home Assistant :

```yaml
type: custom:flowio-dashboard-card
title: Piscine principale
entity_prefix: bassin1
grid_options:
  columns: full
```

Le même bundle contient aussi toutes les cartes spécialisées. Les exemples et le README utilisent les entités métier du firmware par préfixe. Pour deux contrôleurs, créer deux cartes globales avec deux préfixes distincts, par exemple `bassin1` et `bassin2`. Vérifier la présence des entités et les slots avant toute commande.

## Installation manuelle

Télécharger le JavaScript de la release vérifiée, le copier dans `config/www/flowio/flowio-home-assistant-cards.js` et déclarer `/local/flowio/flowio-home-assistant-cards.js` comme ressource module JavaScript. Ne pas charger aussi la copie HACS.

La release fournit SHA256SUMS pour contrôler les fichiers. Le bundle contient Lit et ApexCharts ; les licences des dépendances sont incluses dans le JavaScript et jointes séparément.

La carte ne configure pas MQTT, le Recorder ou le contrôleur. Les clics sur des commandes dans une vraie instance HA peuvent agir sur les équipements ; les sécurités restent dans Flow.io.
