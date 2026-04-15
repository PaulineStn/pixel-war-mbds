# Pixel-war-mbds

# Description
Application web collaborative permettant à plusieurs utilisateurs de dessiner en temps réel sur un tableau de pixels, avec des règles de participation (cooldown, limites, durée de vie du board).

# Lien de l'application déployée

https://pixel-war-mbds.onrender.com/

# Fonctionnalités développées
- **Authentification**
    - Inscription / Connexion
    - Gestion des utilisateurs

- **Homepage**
    - Accès login / register
    - Liste des PixelBoards
    - Statistiques globales (utilisateurs, boards)

- **Pixel Board**

  - Grille interactive de pixels
  - Choix de couleur
  - Placement de pixel
  - Affichage des informations : taille, temps restant, règles du board
  - Mise à jour temps réel (WebSocket)

- **Administration**

  - Création d’un PixelBoard
  - Modification / suppression
  - Configuration : statut (ouvert / fermé), taille, date limite, délai entre contributions, overwrite autorisé ou non

- **UI / UX**

  - Thème clair / sombre (persistant)

- **Bonus**

  - Replay des contributions
  - Heatmap des pixels
  - Export du board (image / JSON)

- **Architecture Monorepo** avec séparation front back
    - /client → Frontend (React + Vite)
    - /api → Backend (Node.js + Express)
    - Base de données : MongoDB (Docker)
    - Communication temps réel : WebSocket (Socket.IO)


## Première configuration

## Installation
```bash
git clone https://github.com/PaulineStn/pixel-war-mbds.git
cd pixel-war-mbds
```

Dans le répertoire racine du projet :
- Lancer MongoDB avec Docker
```bash
docker compose up -d
```
- Puis installer les dépendances
```bash
cd api/
npm install
```
puis : 
```bash
cd client/
npm install
```
- Configurer les variables d’environnement : Créer un fichier .env dans /api : (exemple dans le .env.example)
```bash
PORT=3000
MONGO_URI=mongodb://pixel_admin:pixel_admin_pwd@localhost:27017/pixel-war?authSource=admin
JWT_SECRET=your_secret_key
```

## Lancer le projet

### Les deux dans 2 terminaux différents
côté api : 
```bash
cd api/
npm run dev
```
côté client 
```bash
cd client/
npm run dev
```

| Service | URL par défaut       |
| ------- | --------------------- |
| Client  | http://localhost:5173 |
| API     | http://localhost:3000 |


## Auteurs et Répartition des tâches
### **ZENNANI Farid**
- GitHub : Faridzen
- Tâches :
    - implémentation du linter
    - corrections sur les router
    - corrections sur requêtes HTTP avec Tanstack et Axios
    - corrections sur les états des pixels boards

### **STEICHEN Pauline**
- GitHub : PaulineStn
- Tâches :
    - mise en place initiale du repo et architecture back/front
    - implémentation de l'authentification avec jwt
    - mise en place des pages home, connexion, création de compte, profile
    - implémentation de l'interace utilisateur sur les pages

### **VANDAMME Clément**
- GitHub : Nassco
- Tâches :
    - corrections sur les pixels boards
    - corrections sur les pages admin
    - déploiement de l'application
    - alimentation des données utilisateurs

### **AAROUR Mouna**
- GitHub : mounaAar
- Tâches :
    - gestion des rôles et accès administrateur
    - implémentation seed d'un compte admin au démarrage
    - implémentation des pixels boards avec canvas intéractif
    - alimentation des pages home, profile



