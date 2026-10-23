import {copyFile, lstat, mkdir, readdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// This prepares a scoped copy. Authentication and the actual GitHub commit
// are performed by the connected GitHub integration or authenticated Git.
const source=path.dirname(fileURLToPath(import.meta.url));
const argument=process.argv[2];
if(!argument||!path.isAbsolute(argument))throw new Error('Informe o caminho absoluto do checkout de destino.');
const repository=await realpath(argument);
const git=await lstat(path.join(repository,'.git')).catch(()=>null);
if(!git)throw new Error('O destino deve ser um checkout Git existente.');
const config=JSON.parse(await readFile(path.join(source,'github-target.json'),'utf8'));
if(!config.folder||config.folder!==path.basename(config.folder)||config.folder.startsWith('.'))throw new Error('Pasta de destino inválida.');
const target=path.resolve(repository,config.folder);
if(!target.startsWith(repository+path.sep)||target===source)throw new Error('O destino deve permanecer dentro do checkout e fora da origem.');
const existing=await lstat(target).catch(()=>null);
if(existing?.isSymbolicLink()||(existing&&!existing.isDirectory()))throw new Error('A pasta de destino não pode ser um link ou arquivo.');
await mkdir(target,{recursive:true});
const files=['README.md','AGENTS.md','OPERACAO.md','image-prompt.txt','preview.mjs','prepare-github.mjs','office.test.mjs','operations.test.mjs','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','vite.config.ts','drizzle.config.ts','cloudflare-env.d.ts'];
async function collect(relative){
  for(const entry of await readdir(path.join(source,relative),{withFileTypes:true})){
    const next=path.join(relative,entry.name);
    if(entry.isSymbolicLink())throw new Error('Links simbólicos não são enviados.');
    if(entry.isDirectory())await collect(next);
    else if(entry.isFile())files.push(next);
  }
}
for(const directory of ['app','db','lib','worker','scripts','vendor','public','drizzle'])await collect(directory);
const records=[];
for(const relative of files){
  const output=path.join(target,relative);
  // Check all existing parent directories before copying into the subtree.
  let parent=path.dirname(output);
  while(parent!==repository){
    const info=await lstat(parent).catch(()=>null);
    if(info?.isSymbolicLink())throw new Error('O destino contém um link simbólico.');
    parent=path.dirname(parent);
  }
  const prior=await lstat(output).catch(()=>null);
  if(prior?.isSymbolicLink())throw new Error('O arquivo de destino é um link simbólico.');
  await mkdir(path.dirname(output),{recursive:true});
  await copyFile(path.join(source,relative),output);
  const content=await readFile(output);
  records.push({path:relative.split(path.sep).join('/'),bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')});
}
const publicConfig={repository:config.repository,branch:config.branch,folder:config.folder,source_repository:config.source_repository,mode:'sync-after-authorized-task'};
await writeFile(path.join(target,'github-target.json'),JSON.stringify(publicConfig,null,2)+'\n');
await writeFile(path.join(target,'.gitignore'),'node_modules/\n.openai/\n.env\n.env.*\n!.env.example\n.dev.vars*\n.office-runtime/\n.wrangler/\n.vinext/\n.next/\ndist/\n*.tsbuildinfo\n.sites-runtime/\nqa/\n*.tar\n*.tar.gz\n');
console.log(JSON.stringify({target,repository:config.repository,branch:config.branch,folder:config.folder,files:records},null,2));
