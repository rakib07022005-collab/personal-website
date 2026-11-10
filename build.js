const fs=require('fs'),path=require('path'),out='dist';
fs.rmSync(out,{recursive:true,force:true});
function cp(f,to){const t=path.join(out,to);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(f,t);}
cp('index.html','index.html');cp('admin.html','admin/index.html');cp('config.yml','admin/config.yml');
for(const f of fs.readdirSync('.'))if(/\.(jpe?g|png|webp|gif)$/i.test(f))cp(f,'uploads/'+f);
function copyDir(src){if(!fs.existsSync(src))return;for(const e of fs.readdirSync(src,{withFileTypes:true})){const s=path.join(src,e.name);if(e.isDirectory())copyDir(s);else if(e.name!=='.gitkeep')cp(s,s);}}
copyDir('uploads');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inl=s=>s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,'<img class="zoom" src="$2" alt="$1">').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g,'$1<em>$2</em>').replace(/~~([^~]+)~~/g,'<del>$1</del>');
const HR=/^ {0,3}([-*_])( *\1){2,} *$/,HD=/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,UL=/^\s*[-*+]\s+/,OL=/^\s*\d+[.)]\s+/,BQ=/^\s*>/,FN=/^\s*```/;
const isBlock=l=>HR.test(l)||HD.test(l)||UL.test(l)||OL.test(l)||BQ.test(l)||FN.test(l);
function md(src){const L=src.replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0,m;
while(i<L.length){const l=L[i];
if(/^\s*$/.test(l)){i++;continue}
if(FN.test(l)){const b=[];i++;while(i<L.length&&!FN.test(L[i]))b.push(L[i++]);i++;out.push('<pre><code>'+esc(b.join('\n'))+'</code></pre>');continue}
if(HR.test(l)){out.push('<hr>');i++;continue}
if(m=HD.exec(l)){out.push(`<h${m[1].length}>${inl(esc(m[2]))}</h${m[1].length}>`);i++;continue}
if(BQ.test(l)){const b=[];while(i<L.length&&BQ.test(L[i]))b.push(L[i++].replace(/^\s*>\s?/,''));out.push('<blockquote>'+md(b.join('\n'))+'</blockquote>');continue}
if(UL.test(l)){const it=[];while(i<L.length&&UL.test(L[i]))it.push('<li>'+inl(esc(L[i++].replace(UL,'')))+'</li>');out.push('<ul>'+it.join('')+'</ul>');continue}
if(OL.test(l)){const it=[];while(i<L.length&&OL.test(L[i]))it.push('<li>'+inl(esc(L[i++].replace(OL,'')))+'</li>');out.push('<ol>'+it.join('')+'</ol>');continue}
const b=[];while(i<L.length&&!/^\s*$/.test(L[i])&&(b.length===0||!isBlock(L[i])))b.push(L[i++]);
out.push('<p>'+inl(esc(b.join('\n'))).replace(/\n/g,'<br>')+'</p>')}
return out.join('\n')}
function parse(t){const m=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(t),d={};if(!m)return{d,body:t};
m[1].split(/\r?\n/).forEach(l=>{const i=l.indexOf(':');if(i>0)d[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'')});return{d,body:m[2]}}
const files=[];
for(const f of fs.readdirSync('.'))if(/^post-.*\.md$/.test(f))files.push(f);
if(fs.existsSync('content/posts'))for(const f of fs.readdirSync('content/posts'))if(f.endsWith('.md'))files.push('content/posts/'+f);
const posts=files.map(f=>{const{d,body}=parse(fs.readFileSync(f,'utf8'));return{title:d.title||'Untitled',date:d.date||'',category:d.category||'Other',image:d.image||'',body:md(body)}}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const read=(f,k)=>fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8'))[k]||[]:[];
fs.writeFileSync(path.join(out,'posts.json'),JSON.stringify({categories:read('categories.json','categories').map(c=>c.name),stats:read('stats.json','stats'),posts}));
console.log('built',posts.length,'posts');
