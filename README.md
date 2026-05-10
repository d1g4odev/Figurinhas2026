# Figurinhas Copa 2026

Web app local para controlar um álbum de figurinhas da Copa 2026.

## Como usar localmente

Opção simples:

1. Baixe ou clone este projeto.
2. Abra `index.html` no navegador.

Opção recomendada, com PWA e service worker:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Depois acesse:

```text
http://127.0.0.1:4173/index.html
```

## Dados

Tudo fica salvo no navegador, via `localStorage`.

O álbum está modelado com 980 figurinhas:

- 20 especiais de abertura (`FWC 00` a `FWC 19`);
- 960 das seleções (`48 seleções x 20 figurinhas`).

Use `Configurações` para:

- editar nome, usuário, bio e foto de perfil;
- exportar backup em JSON;
- importar backup;
- resetar dados locais.

## Firebase

O app inicializa Firebase pelo SDK Web modular via CDN, sem build step.

Serviços preparados no frontend:

- Firebase Analytics;
- Firebase Authentication;
- Cloud Firestore;
- Realtime Database.

As instâncias ficam disponíveis em `window.FigurinhasFirebase` para a próxima etapa de login e sincronização dos dados.

Em desenvolvimento local, o Analytics não é iniciado para evitar erros de rede no navegador; ele fica pronto para ativar em HTTPS.

Estrutura criada no Firestore após login:

- `users/{uid}`: dados da conta Google;
- `users/{uid}/albums/default`: estado completo do álbum e resumo;
- `users/{uid}/albums/default/stickers/{stickerId}`: estado por figurinha;
- `users/{uid}/albums/default/history/log`: histórico de trocas;
- `users/{uid}/albums/default/spending/log`: gastos registrados.

Regras recomendadas para Firestore:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Distribuição

O app não precisa de backend. Para distribuir, publique estes arquivos em qualquer hospedagem estática, como Vercel, GitHub Pages, Netlify ou um servidor local.

Arquivos principais:

- `index.html`: app inteiro;
- `manifest.json`: instalação como PWA;
- `sw.js`: cache offline básico;
- `icon.svg`: ícone do app.
