# Manutenção do escritório Connect Promo

## Pedido permanente do usuário

Depois de concluir e verificar cada alteração solicitada neste escritório, envie os arquivos atualizados à pasta do GitHub indicada em `github-target.json`. O usuário autorizou guardar tanto o estado atual quanto as próximas atualizações. Não é necessário pedir novamente autorização para os envios dentro desse escopo.

O envio acontece ao concluir cada tarefa. Não existe monitoramento de arquivos nem serviço de sincronização em segundo plano.

## Fluxo

1. Leia `github-target.json` para obter o repositório, a branch, a pasta e o estado do envio. Preserve o destino confirmado. Não escreva no repositório de referência sem permissão.
2. Leia as instruções do checkout de destino, obtenha o HEAD atual e preserve as alterações de outras pessoas.
3. Leia `OPERACAO.md` antes de executar trabalho real. Valide as mudanças relevantes com `npm test`, `node --check public/app.js`, `node --check public/activity.js` e o build do Sites. Verifique as interações afetadas no navegador. O teste de API `node scripts/check-office-api.mjs http://127.0.0.1:PORTA` aceita apenas ambiente local e usa dados fictícios; nunca leve seu banco local à produção.
4. Quando a fonte estiver fora do checkout GitHub, execute `node prepare-github.mjs <caminho-absoluto-do-checkout>` para preparar a pasta de destino. Se a fonte já for a pasta do escritório nesse checkout, trabalhe nela diretamente e pule a cópia. O script copia somente a aplicação, imagens, documentação e instruções de manutenção. A configuração privada da hospedagem e credenciais não fazem parte do envio.
5. Use a integração GitHub para enviar um commit contendo somente a pasta do escritório. Como alternativa, use Git autenticado. Não faça force push. Se houver novas alterações remotas, reconcilie-as antes de atualizar a branch.
6. Confirme no GitHub que o commit e os arquivos existem. Atualize `github-target.json` localmente com o SHA confirmado e informe o link ao usuário.
7. Atualizações do site hospedado continuam seguindo a habilidade Sites e a identidade existente em `.openai/hosting.json`. Um commit no GitHub não republica automaticamente o site.

## Preservação

- Mantenha o logo e as referências de uniforme enviados pelo usuário.
- Não envie `.git`, `.openai`, arquivos `.env`, `.dev.vars`, `.office-runtime`, `.wrangler`, tokens, históricos privados, cadastros de pessoas, dados do navegador, arquivos temporários ou diretórios externos ao projeto. O GitHub recebe o código de `public`, `app`, `worker`, `lib`, `db`, `drizzle`, `scripts` e `vendor`; `dist` é gerado e não vai ao GitHub.
- Nunca substitua arquivos de outros projetos ou o conteúdo original do repositório de referência.
- Caso a tarefa remova um arquivo anteriormente enviado, remova somente esse caminho específico da pasta remota, após confirmar que faz parte da alteração solicitada.
