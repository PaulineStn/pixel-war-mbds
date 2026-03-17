# pixel-war-mbds

# Description
Application web collaborative permettant à plusieurs utilisateurs de dessiner en temps réel sur un tableau de pixels, avec des règles de participation (cooldown, limites, durée de vie du board).

# Fonctionnalités
- Authentification
    - Inscription / Connexion
    - Gestion des utilisateurs

- Homepage
    - Accès login / register
    - Liste des PixelBoards
    - Statistiques globales (utilisateurs, boards)

- Pixel Board

  - Grille interactive de pixels
  - Choix de couleur
  - Placement de pixel
  - Affichage des informations : taille, temps restant, règles du board
  - Mise à jour temps réel (WebSocket)

- Administration

  - Création d’un PixelBoard
  - Modification / suppression
  - Configuration : statut (ouvert / fermé), taille, date limite, délai entre contributions, overwrite autorisé ou non

- UI / UX

  - Thème clair / sombre (persistant)

- Bonus

  - Replay des contributions
  - Heatmap des pixels
  - Export du board (image / JSON)

- Architecture Monorepo avec séparation front back


Auteurs : 
- ZENNANI Farid 
- STEICHEN Pauline
- VANDAMME Clément 
- AAROUR Mouna

