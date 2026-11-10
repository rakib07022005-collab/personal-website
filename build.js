const fs=require('fs'),path=require('path'),out='dist';
fs.rmSync(out,{recursive:true,force:true});
function cp(f,to){const t=path.join(out,to);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(f,t);}
cp('index.html','index.html');cp('admin.html','admin/index.html');cp('config.yml','admin/config.yml');
for(const f of fs.readdirSync('.'))if(/\.(jpe?g|png|webp|gif)$/i.test(f))cp(f,'uploads/'+f);
function copyDir(src){if(!fs.existsSync(src))return;for(const e of fs.readdirSync(src,{withFileTypes:true})){const s=path.join(src,e.name);if(e.isDirectory())copyDir(s);else if(e.name!=='.gitkeep')cp(s,s);}}
copyDir('uploads');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inl=s=>s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,'<img class="zoom" src="$2" alt="$1">').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
const md=s=>esc(s).split(/\n{2,}/).map(b=>{b=b.trim();if(!b)return'';const m=/^(#{1,3})\s+(.*)$/.exec(b);if(m){const n=m[1].length+2;return`<h${n}>${inl(m[2])}</h${n}>`}
if(/^[-*]\s/.test(b))return'<ul>'+b.split('\n').map(l=>'<li>'+inl(l.replace(/^[-*]\s+/,''))+'</li>').join('')+'</ul>';return'<p>'+inl(b).replace(/\n/g,'<br>')+'</p>'}).join('\n');
function parse(t){const m=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(t),d={};if(!m)return{d,body:t};
m[1].split(/\r?\n/).forEach(l=>{const i=l.indexOf(':');if(i>0)d[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'')});return{d,body:m[2]}}
const files=[];
for(const f of fs.readdirSync('.'))if(/^post-.*\.md$/.test(f))files.push(f);
if(fs.existsSync('content/posts'))for(const f of fs.readdirSync('content/posts'))if(f.endsWith('.md'))files.push('content/posts/'+f);
const posts=files.map(f=>{const{d,body}=parse(fs.readFileSync(f,'utf8'));return{title:d.title||'Untitled',date:d.date||'',category:d.category||'Other',image:d.image||'',body:md(body)}}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const read=(f,k)=>fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8'))[k]||[]:[];
fs.writeFileSync(path.join(out,'posts.json'),JSON.stringify({categories:read('categories.json','categories').map(c=>c.name),stats:read('stats.json','stats'),posts}));
console.log('built',posts.length,'posts');
