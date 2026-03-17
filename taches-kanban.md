# Kanban Projet - PixelBoard

## 🚨 Phase 0 : Initialisation (Tous ensemble - 1 à 2 heures)
- [ ] **Définir les modèles de données** : Valider ensemble les schémas Mongoose typiques (`User`, `PixelBoard`, `Pixel`).
- [ ] **Définir les contrats d'API** : Lister les routes majeures à développer (ex: `POST /api/auth/login`, `GET /api/boards/`).
- [ ] **Repository GitHub** : Initialiser le dépôt public avec le code fourni (`project-skeleton`).
- [ ] **Environnement local** : S'assurer que chaque membre arrive à lancer le projet complet (React + Node + Base de données MongoDB via Docker Compose).

---

## 👨‍💻 Dev 1 : Le Core Engine (Focus Canvas & Temps Réel)
### Backend
- [ ] **WebSockets (Setup)** : Mettre en place le serveur Socket.io (ou ws) sur l'API NodeJS.
- [ ] **WebSockets (Events)** : Gérer la réception d'un nouveau pixel et le diffuser (broadcast) à tous les clients connectés.
- [ ] **Moteur de règles** : Implémenter la logique métier critique : vérifier le délai (*cooldown*) d'un utilisateur, vérifier si le board est encore actif (date de fin de vie), gérer le mode de réécriture d'un pixel.

### Frontend
- [ ] **Composant Canvas** : Créer le composant de dessin interactif (HTML5 Canvas).
- [ ] **UI Canvas** : Ajouter la palette des couleurs limitées et la sélection.
- [ ] **Interactions** : Gérer le zoom et le déplacement (*pan*) sur le canvas.
- [ ] **Sync Front/Back** : Gérer l'événement de clic pour envoyer un pixel au serveur via WebSocket, et afficher les pixels reçus des autres en temps réel.

---

## 👨‍💻 Dev 2 : L'Identité & l'UX (Focus Utilisateurs & Sécurité)
### Backend
- [ ] **Modèle BDD** : Créer le modèle Mongoose `User`.
- [ ] **Authentification** : Implémenter l'inscription (`POST /api/auth/register`).
- [ ] **Authentification** : Implémenter la connexion (`POST /api/auth/login`) (au choix: Basic Auth ou JWT).
- [ ] **Sécurité** : Protéger les routes API privées via middlewares.

### Frontend
- [ ] **Pages / Modales d'accès** : Implémenter les formulaires de Connexion et d'Inscription avec validation côté client.
- [ ] **Mon Profil** : Créer la page de profil affichant le nombre total de pixels ajoutés et les boards participés (historique utilisateur).
- [ ] **State Utilisateur** : Gérer le contexte React pour l'état connecté/déconnecté.
- [ ] **UX (Transverse)** : Implémenter le thème Light/Dark (persistant au rechargement + support `prefers-color-scheme`).

---

## 👨‍💻 Dev 3 : Le Gestionnaire (Focus Back-Office & Homepage)
### Backend
- [ ] **Modèles BDD** : Créer le modèle Mongoose `PixelBoard`.
- [ ] **API CRUD** : Implémenter l'API REST pour `PixelBoards` (Créer, Lire, Modifier, Supprimer).

### Frontend
- [ ] **Homepage (Publique)** : Créer la vue listant les statistiques (inscrits, boards).
- [ ] **Homepage (Publique)** : Afficher une prévisualisation des derniers boards (en cours / terminés).
- [ ] **Admin - Formulaire** : Créer le formulaire complexe d'ajout/modification d'un PixelBoard (titre, attributs, délai de pose, date de fin, taille).
- [ ] **Admin - Liste** : Afficher la liste des PixelBoards (avec tri et filtrage) pour pouvoir les administrer.
- [ ] **Vue Détail Board** : Créer la page conteneur d'un PixelBoard affichant ses infos (temps restant, taille, règles en cours).

---

## 👨‍💻 Dev 4 : L'Architecte Infra & Bonus (Focus DevOps & Déploiement)
### Infra & Structure (Début de projet)
- [ ] **Routing** : Mettre en place le routeur (ex: `react-router-dom`) et les grandes pages/routes frontend.
- [ ] **Standardisation API** : Configurer le client Axios et `TanStack Query` pour unifier les appels réseaux et leurs états (loading, errors).
- [ ] **Qualité de code** : S'assurer que ESLint et/ou Prettier sont configurés et fonctionnels.

### Déploiement (Milieu de projet) 👉 *Must Have (points obligatoires)*
- [ ] **Déploiement BDD** : Mettre la base MongoDB en ligne (ex: MongoDB Atlas).
- [ ] **Déploiement Back** : Mettre l'API NodeJS en ligne (ex: Render, AWS free tier, Heroku).
- [ ] **Déploiement Front** : Mettre l'application React en ligne (Vercel, Netlify).

### Features Avancées (Fin de projet) 👉 *Pour grimper dans la note*
- [ ] **Bonus** : Export d'un PixelBoard en image (`.png` / `.svg`).
- [ ] **Bonus** : SuperPixelBoard (Affiche toutes les créations).
- [ ] **Bonus** : Heatmap des pixels les plus utilisés.
- [ ] **Bonus** : Upload d'une image convertie en art pixelisé.
