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

## Distribuição

O app não precisa de backend. Para distribuir, publique estes arquivos em qualquer hospedagem estática, como Vercel, GitHub Pages, Netlify ou um servidor local.

Arquivos principais:

- `index.html`: app inteiro;
- `manifest.json`: instalação como PWA;
- `sw.js`: cache offline básico;
- `icon.svg`: ícone do app.
