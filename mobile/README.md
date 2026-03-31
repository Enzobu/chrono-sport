# Mobile (Expo)

App React Native calquee sur le front web:

- Auth: connexion / inscription
- Home: listing des seances
- CRUD seances: creation, edition, suppression (confirmation)
- Timer: travail/repos, skip, reset, progression, stats, details en accordions
- Android: timer maintenu en arriere-plan avec notification persistante pendant une seance en cours

## Prerequis

- Node.js 18+
- Android SDK / Java (si emulateur Android)

## Lancer en dev

```bash
npm install
npx expo start
```

## Variables d'environnement

Copie `.env.example` vers `.env` et adapte l'URL API:

- `EXPO_PUBLIC_API_URL=http://localhost:38746`

Si la variable est absente, l'app utilise:

- Android emulator: `http://10.0.2.2:38746`
- iOS simulator: `http://localhost:38746`

Sur vrai telephone, `localhost` ne marche pas: utilise l'IP de ta machine (ex: `http://192.168.1.20:38746`).

## Build APK / AAB (EAS)

1. Installer EAS CLI (si besoin):

```bash
npm i -g eas-cli
```

2. Se connecter:

```bash
eas login
```

3. Initialiser le projet EAS (une fois):

```bash
eas init
```

4. Configurer l'URL API de prod dans `eas.json` (remplace `https://api.example.com`).

5. Lancer les builds:

```bash
npm run build:android:preview
npm run build:android:production
```

- `preview` produit un APK installable direct.
- `production` produit un AAB (Play Store).
