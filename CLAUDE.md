# Figurinhas Copa 2026 — Contexto de Projeto

> Contexto persistente do projeto. Atualizar quando o estado real do app mudar.

---

## O que é o projeto

App web mobile-first (PWA) para controlar o álbum de figurinhas da Copa do Mundo FIFA 2026.

- Marcar figurinhas que o usuário tem
- Listar faltantes em formato copiável
- Contar repetidas para troca
- Registrar gastos com figurinhas
- Salvar progresso localmente e sincronizar automaticamente com Supabase

**Público**: colecionadores BR, UI em pt-BR.
**Plataforma alvo**: mobile-first, instalável como PWA.

---

## Stack

- Vite 7 + React 19 + TypeScript 5.9
- react-router-dom 7
- Zustand 5
- TanStack Query 5
- Supabase JS
- lucide-react
- vite-plugin-pwa
- CSS global em `src/styles/globals.css`

---

## Arquitetura

```txt
src/
  app/
    App.tsx              # shell principal, hidratação local e sync Supabase
    providers.tsx        # QueryClientProvider + RouterProvider
    router.tsx           # rotas: /album, /faltantes, /repetidas, /perfil
  components/
    layout/AppShell.tsx  # header + bottom-nav com 4 itens
    ui/Button.tsx
  data/
    panini2026.json      # catálogo preprocessado
    worldCup2026.ts      # adapter do catálogo
  features/
    album/
    duplicates/
    missing/
    profile/
    stickers/
  hooks/
  lib/
    supabase.ts          # cliente e backup do álbum
  styles/globals.css
  main.tsx
```

---

## Estado Atual

- App sem login visível.
- Cada dispositivo cria uma conta anônima persistente no Supabase.
- O álbum continua local-first via Zustand + localStorage.
- O backup no Supabase é salvo automaticamente quando o álbum muda.
- Se o dispositivo estiver zerado e existir backup remoto para a sessão anônima, o app restaura automaticamente.
- A tela de perfil mostra status do Supabase, backup local, sync manual e reset local.
- A função de câmera/leitura de figurinhas foi removida completamente do app.

### Semântica de contagem (DATA_VERSION 8+)

- `StickerState.duplicates` é a contagem **total** de cópias daquela figurinha (0 = não tenho, 1 = tenho, >1 = repetida).
- `StickerState.owned` é mantido sincronizado (`duplicates > 0`).
- Aba "Repetidas" e filtro "Repetidas" só listam figurinhas com `duplicates > 1`.
- `summary.duplicates` soma `max(0, duplicates - 1)` por figurinha — número de cópias excedentes.
- Migração automática em `normalizeAlbumState`: estados com `version < 8` tinham `duplicates` = extras além da primeira; convertidos para total ao carregar (local ou Supabase).

---

## Rotas

- `/album` — coleção, filtros, progresso e gastos
- `/faltantes` — faltantes copiáveis
- `/repetidas` — repetidas copiáveis
- `/perfil` — status local/nuvem e ações de backup

`/login` redireciona para `/album`.

---

## Supabase

Variáveis esperadas:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

SQL local:

```txt
supabase/schema.sql
```

No painel do Supabase, precisa:

- Anonymous Sign-Ins ativo
- tabela `album_backups` criada pelo SQL
- RLS ativo com policies por `auth.uid() = user_id`

---

## Design System

Direção estética atual: Retro Panini Anos 70/80.

- Tema claro em papel cream/off-white
- Acentos mostarda, brick, olive, teal e cocoa
- Tipografia via Google Fonts: Bowlby One, Fraunces e Sansita
- Sombras sólidas de carimbo
- Halftone, grão e misregistro CMYK em headings principais
- Bottom nav com 4 itens

---

## Próximos Passos Prováveis

- Validar Supabase em produção depois de ativar Anonymous Sign-Ins e rodar o SQL.
- Esconder controles manuais de nuvem caso o sync automático fique estável.
- Melhorar tracker de gastos com histórico editável.
- Avaliar code-split para reduzir bundle inicial.
