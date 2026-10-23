# Connect Promo · Escritório Virtual

Escritório isométrico navegável com a identidade visual fornecida pela Connect Promo.

- Seis ambientes clicáveis e tour guiado.
- Cadastro e edição de equipe, registros de reuniões e exportação das notas.
- Showroom com frente e costas do uniforme e download do logo original.
- Jogo da memória na sala de descompressão.
- Layout responsivo, navegação por teclado e preferência por movimento reduzido.
- Sete sistemas de trabalho por função virtual, com tarefas, prioridade, prazo, situação e resultado.
- Reunião diária às 15h de Brasília, pauta e exportação de agenda recorrente (.ics).

## Funções e reunião diária

Gerência/operações, marketing, comercial/prospecção, e-mail comercial, atendimento, financeiro e evolução do site têm missões, etapas de trabalho e entregas próprias. São funções virtuais escolhidas pelo usuário, não cadastros de pessoas reais contratadas. Pausar uma função impede novas atribuições e preserva suas tarefas. Uma tarefa só pode ser concluída com o resultado registrado.

A pauta diária cobre melhorias, prioridades, investimentos, necessidade de contratação e retornos comerciais. O compromisso das 15h aparece na sala de reunião; a agenda pode ser importada em um calendário. O briefing automático foi configurado separadamente na conversa do Codex, com execução diária às 15h no horário local de São Paulo. O site não consulta o estado dessa automação nem recebe seus relatórios automaticamente. Copiar o projeto para outra conta não cria a automação.

O botão “Baixar pauta” exporta as tarefas deste navegador para compartilhar na conversa. Os textos de trabalho são adaptações originais dos conceitos dos materiais de referência fornecidos pelo usuário; os PDFs não são redistribuídos no repositório.

## Uso local

Com Node.js disponível, execute `node preview.mjs` e abra `http://127.0.0.1:4321`.
O conteúdo publicado está em `dist/`, sem dependências de compilação.

## Dados e escopo

Os cadastros e tarefas ficam no localStorage do navegador, separados por origem. Não existe autenticação própria, banco de dados compartilhado, envio de convites, videoconferência nem execução de agentes de IA dentro do site nesta versão. A configuração segura da chave de IA foi iniciada, mas ainda depende da conclusão do fluxo pelo usuário. Não há chamadas de IA, e-mail, pagamento, contratação ou publicação disparadas pelos botões de tarefas. O controle de acesso da hospedagem é fornecido pelo Sites. Os personagens na ilustração não representam os cadastros reais; apenas Yuri foi incluído no cadastro de pessoas conforme o pedido.

Valide as regras com `node --test operations.test.cjs`, além de `node --check dist/app.js` e `node --check dist/operations.js`. O teste usa dados fictícios e não altera cadastros do navegador.

O conceito de escritório de agentes foi indicado pelo usuário com a referência https://github.com/a2labsnutrition/Escritorio-de-agentes . Esta implementação visual é independente, sem copiar ou executar o servidor local desse projeto.

## Imagens

`dist/assets/logo.jpeg` e `uniform-*.jpeg` são as imagens originais fornecidas. `office.png` foi editada com o gerador de imagens integrado para incorporar a marca e o uniforme. O prompt da edição está em `image-prompt.txt`.

## Atualizações no GitHub

O destino fica registrado em `github-target.json`. O usuário autorizou enviar as próximas alterações deste escritório ao concluir cada tarefa. As instruções de manutenção estão em `AGENTS.md`.

Quando os arquivos forem editados fora do checkout GitHub, `node prepare-github.mjs <caminho-absoluto-do-checkout>` prepara a pasta `connect-promo-office` com a aplicação e seus recursos. O envio deve ser feito pela integração GitHub conectada ou por Git autenticado, em um commit limitado a essa pasta.

Não há sincronização contínua em segundo plano. Os registros de equipe e reuniões permanecem no navegador e não são enviados ao GitHub. A publicação do site no Sites é um processo separado do envio do código.
