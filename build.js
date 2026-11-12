const fs=require('fs'),path=require('path'),out='dist';
fs.rmSync(out,{recursive:true,force:true});
function cp(f,to){const t=path.join(out,to);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(f,t);}
cp('index.html','index.html');cp('admin.html','admin/index.html');cp('config.yml','admin/config.yml');
for(const f of fs.readdirSync('.'))if(/\.(jpe?g|png|webp|gif)$/i.test(f))cp(f,'uploads/'+f);
function copyDir(src){if(!fs.existsSync(src))return;for(const e of fs.readdirSync(src,{withFileTypes:true})){const s=path.join(src,e.name);if(e.isDirectory())copyDir(s);else if(e.name!=='.gitkeep')cp(s,s);}}
copyDir('uploads');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inl=s=>s.replace(/&lt;(\/?)(u|mark|sup|sub)&gt;/g,'<$1$2>').replace(/&lt;span style=&quot;((?:color|background-color):\s*[#\w(),.% -]+?);?&quot;&gt;/g,'<span style="$1">').replace(/&lt;\/span&gt;/g,'</span>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,'<img class="zoom" src="$2" alt="$1">').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g,'$1<em>$2</em>').replace(/~~([^~]+)~~/g,'<del>$1</del>');
const HR=/^ {0,3}([-*_])( *\1){2,} *$/,HD=/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,UL=/^\s*[-*+]\s+/,OL=/^\s*\d+[.)]\s+/,BQ=/^\s*>/,FN=/^\s*```/;
const isBlock=l=>/^:::/.test(l)||HR.test(l)||HD.test(l)||UL.test(l)||OL.test(l)||BQ.test(l)||FN.test(l);
function md(src){const L=src.replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0,m;
while(i<L.length){const l=L[i];
if(/^\s*$/.test(l)){i++;continue}
if(FN.test(l)){const b=[];i++;while(i<L.length&&!FN.test(L[i]))b.push(L[i++]);i++;out.push('<pre><code>'+esc(b.join('\n'))+'</code></pre>');continue}
if(m=/^:::\s*(center|right|left|justify)\s*$/.exec(l)){const q=[];i++;while(i<L.length&&!/^:::\s*$/.test(L[i]))q.push(L[i++]);i++;out.push(`<div style="text-align:${m[1]}">`+md(q.join('\n'))+'</div>');continue}
if(HR.test(l)){out.push('<hr>');i++;continue}
if(m=HD.exec(l)){out.push(`<h${m[1].length}>${inl(esc(m[2]))}</h${m[1].length}>`);i++;continue}
if(BQ.test(l)){const b=[];while(i<L.length&&BQ.test(L[i]))b.push(L[i++].replace(/^\s*>\s?/,''));out.push('<blockquote>'+md(b.join('\n'))+'</blockquote>');continue}
if(UL.test(l)){const it=[];while(i<L.length&&UL.test(L[i]))it.push('<li>'+inl(esc(L[i++].replace(UL,'')))+'</li>');out.push('<ul>'+it.join('')+'</ul>');continue}
if(OL.test(l)){const it=[];while(i<L.length&&OL.test(L[i]))it.push('<li>'+inl(esc(L[i++].replace(OL,'')))+'</li>');out.push('<ol>'+it.join('')+'</ol>');continue}
const b=[];while(i<L.length&&!/^\s*$/.test(L[i])&&(b.length===0||!isBlock(L[i])))b.push(L[i++]);
out.push('<p>'+inl(esc(b.join('\n'))).replace(/\n/g,'<br>')+'</p>')}
return out.join('\n')}
function parse(t){const m=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(t),d={};if(!m)return{d,body:t};let key=null;
m[1].split(/\r?\n/).forEach(l=>{const li=/^\s+-\s+(.*)$/.exec(l);if(li&&key){if(!Array.isArray(d[key]))d[key]=[];d[key].push(li[1].trim().replace(/^["']|["']$/g,''));return}
const i=l.indexOf(':');if(i>0&&!/^\s/.test(l)){key=l.slice(0,i).trim();d[key]=l.slice(i+1).trim().replace(/^["']|["']$/g,'')}});return{d,body:m[2]}}
const slugOf=(pl,f)=>{const s=(pl||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\p{L}\p{N}\p{M}_-]/gu,'');return s||path.basename(f,'.md')};
const toList=v=>Array.isArray(v)?v:(v?String(v).replace(/^\[|\]$/g,'').split(',').map(s=>s.trim().replace(/^["']|["']$/g,'')).filter(Boolean):[]);
const files=[];
for(const f of fs.readdirSync('.'))if(/^post-.*\.md$/.test(f))files.push(f);
if(fs.existsSync('content/posts'))for(const f of fs.readdirSync('content/posts'))if(f.endsWith('.md'))files.push('content/posts/'+f);
const posts=files.map(f=>{const{d,body}=parse(fs.readFileSync(f,'utf8'));return{slug:slugOf(d.permalink,f),labels:toList(d.labels),location:d.location||'',video:d.video||'',draft:d.draft==='true',title:d.title||'Untitled',date:d.date||'',category:d.category||'Other',image:d.image||'',body:md(body)}}).filter(p=>!p.draft).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const read=(f,k)=>fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8'))[k]||[]:[];
fs.writeFileSync(path.join(out,'posts.json'),JSON.stringify({categories:read('categories.json','categories').map(c=>c.name),stats:read('stats.json','stats'),posts}));
const tpl=fs.readFileSync('index.html','utf8'),css=(/<style>([\s\S]*?)<\/style>/.exec(tpl)||[])[1]||'';
const vid=u=>{if(!u)return'';const m=/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u);return m?`<div class="vid"><iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen loading="lazy" title="Video"></iframe></div>`:`<p><a class="more" href="${esc(u)}" target="_blank" rel="noopener">\u25b6 Watch video</a></p>`};
const fdate=s=>{const t=new Date(s);return isNaN(t)?'':t.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})};
for(const p of posts){
const plain=p.body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,160);
const img=p.image?`<a href="${esc(p.image)}"><img src="${esc(p.image)}" alt="${esc(p.title)}"></a>`:'';
const html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.title)} | SADMAN SHAKIB</title><meta name="description" content="${esc(plain)}"><style>${css}
.post h1.pt{margin:0 0 14px;font-size:clamp(26px,6vw,34px);line-height:1.25}.post>a>img{display:block;width:100%;height:auto;max-height:78vh;object-fit:contain;background:var(--line)}.vid{position:relative;padding-top:56.25%;margin:0 0 16px}.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:10px}.back{display:inline-block;margin:26px 0 18px;color:var(--acc);text-decoration:none;font:15px system-ui,sans-serif}nav b a{color:inherit;text-decoration:none}</style></head><body><div class="wrap"><nav><b><a href="/">SADMAN SHAKIB</a></b><div><a href="/">Home</a><a href="/#about">About</a><a href="/#contact">Contact</a></div></nav><a class="back" href="/#posts">\u2190 All posts</a><article class="post">${img}<div class="body"><div class="meta"><span>${esc(p.category)}</span><span>${fdate(p.date)}</span>${p.location?`<span>\ud83d\udccd ${esc(p.location)}</span>`:''}</div><h1 class="pt">${esc(p.title)}</h1>${p.labels.length?`<div class="chips">${p.labels.map(l=>`<span>${esc(l)}</span>`).join('')}</div>`:''}${vid(p.video)}<div class="pb">${p.body}</div></div></article><footer>\u00a9 2026 SADMAN SHAKIB</footer></div></body></html>`;
const dir=path.join(out,'posts',p.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);}
console.log('built',posts.length,'posts');
