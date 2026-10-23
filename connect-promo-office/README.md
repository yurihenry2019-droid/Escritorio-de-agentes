# Connect Promo · Escritório Virtual

Escritório isométrico navegável com a identidade visual fornecida pela Connect Promo.

- Seis ambientes clicáveis e tour guiado.
- Cadastro e edição de equipe, registros de reuniões e exportação das notas.
- Showroom com frente e costas do uniforme e download do logo original.
- Jogo da memória na sala de descompressão.
- Layout responsivo, navegação por teclado e preferência por movimento reduzido.

## Uso local

Com Node.js disponível, execute `node preview.mjs` e abra `http://127.0.0.1:4321`.
O conteúdo publicado está em `dist/`, sem dependências de compilação.

## Dados e escopo

Os cadastros ficam no localStorage do navegador. Não existe autenticação própria, banco de dados compartilhado, envio de convites, videoconferência nem execução de agentes de IA nesta versão. O controle de acesso da hospedagem é fornecido pelo Sites. Os personagens na ilustração não representam os cadastros reais. O site não contém dados de equipe inventados; apenas Yuri foi incluído conforme o pedido.

O conceito de escritório de agentes foi indicado pelo usuário com a referência https://github.com/a2labsnutrition/Escritorio-de-agentes . Esta implementação visual é independente, sem copiar ou executar o servidor local desse projeto.

## Imagens

`dist/assets/logo.jpeg` e `uniform-*.jpeg` são as imagens originais fornecidas. `office.png` foi editada com o gerador de imagens integrado para incorporar a marca e o uniforme. O prompt da edição está em `image-prompt.txt`.

## Atualizações no GitHub

O destino fica registrado em `github-target.json`. O usuário autorizou enviar as próximas alterações deste escritório ao concluir cada tarefa. As instruções de manutenção estão em `AGENTS.md`.

Quando os arquivos forem editados fora do checkout GitHub, `node prepare-github.mjs <caminho-absoluto-do-checkout>` prepara a pasta `connect-promo-office` com a aplicação e seus recursos. O envio deve ser feito pela integração GitHub conectada ou por Git autenticado, em um commit limitado a essa pasta.

Não há sincronização contínua em segundo plano. Os registros de equipe e reuniões permanecem no navegador e não são enviados ao GitHub. A publicação do site no Sites é um processo separado do envio do código.
