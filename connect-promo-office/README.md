# Connect Promo · Escritório Virtual

Escritório isométrico desenhado e animado em Canvas, com seis ambientes, móveis independentes e oito personagens controláveis (Yuri e sete funções virtuais). A cena não usa a antiga ilustração como fundo. A aba **Atividade** apresenta registros reais e agregados das rotinas do Codex: consultas à caixa postal, respostas confirmadas, apresentações, contatos verificados e verificações do site.

O escritório funciona como uma sala de jogo isométrica, com avatares originais em pixel art, câmera próxima que acompanha o personagem e oito personagens com animações direcionais. Clique no chão para andar, em um personagem para controlá-lo ou em um móvel para usá-lo. Cadeiras e sofás permitem sentar; computadores, fliperamas e totó têm interação visual. As setas também movimentam o personagem quando o ambiente está focado.

Use **Acenar**, **Dançar**, **Sentar** e o campo **Falar** para exibir um balão local. Os balões não são enviados a pessoas nem são conversas com IA. **Reunir equipe** encaminha os oito personagens para os assentos da reunião, sem disparar o briefing real. A equipe circula, usa móveis e faz pausas automaticamente ao entrar; o controle **Movimento** permite pausar. **Ver todo o andar** mostra o mapa completo e **Seguir meu personagem** retoma a câmera próxima. Arraste para explorar e use +/− para ajustar o zoom. **Abrir sala** acessa as ferramentas existentes.

## Funcionamento

O Codex executa o trabalho com a conexão nativa da Hostinger. O servidor do site recebe somente função, código de ação, estado, contagem e horário. O histórico público não contém mensagens, destinatários, anexos ou credenciais. A animação representa a circulação no escritório; o histórico informa o trabalho efetivamente registrado. O site não abre sessões da Hostinger nem acessa a caixa postal por conta própria.

O usuário ampliou a meta para **100 novas apresentações por dia**, com teto de 100 e até dez por execução horária em todos os dias, incluindo noites e fins de semana. O dia é o de Brasília e inclui apresentações enviadas fora da rotina. A rotina também respeita o aceite dos destinatários exigido pela Hostinger e sua cota móvel de 24 horas; enquanto o plano não estiver confirmado, considera no máximo 100 mensagens de saída no total nesse período. A meta não é garantia de envio. Os procedimentos para verificar elegibilidade, duplicidade, descadastros e confirmar cada mensagem estão em `OPERACAO.md`.

As rotinas recorrentes são configuradas no Codex, separadamente da hospedagem: comercial a cada hora, marketing e financeiro a cada quatro horas, manutenção a cada duas horas e briefing diário às 15h de Brasília. Todas incluem noites e fins de semana. As execuções locais exigem computador ligado, Codex aberto e conexões disponíveis. A migração descrita abaixo permite execução hospedada; o controle privado e o painel indicam o executor realmente configurado para cada função. A página do escritório pode ficar fechada. Copiar o projeto não cria rotinas nem fornece acesso a contas. Esta operação usa os recursos de IA do Codex; não exige uma chave separada da API da OpenAI. Não há contratação, pagamento ou decisão de investimento automática.

## Continuidade na nuvem

O endpoint `/mcp` oferece ferramentas privadas ao proprietário autenticado pelo Sites. `OFFICE_OWNER_EMAIL`, configurado como segredo de ambiente, limita o acesso; visitantes do escritório público não recebem documentos. `office_documents` guarda relatórios, checkpoints e recibos privados com controle de versão. Nada disso é incluído no GitHub ou no histórico público.

As ferramentas `office_instructions`, `office_read`, `office_write`, `office_lease` e `office_event` permitem uma execução hospedada sem arquivos locais. O documento privado `system/control` define o executor de cada função. O padrão permanece `local`; só se muda para `cloud` depois de importar o progresso, confirmar acesso do proprietário e da Hostinger em uma execução hospedada e verificar o agendamento. A troca bloqueia reservas do executor anterior. Configurar a infraestrutura ou salvar um agendamento não comprova trabalho executado. `office_probe` testa somente a conexão, sem contar como atividade comercial.

As instruções duráveis ficam em `lib/cloud-instructions.mjs`, disponíveis exclusivamente pela ferramenta autenticada. A publicação mantém a audiência do escritório. Nem o Worker nem o navegador recebem credenciais da Hostinger: os agentes usam a conexão nativa autorizada. As rotinas locais devem ser pausadas após a migração confirmada; não executar ambas como alternativas simultâneas. O relatório local já aberto pode ficar desatualizado após a migração: consulte os documentos privados pela conexão do escritório.

## Ferramentas do escritório

- Recepção, diretoria do Yuri, equipe, reunião, jogos e showroom navegáveis.
- Sete funções virtuais, sem inventar pessoas contratadas.
- Movimento iniciado ao entrar, com pausa explícita que permanece durante a navegação nesta visita.
- Histórico no servidor, atualizado na tela a cada 30 segundos, com falhas de consulta visíveis.
- Cadastro de equipe, tarefas, notas e pautas manuais guardados no navegador.
- Reunião das 15h de Brasília, pauta exportável e agenda .ics; o briefing recorrente permanece na conversa do Codex.
- Uniformes originais, download do logo, tour e jogo da memória.

As tarefas manuais não são uma fila de execução automática. Pausar uma função no cadastro não pausa uma rotina do Codex; as rotinas devem ser gerenciadas na conversa. Dados locais não são compartilhados entre dispositivos e não são enviados ao GitHub. O financeiro consulta os e-mails da Hostinger e mantém relatórios e pendências em `.office-runtime/finance/`; marketing mantém conteúdos e planos em `.office-runtime/marketing/`. Valores e documentos não entram no site público nem no GitHub. Propostas não são tratadas como receitas, e ausência de documentos não significa saldo zero. Contratações e movimentação de dinheiro continuam dependendo do usuário.

## Fonte e execução local

Node.js 22.13 ou superior. Instale com `npm run install:ci`, compile com `npm run build` e use `npm start` para a prévia completa do Worker. A identidade do site e o vínculo D1 são mantidos pela habilidade Sites em `.openai/hosting.json`, configuração privada não distribuída no GitHub. Em uma cópia, configure uma hospedagem própria seguindo Sites antes de executar o servidor; nunca reutilize credenciais de outra conta.

`public/` contém a interface; `office-world.js` define salas, obstáculos, projeção e caminhos; `office-scene.js` desenha os elementos e processa interação e movimento. `app/` encaminha a entrada; `worker/office.ts` implementa a API; `lib/office-policy.mjs` valida os registros; `db/` e `drizzle/` definem o banco. O build usa Vinext e Cloudflare Workers. `dist/` é saída gerada. Para consultar só o visual, sem histórico de servidor, execute `node preview.mjs` e abra http://127.0.0.1:4321.

O segredo `OFFICE_RUNNER_TOKEN` existe somente no ambiente de hospedagem e na configuração local ignorada `.office-runtime/config.json`. O helper `scripts/office-bridge.mjs` envia registros à origem fixa do escritório. Reservas de execução impedem duas rotinas deste escritório de enviar mensagens simultaneamente. O limite comercial também é verificado na própria caixa postal, imediatamente antes de cada envio.

## Verificações

`npm test` cobre validação de eventos, rejeição de campos privados, horário de Brasília, expiração de estado e regras das tarefas. `node scripts/check-office-api.mjs http://127.0.0.1:4324` verifica autenticação, idempotência e reservas concorrentes em uma prévia local com banco de teste e o token fictício documentado no script. Esse teste recusa origens de produção. As migrações de produção criam apenas a estrutura, nunca importam os dados de teste.

## Imagens e publicação

`public/assets/logo.jpeg` e `uniform-*.jpeg` são os materiais fornecidos pelo usuário. `office.png` é a imagem gerada para a empresa; seu prompt está em `image-prompt.txt`. Os PDFs de referência não são redistribuídos. O conceito inicial de escritório de agentes foi indicado em https://github.com/a2labsnutrition/Escritorio-de-agentes.

O destino autorizado está em `github-target.json`. `node prepare-github.mjs <checkout-absoluto>` prepara uma cópia restrita à pasta do escritório. Cada alteração verificada deve ser enviada ao GitHub conforme `AGENTS.md`; não há sincronização permanente de arquivos. A publicação no Sites é separada e preserva a identidade e a audiência existentes.
