# Figurinhas Copa 2026

App web mobile-first para controlar o álbum de figurinhas da Copa 2026.

## Stack

- Vite
- React
- TypeScript
- Firebase Auth com Google
- Cloud Firestore
- Zustand
- TanStack Query
- Vite PWA
- CSS moderno com design mobile-first

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Arquitetura

```txt
src/
  app/              # providers, rotas e shell principal
  components/       # UI reutilizável e layout
  data/             # catálogo Copa 2026
  features/         # módulos do produto
    album/
    auth/
    duplicates/
    missing/
    profile/
    stickers/
  firebase/         # config, Auth e Firestore
  hooks/            # hooks compartilhados
  lib/              # helpers puros
  styles/           # CSS global
```

## Firestore

```txt
users/{uid}
users/{uid}/albums/default
```

O documento do álbum salva o estado completo do usuário e um resumo com totais para leitura rápida.
