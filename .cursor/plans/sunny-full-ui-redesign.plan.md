---
name: Sunny UI redesign from scratch
overview: Redesenhar completamente a UI do chat mantendo todas as funcionalidades atuais e o avatar animado da Sunny; cores, tipografia e layout são livres até escolha do utilizador.
todos:
  - id: pick-concept
    content: Utilizador escolhe uma das propostas de UI — escolhido **C Glass dock** (mock refinado v2)
  - id: implement-shell
    content: Implementar novo shell de página (layout, tokens visuais, componentes)
    dependencies:
      - pick-concept
  - id: wire-features
    content: Reintegrar ChatAssistant (STT, TTS, API, animações) sem regressões
    dependencies:
      - implement-shell
---

# Redesign completo da UI — Sunny Web Chat

## Escopo (clarificado pelo utilizador)

- **Redesign do zero**: layout, cores, tipografia e componentes podem mudar por completo.
- **Manter obrigatoriamente:**
  - Todas as **funcionalidades** do fluxo atual (ver checklist abaixo).
  - **Avatar da Sunny** (animação Lottie / personagem visível — integração técnica mantém-se; apresentação visual muda).

## Checklist de funcionalidades a preservar

Fonte: [`components/ChatAssistant.tsx`](../../components/ChatAssistant.tsx), [`components/ChatThread.tsx`](../../components/ChatThread.tsx), [`components/CharacterPanel.tsx`](../../components/CharacterPanel.tsx).

| Área | Comportamento |
|------|----------------|
| Chat | Histórico utilizador/assistente, envio para `/api/chat`, loading "Pensando…", mensagens de erro |
| Voz TTS | Checkbox "Voz da Sunny" quando suportado; reprodução ao receber resposta; botão "Ouvir de novo" nas mensagens da Sunny |
| Entrada | Textarea; Enter envia, Shift+Enter nova linha; botão Enviar |
| Microfone / STT | Botão conversa por voz; modo pausa envia; estado a ouvir / parar |
| Idioma STT | Select "Idioma do microfone" + texto de ajuda; persistência `localStorage` |
| Permissões | Aviso quando microfone indisponível mas browser suporta reconhecimento |
| Personagem | Idle + reações à animação devolvida pela API |

## Propostas de nova UI (conceitos)

Mocks de referência (copiados para o repositório):

- **A — Palco:** [`assets/mock-ui-proposta-a-palco-sunny.png`](../../assets/mock-ui-proposta-a-palco-sunny.png)
- **B — Inbox minimal:** [`assets/mock-ui-proposta-b-inbox-minimal.png`](../../assets/mock-ui-proposta-b-inbox-minimal.png)
- **C — Glass dock (refinado):** [`assets/mock-ui-proposta-c-glass-dock-v2.png`](../../assets/mock-ui-proposta-c-glass-dock-v2.png) — primeira versão legada [`mock-ui-proposta-c-glass-dock.png`](../../assets/mock-ui-proposta-c-glass-dock.png)

### Proposta A — "Palco Sunny"

- **Ideia:** Metade superior da app é um **palco** dedicado ao avatar (sem cobrir o input); metade inferior é conversa + composer fixo.
- **Prós:** Avatar grande e legível; zona de polegar sempre limpa; hierarquia óbvia em mobile.
- **Contras:** Menos área vertical para mensagens num só ecrã.

### Proposta B — "Inbox minimal"

- **Ideia:** Estilo app de mensagens moderna: **barra superior** com avatar circular pequeno + nome "Sunny", lista de bolhas com scroll, **barra inferior** com campo + mic + enviar.
- **Prós:** Familiar para utilizadores de WhatsApp/Telegram; máximo espaço para texto da conversa.
- **Contras:** Avatar menor no topo (expressividade da animação mais discreta).

### Proposta C — "Glass dock"

- **Ideia:** Fundo em gradiente ou textura suave; mensagens em cartões **glassmorphism**; avatar num **dock** acima do teclado de input (sem overlay sobre botões).
- **Prós:** Aspeto distinto e "produto SaaS"; avatar visível mas contido num bloco próprio.
- **Contras:** Mais trabalho visual e contraste em tema claro/escuro.

## Próximo passo

Após escolha da proposta (ou híbrido), implementação em `ChatAssistant`, `ChatThread`, `CharacterPanel`, `app/page.tsx` e estilos globais conforme necessário.
