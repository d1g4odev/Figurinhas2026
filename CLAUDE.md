# Figurinhas Copa 2026 — Contexto de Projeto

> Este arquivo é o contexto persistente do projeto para o Claude. Ele DEVE ser atualizado a cada sessão de trabalho — sempre que algo for adicionado, alterado, decidido ou bloqueado.
>
> Regras de atualização:
> - Mover trabalho concluído de "Onde paramos" para "Histórico".
> - Atualizar "Onde estamos" com o estado atual real.
> - Atualizar "Para onde vamos" com a próxima decisão/ação concreta.
> - Não escrever romance — bullets curtos, datas absolutas, decisões com motivo.

---

## O que é o projeto

App web mobile-first (PWA) para controlar o álbum de figurinhas da Copa do Mundo FIFA 2026. Substitui anotações manuais com:

- Marcar quais figurinhas o usuário tem ("Tenho" / "Falta")
- Contar repetidas para troca
- Listar faltantes em formato copiável (para WhatsApp/Discord)
- Scanner via câmera (OCR nativo `TextDetector`) ou entrada manual de código
- Tracker de gastos com figurinhas
- Backup automático na conta Google (Firestore)

**Público**: colecionadores BR (UI em pt-BR).
**Plataforma alvo**: mobile-first, instalável como PWA.

---

## Stack

- **Vite 7** + **React 19** + **TypeScript 5.9**
- **react-router-dom 7** (browser router, rotas em `src/app/router.tsx`)
- **Firebase 12** — Auth (Google) + Firestore
- **Zustand 5** — estado do álbum
- **TanStack Query 5** — provider montado em `src/app/providers.tsx`
- **lucide-react** — ícones
- **vite-plugin-pwa** — manifest + service worker
- **CSS único** em `src/styles/globals.css` (sem Tailwind, sem CSS-in-JS, sem CSS modules — design system 100% em CSS via classes semânticas)

---

## Arquitetura

```txt
src/
  app/
    App.tsx              # shell autenticado + hidratação do álbum local + sync Firestore (debounce 800ms)
    providers.tsx        # QueryClientProvider + RouterProvider
    router.tsx           # rotas: /login, /album, /faltantes, /scanner, /repetidas, /perfil
  components/
    layout/AppShell.tsx  # header + bottom-nav (5 itens)
    ui/Button.tsx        # variants: primary | secondary | ghost | danger
  data/
    worldCup2026.ts      # catálogo (teams, flagUrl)
  features/
    album/               # store Zustand + summary + AlbumPage (hero, progress, expense, grid)
    auth/                # useAuth + LoginPage (Google sign-in)
    duplicates/          # DuplicatesPage (lista copiável)
    missing/             # MissingPage (lista copiável)
    profile/             # ProfilePage (stats + logout)
    scanner/             # ScannerPage (modo foto OCR + modo código) + overlay de confirmação
    stickers/            # StickerCard + StickerGrid
  firebase/              # config, firebase.auth.ts, firebase.firestore.ts
  hooks/                 # useCopyToClipboard, etc.
  lib/                   # helpers puros (cn, formatStickerCode)
  styles/globals.css     # ❗ design system completo (tokens + componentes via classe)
  main.tsx
```

**Firestore**:
- `users/{uid}` — doc do usuário
- `users/{uid}/albums/default` — estado completo do álbum + resumo agregado para leitura rápida

---

## Design System (estado atual)

**Direção estética**: "Retro Panini Anos 70/80" — comprometimento total

- **Tema**: LIGHT, papel manteiga em toda a UI (não dark)
- **Cor**: cream/off-white base + acentos mostarda, tijolo (brick), tomate, abacate (olive), petróleo (teal), cocoa; texto em tinta escura
- **Tipografia**:
  - Display: **Bowlby One** (Cooper Black DNA — chunky, redondo, 70s)
  - Body: **Fraunces** (serif flared variável; axis SOFT/WONK ativado pra warm character; itálico nos parágrafos)
  - UI/labels: **Sansita** (chunky friendly p/ botões, chips, eyebrows)
- **Imperfeições de impressão**:
  - **Misregistro CMYK** nos H1/H2 (text-shadow cyan +1.5px / magenta -1.5px)
  - **Halftone dots** via radial-gradient repetido (fine/medium/bold em diferentes regiões)
  - **Grão denso** em SVG `feTurbulence` multiplicado sobre tudo
  - Manchas circulares discretas no body simulando papel envelhecido
- **Sombras de carimbo** (offset sólido, sem blur) — o coração do look: `4-5px 4-5px 0 ink/cocoa/brick`. Em `:active` o elemento se desloca para "imprimir" o press.
- **Detalhes específicos**:
  - Eyebrows com ★ estrelas mostarda dos dois lados
  - Sticker card com faixa tricolor superior (brick/mostarda/olive) + carimbo "TENHO" tinta vermelha rotacionado quando owned
  - Estado "Tenho/Falta" como selo arredondado (pill) com sombra de carimbo
  - Progress ring & pie chart com notches concêntricos tipo rosette
  - Chips como **ticket-stubs** com dentinhos circulares perfurados nas laterais
  - Plain-list com faixa lateral colorida ciclando entre 4 cores
  - Bottom-nav cream com active brick + estrela mostarda flutuando acima
  - Login card como capa de almanaque: selo "Nº 47 / 2026" no canto + listras de selo de correio na base + ornamentos circulares com raios concêntricos
- **Tokens** completos em `:root` no `globals.css`
- **API de classes preservada** — nenhum `.tsx` foi alterado

---

## Onde estamos (estado atual)

- **2026-05-11** — **Auth refeito: Anonymous-first + Google linking opcional**.
  - Novo fluxo: `AuthObserver` em `providers.tsx` detecta `null user` e chama `signInAnonymousUser()` automaticamente. Usuário entra direto na Coleção sem login.
  - `App.tsx` não redireciona mais pra `/login` por padrão; redirect só se houve erro real na sessão anônima. Splash adicional "Preparando seu álbum..." enquanto anon sign-in roda.
  - `linkOrSignInWithGoogle()` em `firebase.auth.ts`: se usuário atual é anônimo, faz `linkWithPopup` (preserva todo o álbum + UID); se já é permanente ou ocorre `auth/credential-already-in-use`, faz `signInWithCredential`/`signInWithPopup` direto (Google existente prevalece).
  - `LoginPage` continua existindo como entrada manual mas botão muda label baseado em estado (`Sincronizar com Google` se anon, `Entrar com Google` se sem user). Adicionado "Continuar sem login" como saída se user já está autenticado de algum jeito.
  - `ProfilePage` mostra "Modo convidado" + botão `Sincronizar com Google` quando anônimo; mostra email + "Sair da conta" quando permanente. Logout cai automaticamente em anon de novo (AuthObserver re-dispara).
  - Removido `resolveRedirectLogin()` morto (era ele que jogava `auth/argument-error` em sessões com state antigo).
  - **Importante**: precisa **habilitar Anonymous auth** no Firebase Console (Authentication > Sign-in method > Anonymous > Enable) senão usa cai em `auth/admin-restricted-operation`.
- **2026-05-11** — **Scanner v2 fullscreen dark UI** (modelo solicitado pelo usuário via screenshot de referência). Mudanças:
  - `ScannerPage.tsx` totalmente reescrita com layout fullscreen: camera `position: absolute inset:0`, top bar com `X` + status "Pronto/Escaneando" + ghost, mode toggle pílula flutuante centrada com verde-fluorescente quando ativa, helper text colorido (verde em destaque + mustard no status), painel "Quick mode" com switch iOS-style, botão "Escanear" pílula verde grande.
  - **Quick mode novo**: quando ligado, detecção marca direto no álbum (ou adiciona repetida se já tinha) sem mostrar overlay de confirmação. Estado em `useState`, ephemeral por sessão.
  - **Modo Código** mantido: surface dark com radial glow verde + input dentro de glass-card translúcido (Sansita uppercase grande).
  - **Modais de confirmação** envolvidos em `.scanner-modal-backdrop` com blur + backdrop preto, mantendo a `overlay-card` cream do retro Panini por dentro (contraste editorial).
  - **`AppShell.tsx`** detecta `location.pathname === '/scanner'` via `useLocation` e renderiza só `{children}` (sem header nem bottom-nav). Scanner ocupa viewport inteiro.
  - **`useNavigate`** no botão `X` retorna pra `/album`.
  - Estética: dark `#050608` base, verde `#4ADE80` para frame/active/CTA, glass-cards `rgba(15,23,42,0.78)` com `backdrop-filter: blur(14px)`. Resto do app permanece light cream retro Panini.
- **2026-05-11** — Pass de **escala apertada** sobre o retro Panini: tamanhos reduzidos pra faixa 14-16px no corpo, headings menores, bottom nav 78→64px, sombras de carimbo 4-5px→3px.
- **2026-05-10** — Direção estética trocada para **Retro Panini Anos 70/80** (a primeira tentativa "Estádio × Panini" foi rejeitada por não comprometer com a era 70s/80s). Reescrita completa do `globals.css`.
- Todas as 6 telas adotam o novo visual sem mudança de TSX:
  - `/login` — capa de almanaque cream com selo "Nº 47 / 2026" rotacionado + listras coloridas de selo postal na base + medalhões mostarda/olive com raios concêntricos
  - `/album` — hero brick com halftone explodindo do canto + progress ring rosette + pie chart com notches + expense tracker mostarda + chips ticket-stub + grid de figurinhas
  - `/faltantes` e `/repetidas` — etiquetas cream com faixa lateral colorida ciclando (brick/olive/teal/mostarda) + halftone no canto
  - `/scanner` — frame com cantos brick + scanline mostarda + overlay tinta vermelha
  - `/perfil` — stats grid 4-cores (olive/brick/teal/mostarda) com halftone radial
- App.tsx faz hidratação local + carga do Firestore + sync com debounce 800 ms ao mutar `album`.

## Onde paramos

- Design system retro Panini commitado em CSS.
- **Modo Preview dev-only** adicionado (2026-05-11) — link "Entrar em modo design (sem login)" na LoginPage (só em `import.meta.env.DEV`) injeta usuário fake (uid `__preview__`) + popula o álbum com seed (40 owned, 8 duplicatas, 3 gastos). App.tsx pula chamadas Firestore quando `user.uid === '__preview__'`.
- Adicionado `src/vite-env.d.ts` com `/// <reference types="vite/client" />` para tipar `import.meta.env`.
- **Organização de figurinhas v1** (2026-05-11) — três melhorias em `AlbumPage.tsx`:
  1. **Filtro de status** (Todas / Tenho / Faltam / Repetidas) numa segunda fileira de chips (`.chips--status`, fundo cream + active olive)
  2. **Progresso por chip** — cada chip de time mostra um `chip-count` mono "12/20", inclusive ALL e FWC
  3. **Agrupamento por Grupo A–L** quando `teamCode === 'ALL'` — cabeçalho `.album-group-head` com nome do grupo + contagem owned/total, separador pontilhado abaixo; FWC vira seção "Especiais" no topo
  - Empty state `.album-empty` quando combinação de filtros não retorna nada.
- **Faltantes drill-down** (2026-05-11) — reescrita `MissingPage.tsx`. Tela agora mostra um **grid de cards por seleção** (`.missing-team-grid` / `.missing-team-card`) com bandeira + código + nome + badge brick "5/20". Click no card → estado `selectedTeam` → mostra `.missing-back-bar` (botão Voltar + título com bandeira + Copiar escopado) + lista detalhada só das figurinhas daquela seleção. FWC aparece como primeiro card se ainda houver especiais faltando. Times completos não aparecem (rows filtradas).

## Para onde vamos (próximas decisões)

Possíveis próximos passos (a confirmar com o usuário):

1. **Testar visualmente** o novo agrupamento + filtros — confirmar que ao escolher ALL, os 12 grupos + Especiais aparecem corretos; testar combinações Status × Time.
2. **Refinos de organização não feitos** (rejeitados ou diferidos):
   - Modo "página de álbum" (rejeitado pelo usuário — "acho exagero")
   - Destaque hosts MEX/CAN/USA com coroa mostarda (não implementado)
   - FWC separado de seleções como aba dedicada (parcialmente feito via agrupamento "Especiais"; ainda ocupa a mesma fileira de chips)
   - Sticky header de grupo ao rolar
   - Trade matching nas Repetidas
3. **Auditoria de acessibilidade** — contraste WCAG, `aria-*`, foco visível em chips/buttons.
4. **Code-split** — bundle JS em ~666 kB minified (warning do Vite). Lazy-load das páginas via `React.lazy`.
5. **Tracker de gastos** — só adiciona, não permite remover/editar nem listar histórico.
6. **Scanner** — `TextDetector` é Chromium-only; fallback (`zxing-js`, `tesseract.js`) ampliaria suporte (iOS Safari).
7. **PWA** — verificar offline real (imagens de `flagUrl` são externas, não entram no precache).

---

## Convenções / decisões registradas

- **CSS único em `globals.css`** — não introduzir CSS modules, Tailwind ou styled-components sem discussão. O design system inteiro vive em variáveis CSS + classes semânticas que os componentes consomem.
- **Nomes de classe são API estável** — qualquer renomeação exige varrer os componentes que as referenciam (todos os arquivos em `features/*`, `components/layout/AppShell.tsx`, `components/ui/Button.tsx`).
- **Fontes via Google Fonts CDN** (`@import` no topo do `globals.css`). Se for ofuscar em produção, mover para `@fontsource` ou self-host.
- **Idioma da UI**: pt-BR.

---

## Histórico

- **2026-05-11** — **Auth Google migrada de popup pra redirect.** Popup era instável em mobile (iOS Safari + ITP, PWA standalone, webviews) e gerava `auth/argument-error` intermitente em algumas contas. `linkOrSignInWithGoogle` agora usa `linkWithRedirect`/`signInWithRedirect`. Novo `resolvePendingGoogleLogin` em `firebase.auth.ts` roda no boot via `AuthObserver` — processa o retorno do Google, faz fallback `signInWithCredential` em `credential-already-in-use`, e silencia erros stale. LoginPage navega pra /album automaticamente quando user vira permanente. Build OK.
- **2026-05-11** — Auth Anonymous-first + Google linking. AuthObserver auto-anônimo, `linkOrSignInWithGoogle` smart (link se anon, sign-in se não), ProfilePage condicional (anon vs Google), LoginPage opcional (label dinâmico, botão "Continuar sem login"). Removido `resolveRedirectLogin()` morto que jogava `auth/argument-error`. Build OK.
- **2026-05-11** — Fix layout missing-team-card: 2-col grid no mobile colapsava a coluna do team-info (`<strong>FWC</strong>` sem overflow handling vazava por baixo do badge brick "20/20"). Mudou pra 1-col default (full-width row tipo lista iOS Settings), 2-col a partir de 520px, 3-col a partir de 820px. Adicionado `overflow: hidden` + `white-space: nowrap` em `.missing-team-info strong` pra blindar. Flag um pouco maior (44×32). Build OK.
- **2026-05-11** — Scanner v2 fullscreen dark UI. ScannerPage.tsx reescrita com camera fullscreen, frame verde grande, top bar com X + status, mode toggle flutuante, helper text destacado, painel Quick mode com switch iOS-style. AppShell.tsx esconde header/nav em `/scanner` via useLocation. Quick mode adicionado: marca direto sem overlay. Substituiu antigas classes `.scanner-head/-view/-modes/-stage/-code-actions` por novas `.scanner-screen/-camera/-top/-icon-btn/-status/-mode-toggle/-helper/-bottom/-quick/-switch/-shoot/-modal-backdrop`. Build OK.
- **2026-05-11** — Escala apertada (v1 do scanner). Reescrita `globals.css` mantendo estética retro Panini mas com tamanhos menores (body 15px, H1 26-32px, H2 22-28px, bottom nav 64px). Sombras de carimbo 4-5px → 3px. Scanner: wrapper `.scanner-stage` + frame absoluto pra fix iOS. Ícones bottom nav 20 → 18.
- **2026-05-11** — Faltantes drill-down: `MissingPage.tsx` reescrita pra grid de cards-por-seleção (bandeira + código + nome + badge "5/20"); click → detalhe com botão Voltar + Copiar escopado àquela seleção. Novas classes: `.missing-team-grid`, `.missing-team-card`, `.missing-team-count`, `.missing-team-info`, `.missing-back-bar`, `.missing-back`, `.missing-back-title`. Build OK.
- **2026-05-11** — Organização de figurinhas v1: filtro de status (4 chips), per-team progress nas chips, agrupamento por Grupo A–L quando ALL selecionado (com Especiais para FWC). Empty state. Mudanças em `AlbumPage.tsx` + novas classes `.chips--status`, `.chip-count`, `.album-group`, `.album-group-head`, `.album-empty`. Build OK.
- **2026-05-11** — Adicionado **modo Preview dev-only**: link na LoginPage (`import.meta.env.DEV` only) que injeta usuário fake `__preview__` + seed do álbum (40 owned, 8 duplicatas, 3 gastos). App.tsx gateia Firestore com `isPreview`. Permite revisão visual de todas as telas sem Google login local. Tipos `import.meta.env` via novo `src/vite-env.d.ts`.
- **2026-05-10** — v1 do design system aplicada: "Estádio à meia-noite × Editorial Panini" (Big Shoulders Display + Hanken Grotesk + JetBrains Mono, base navy + cream nos cards, saffron primary). **Rejeitada** pelo usuário por não seguir a direção retro 70s/80s que havia sido oferecida originalmente.
- **2026-05-10** — v2 (atual): reescrita completa para **"Retro Panini Anos 70/80"** com comprometimento total. Bowlby One (Cooper Black DNA) + Fraunces variável (SOFT/WONK) + Sansita. Paleta mostarda/tijolo/abacate/petróleo/cocoa sobre cream paper. Imperfeições de impressão: misregistro CMYK nos H1/H2, halftone dots via radial-gradient, grão SVG denso, sombras de carimbo (offset sólido sem blur). Detalhes: faixa tricolor no sticker card, carimbo "TENHO" rotacionado, ticket-stubs nos chips, rosette no progress ring, listras de selo postal no login. Build verificado.
