# Connect Promo · Escritório Virtual

Escritório isométrico com seis ambientes, identidade visual da Connect Promo e personagens em movimento. A aba **Atividade** apresenta registros reais e agregados das rotinas do Codex: consultas à caixa postal, respostas confirmadas, apresentações, contatos verificados e verificações do site.

## Funcionamento

O Codex executa o trabalho com a conexão nativa da Hostinger. O servidor do site recebe somente função, código de ação, estado, contagem e horário. O histórico público não contém mensagens, destinatários, anexos ou credenciais. A animação representa a circulação no escritório; o histórico informa o trabalho efetivamente registrado. O site não abre sessões da Hostinger nem acessa a caixa postal por conta própria.

O usuário autorizou responder clientes e enviar até cinco apresentações por dia a novos contatos comerciais públicos. O limite usa o dia de Brasília e inclui apresentações enviadas fora da rotina. Os procedimentos para checar duplicidade, descadastros, confirmar envios e suspender ações incertas estão em `OPERACAO.md`.

As rotinas recorrentes são configuradas no Codex, separadamente da hospedagem, e dependem da disponibilidade do Codex e das conexões. Copiar o projeto não cria rotinas nem fornece acesso a contas. Esta operação usa os recursos de IA do Codex; não exige uma chave separada da API da OpenAI. Não há contratação, pagamento ou decisão de investimento automática.

## Ferramentas do escritório

- Recepção, diretoria do Yuri, equipe, reunião, jogos e showroom navegáveis.
- Sete funções virtuais, sem inventar pessoas contratadas.
- Movimento opcional, respeitando a preferência inicial por movimento reduzido.
- Histórico no servidor, atualizado na tela a cada 30 segundos, com falhas de consulta visíveis.
- Cadastro de equipe, tarefas, notas e pautas manuais guardados no navegador.
- Reunião das 15h de Brasília, pauta exportável e agenda .ics; o briefing recorrente permanece na conversa do Codex.
- Uniformes originais, download do logo, tour e jogo da memória.

As tarefas manuais não são uma fila de execução automática. Pausar uma função no cadastro não pausa uma rotina do Codex; as rotinas devem ser gerenciadas na conversa. Dados locais não são compartilhados entre dispositivos e não são enviados ao GitHub. Finanças e contratações precisam de dados reais e decisões do usuário.

## Fonte e execução local

Node.js 22.13 ou superior. Instale com `npm run install:ci`, compile com `npm run build` e use `npm start` para a prévia completa do Worker. A identidade do site e o vínculo D1 são mantidos pela habilidade Sites em `.openai/hosting.json`, configuração privada não distribuída no GitHub. Em uma cópia, configure uma hospedagem própria seguindo Sites antes de executar o servidor; nunca reutilize credenciais de outra conta.

`public/` contém a interface; `app/` encaminha a entrada; `worker/office.ts` implementa a API; `lib/office-policy.mjs` valida os registros; `db/` e `drizzle/` definem o banco. O build usa Vinext e Cloudflare Workers. `dist/` é saída gerada. Para consultar só o visual, sem histórico de servidor, execute `node preview.mjs` e abra http://127.0.0.1:4321.

O segredo `OFFICE_RUNNER_TOKEN` existe somente no ambiente de hospedagem e na configuração local ignorada `.office-runtime/config.json`. O helper `scripts/office-bridge.mjs` envia registros à origem fixa do escritório. Reservas de execução impedem duas rotinas deste escritório de enviar mensagens simultaneamente. O limite comercial também é verificado na própria caixa postal, imediatamente antes de cada envio.

## Verificações

`npm test` cobre validação de eventos, rejeição de campos privados, horário de Brasília, expiração de estado e regras das tarefas. `node scripts/check-office-api.mjs http://127.0.0.1:4324` verifica autenticação, idempotência e reservas concorrentes em uma prévia local com banco de teste e o token fictício documentado no script. Esse teste recusa origens de produção. As migrações de produção criam apenas a estrutura, nunca importam os dados de teste.

## Imagens e publicação

`public/assets/logo.jpeg` e `uniform-*.jpeg` são os materiais fornecidos pelo usuário. `office.png` é a imagem gerada para a empresa; seu prompt está em `image-prompt.txt`. Os PDFs de referência não são redistribuídos. O conceito inicial de escritório de agentes foi indicado em https://github.com/a2labsnutrition/Escritorio-de-agentes.

O destino autorizado está em `github-target.json`. `node prepare-github.mjs <checkout-absoluto>` prepara uma cópia restrita à pasta do escritório. Cada alteração verificada deve ser enviada ao GitHub conforme `AGENTS.md`; não há sincronização permanente de arquivos. A publicação no Sites é separada e preserva a identidade e a audiência existentes.
