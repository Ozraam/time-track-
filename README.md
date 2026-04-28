# FlexTime Manager

Application web de gestion du temps de travail — suivez vos horaires, calculez automatiquement votre heure de débauche et gérez vos heures supplémentaires.

## Fonctionnalités

- **Saisie quotidienne** : Pointage d'arrivée, début de pause, reprise et débauche via un unique bouton intelligent
- **Estimation immédiate** : Dès la prise de poste, l'heure de débauche théorique est calculée
- **Lissage des heures** : Les heures supplémentaires ou à rattraper sont réparties sur N jours configurables
- **Statistiques** : Graphiques linéaires, barres et calendrier mensuel
- **Multi-comptes** : Chaque utilisateur a ses propres données et réglages
- **Responsive** : Interface mobile-first (Vue.js 3 + Tailwind CSS)

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend  | Vue.js 3 (Composition API) + Tailwind CSS + Chart.js |
| Backend   | Node.js + Express.js |
| Base de données | SQLite |
| Authentification | JWT |
| Conteneurisation | Docker + Docker Compose |

## Lancement rapide (Docker)

```bash
# Cloner le dépôt
git clone https://github.com/Ozraam/time-track-.git
cd time-track-

# Lancer l'application
docker compose up --build
```

L'application sera disponible sur **http://localhost:8080**

### Variables d'environnement (optionnel)

Créez un fichier `.env` à la racine du projet :

```env
JWT_SECRET=votre-clé-secrète
PORT=8080
```

## Développement local

### Backend

```bash
cd backend
cp .env.example .env
# Éditez .env pour définir JWT_SECRET
npm install
node src/app.js
```

L'API sera disponible sur http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'interface sera disponible sur http://localhost:5173

## Structure du projet

```
├── backend/
│   ├── src/
│   │   ├── app.js          # Point d'entrée Express
│   │   ├── db/             # Initialisation SQLite
│   │   ├── middleware/     # Authentification JWT
│   │   └── routes/         # auth, user, entries
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/          # Dashboard, Statistics, Settings, Auth
│   │   ├── stores/         # Pinia (auth, entries, settings)
│   │   ├── router/         # Vue Router
│   │   └── components/     # Composants réutilisables
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Connexion |
| GET | /api/user/settings | Paramètres utilisateur |
| PUT | /api/user/settings | Modifier les paramètres |
| GET | /api/entries/today | Entrée du jour |
| POST | /api/entries/action | Avancer l'état du jour |
| GET | /api/entries/:year/:month | Entrées d'un mois |
| PUT | /api/entries/:id | Modifier une entrée |
| DELETE | /api/entries/:id | Supprimer une entrée |

## Modèle de données

**Table `users`**: `id`, `email`, `password`, `daily_target` (minutes), `default_break` (minutes), `stagger_days`

**Table `work_entries`**: `id`, `user_id`, `day_date`, `start_time`, `lunch_start`, `lunch_end`, `end_time`, `total_minutes`, `daily_balance`