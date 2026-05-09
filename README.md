# WebSunny

Assistente web com personagem (**Sunny**) feito em **Next.js** (TypeScript) e **Tailwind CSS**. O utilizador escreve mensagens no browser; o servidor chama a API da **Groq** (modo JSON), valida a resposta e a UI mostra apenas o texto do assistente.

## Requisitos

- [Node.js](https://nodejs.org/) 20 ou superior (recomendado)
- Conta na [Groq Console](https://console.groq.com/) com uma API key

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Crie o ficheiro de ambiente local a partir do exemplo:

   ```bash
   cp .env.example .env.local
   ```

   No Windows (PowerShell), pode usar:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Edite `.env.local` e defina:

   - **`GROQ_API_KEY`** — obrigatório ([criar chave](https://console.groq.com/keys))
   - **`GROQ_MODEL`** — opcional; por omissão usa `llama-3.3-70b-versatile`

## Como correr

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Envie mensagens com **Enter**; **Shift+Enter** insere nova linha.

### Produção (local)

```bash
npm run build
npm start
```

A aplicação fica disponível na porta por omissão do Next.js (geralmente `3000`).

### Lint

```bash
npm run lint
```

## Deploy na Vercel

1. Ligue o repositório ao projeto na [Vercel](https://vercel.com/).
2. Em **Project → Settings → Environment Variables**, adicione **`GROQ_API_KEY`** (e opcionalmente **`GROQ_MODEL`**) para **Production** e **Preview**.
3. Faça deploy; não exponha a API key no cliente — só variáveis de ambiente no servidor.

## Estrutura relevante

| Caminho | Descrição |
|---------|-----------|
| `app/page.tsx` | Página principal com o chat |
| `app/api/chat/route.ts` | `POST` que fala com a Groq e devolve `{ "reply": "..." }` |
| `lib/groq.ts` | Cliente OpenAI-compatível (base URL Groq) e prompt do personagem |
| `components/` | Painel do personagem, lista de mensagens e lógica do chat |

## Licença

Projeto privado — veja o repositório para detalhes.
