# Figurinhas Copa 2026

App web mobile-first para controlar o álbum de figurinhas da Copa 2026.

## Stack

- Vite
- React
- TypeScript
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
    duplicates/
    missing/
    profile/
    stickers/
  hooks/            # hooks compartilhados
  lib/              # helpers puros
  styles/           # CSS global
```
