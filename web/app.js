import { catalog, generateTrace } from '../src/trace-engine.js';

const $ = id => document.getElementById(id);
const ui={
 options:$('algorithmGrid'),bars:$('bars'),name:$('algorithmTitle'),
 category:$('algorithmCategory'),desc:$('algorithmDesc'),code:$('pseudocode'),
 status:$('statusBadge'),operation:$('activity'),progress:$('progressFill'),
 progressBar:$('progressBar'),progressText:$('progressText'),stepStat:$('stepStat'),
 compStat:$('compStat'),swapStat:$('swapStat'),writeStat:$('writeStat'),passStat:$('passStat'),
 sizeStat:$('sizeStat'),play:$('playBtn'),pause:$('pauseBtn'),step:$('stepBtn'),
 back:$('backBtn'),reset:$('resetBtn'),shuffle:$('shuffleBtn'),sizeRange:$('sizeRange'),
 sizeOutput:$('sizeOutput'),speedRange:$('speedRange'),speedOutput:$('speedOutput'),
 preset:$('preset'),custom:$('customInput'),apply:$('applyBtn'),message:$('inputMessage'),
 theme:$('themeBtn'),best:$('bestComplexity'),avg:$('averageComplexity'),
 worst:$('worstComplexity'),space:$('spaceComplexity'),stable:$('stability'),
 hint:$('stepHint'),timeline:$('timelineRange'),chapter:$('chapterHint'),
 chartArea:$('chartArea'),zero:$('zeroLine'),scale:$('scaleLabel'),
 inspector:$('inspectorVisual'),inspectorCaption:$('inspectorCaption'),
 compareSelect:$('compareSelect'),compare:$('compareBtn'),comparison:$('comparisonResult')
};
let algorithm='bubble',initial=[],frames=[],cursor=0,running=false,timer=null,theme='light',barNodes=[];
const keys=Object.keys(catalog);
const random=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function makeData(n,type){
 let a=Array.from({length:n},()=>random(5,95));
 if(type==='duplicates')a=Array.from({length:n},()=>[13,25,37,49][random(0,3)]);
 if(type==='reverse'||type==='nearly'||type==='sorted')a.sort((x,y)=>x-y);
 if(type==='reverse')a.reverse();
 if(type==='nearly'&&n>=3){const i=random(0,n-2),j=random(i+1,n-1);[a[i],a[j]]=[a[j],a[i]]}
 return a;
}
function stop(){running=false;if(timer!==null)clearTimeout(timer);timer=null}
function rebuild(values){
 stop();initial=values.slice();frames=generateTrace(initial,algorithm);cursor=0;
 ui.sizeRange.value=String(Math.max(2,Math.min(48,values.length)));
 ui.sizeOutput.textContent=values.length;
 ui.timeline.max=String(Math.max(1,frames.length-1));ui.timeline.value='0';
 barNodes=[];ui.bars.replaceChildren();ui.comparison.replaceChildren();render();
}
function speed(){return Math.round(860/Math.pow(1.9,Number(ui.speedRange.value)-1))}
function animate(){if(!running)return;if(cursor>=frames.length-1){stop();render();return}const prev=cursor;cursor++;render(prev);if(running)timer=setTimeout(animate,speed())}
function play(){if(running)return;if(cursor>=frames.length-1)cursor=0;running=true;ui.operation.setAttribute('aria-live','off');animate()}
function pause(){stop();ui.operation.setAttribute('aria-live','polite');render()}
function step(){const prev=cursor;stop();cursor=Math.min(cursor+1,frames.length-1);render(prev)}
function back(){stop();cursor=Math.max(0,cursor-1);render()}
function reset(){stop();cursor=0;render()}
function selectAlgorithm(key){
 if(!Object.hasOwn(catalog,key))return;
 algorithm=key;rebuild(initial);drawAlgorithms();drawDetails();
}
function drawAlgorithms(){
 ui.options.innerHTML=Object.entries(catalog).map(([key,v],i)=>'<button type="button" class="algorithm '+(key===algorithm?'selected':'')+'" data-algo="'+key+'" aria-pressed="'+(key===algorithm)+'"><span class="alg-num">'+String(i+1).padStart(2,'0')+'</span><span class="alg-name">'+v.name+'</span><small>'+v.abbr+'</small></button>').join('');
}
function drawDetails(){
 const d=catalog[algorithm];ui.name.textContent=d.name+' / '+d.english;
 ui.category.textContent=d.family;ui.desc.textContent=d.summary;
 ui.best.textContent=d.best;ui.avg.textContent=d.avg;ui.worst.textContent=d.worst;ui.space.textContent=d.space;
 ui.stable.textContent=d.stable?'稳定 STABLE':'不稳定 UNSTABLE';
 ui.stable.className=d.stable?'stable':'unstable';
 ui.code.innerHTML=d.code.map((_,i)=>'<div class="code-line"><span>'+String(i+1).padStart(2,'0')+'</span><code></code></div>').join('');
 [...ui.code.children].forEach((row,i)=>row.querySelector('code').textContent=d.code[i]);
 ui.compareSelect.innerHTML=keys.filter(k=>k!==algorithm).map(k=>'<option value="'+k+'">'+catalog[k].name+' / '+catalog[k].english+'</option>').join('');
}
function setupBars(n){
 const fragment=document.createDocumentFragment();barNodes=[];
 for(let i=0;i<n;i++){
  const track=document.createElement('div');track.className='bar-track';
  const bar=document.createElement('div');bar.className='bar';
  const label=document.createElement('span');label.className='bar-value';
  bar.appendChild(label);track.appendChild(bar);fragment.appendChild(track);barNodes.push({track,bar,label});
 }
 ui.bars.replaceChildren(fragment);
}
function renderBars(frame,previous){
 const n=frame.values.length;if(barNodes.length!==n)setupBars(n);
 const min=Math.min(0,...initial),max=Math.max(0,...initial);
 const span=Math.max(1,max-min),zero=(0-min)/span*100;
 ui.zero.style.bottom='calc(18px + (100% - 36px) * '+(zero/100)+')';
 ui.scale.textContent=min<0?'SIGNED / ZERO-ALIGNED':'POSITIVE / ZERO-ALIGNED';
 const active=new Set(frame.active||[]),sorted=new Set(frame.sorted||[]),done=frame.kind==='complete';
 frame.values.forEach((value,i)=>{
  const obj=barNodes[i],b=obj.bar;
  b.className='bar'+(value<0?' negative':'');
  if(done||sorted.has(i))b.classList.add('sorted');
  else if(active.has(i))b.classList.add(frame.kind==='swap'?'swapping':frame.kind==='write'?'writing':frame.kind==='bucket'||frame.kind==='count'?'collecting':'comparing');
  b.style.bottom=(value>=0?zero:zero+value/span*100)+'%';
  b.style.height=Math.max(0.8,Math.abs(value)/span*100)+'%';
  obj.label.textContent=n<=24?String(value):'';
  b.title='下标 '+i+' · 数值 '+value;
 });
 // Move the visual identity of the two swapped values between slots instead of rebuilding DOM.
 if(previous!==undefined && cursor===previous+1 && frame.kind==='swap'&&frame.active.length===2 &&
     !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const [i,j]=frame.active;
  if(i!==j&&barNodes[i]&&barNodes[j]){
   const a=barNodes[i],b=barNodes[j],dx=b.track.getBoundingClientRect().left-a.track.getBoundingClientRect().left;
   for(const [obj,offset] of [[a,dx],[b,-dx]]){
    if(obj.bar.animate)obj.bar.animate([{transform:'translateX('+offset+'px)',opacity:.83},{transform:'translateX(0px)',opacity:1}],{duration:Math.min(330,Math.max(130,speed()*.76)),easing:'ease-in-out'});
   }
  }
 }
 ui.bars.setAttribute('aria-label','数组：'+frame.values.join('，')+'；比较 '+frame.comparisons+' 次，交换 '+frame.swaps+' 次');
}
function chip(text,variant=''){
 return '<span class="struct-chip '+variant+'">'+htmlEscape(text)+'</span>';
}
function row(values,focus=-1){
 return '<div class="struct-row">'+values.map((v,i)=>chip(v,i===focus?'emphasis':'')).join('')+'</div>';
}
function renderInspector(f){
 const meta=f.meta||{},values=f.values,active=f.active||[];let content='',caption='';
 if(algorithm==='quick'){
  content='<div class="struct-label">CURRENT PIVOT / 枢轴</div>'+row([meta.pivot===undefined?'—':meta.pivot],0)
  +'<div class="struct-spacer struct-label">双指针与当前分区</div>'
  +'<div class="struct-row">'+chip('i = '+(meta.i??'—'),'highlight')+chip('j = '+(meta.j??'—'),'highlight')+chip('['+(meta.lo??0)+' .. '+(meta.hi??values.length-1)+']')+'</div>';
  caption='黄色指针标识当前扫描位置，枢轴用于双指针分区。';
 }else if(algorithm==='merge'){
  const l=meta.left||[],r=meta.right||[];
  content='<div class="struct-label">LEFT BUFFER / 左半区</div>'+row(l.slice(0,18),meta.leftIndex)
  +'<div class="struct-spacer struct-label">RIGHT BUFFER / 右半区</div>'+row(r.slice(0,18),meta.rightIndex)
  +'<div class="struct-spacer struct-label">正在归并区间 '+htmlEscape((meta.range||['—','—']).join(' → '))+'</div>';
  caption='辅助数组保留归并前的两段数据。高亮项为当前读取指针。';
 }else if(algorithm==='heap'){
  const end=meta.end??values.length-1,levels=Math.min(4,Math.ceil(Math.log2(Math.min(end+1,15)+1)));
  content='<div class="struct-label">MAX HEAP / 最大堆（二叉树视图）</div>';
  for(let depth=0;depth<levels;depth++){
   const from=Math.pow(2,depth)-1,to=Math.min(end+1,Math.pow(2,depth+1)-1);
   if(from>=to)break;
   content+='<div class="heap-level">'+values.slice(from,to).map((v,i)=>'<span class="mini-node '+(from+i===meta.root?'focus':'')+'" title="数组下标 '+(from+i)+'">'+htmlEscape(v)+'</span>').join('')+'</div>';
  }
  content+='<div class="struct-spacer struct-label">有效堆区间：0 – '+end+'；右侧为逐步归位区</div>';
  caption='完整二叉树按数组下标展开；高亮节点为当前下滤父节点。';
 }else if(algorithm==='counting'){
  const counts=meta.counts||[];
  content='<div class="struct-label">FREQUENCY MAP / 整数频次表</div><div class="bucket-list">'
   +counts.slice(0,14).map(([key,count])=>'<div class="bucket-item"><span class="bucket-number">'+htmlEscape(key)+'</span><div class="bucket-values">'+chip('× '+count,count?'emphasis':'')+'</div></div>').join('')
   +(counts.length>14?'<div class="struct-label">还有 '+(counts.length-14)+' 个整数值未展示</div>':'')+'</div>';
  caption='随计数阶段实时更新频次；本实现使用 Map 以支持负数和较大整数范围。';
 }else if(algorithm==='radix'){
  const buckets=meta.buckets||Array.from({length:10},()=>[]);
  content='<div class="struct-label">DIGIT BUCKETS / 10 个数位桶</div><div class="bucket-list">'
   +buckets.map((b,i)=>'<div class="bucket-item"><span class="bucket-number">'+i+'</span><div class="bucket-values">'+(b.length?b.slice(-9).map(v=>'<span>'+htmlEscape(meta.sign==='negative'?-v:v)+'</span>').join(''):'<span>·</span>')+'</div></div>').join('')+'</div>';
  caption='当前位权：'+(meta.exp||'—')+'；'+(meta.sign==='negative'?'正在处理负数绝对值':'正在处理非负数')+'。每轮从 0 到 9 收集数位桶。';
 }else if(algorithm==='bucket'){
  const buckets=meta.buckets||[],total=buckets.length;
  content='<div class="struct-label">RANGE BUCKETS / 数值区间分桶</div><div class="bucket-list">'
   +buckets.map((b,i)=>'<div class="bucket-item"><span class="bucket-number">桶 '+(i+1)+'</span><div class="bucket-values">'+(b.length?b.map(v=>'<span>'+htmlEscape(v)+'</span>').join(''):'<span>·</span>')+'</div></div>').join('')+'</div>';
  if(!total)content+='<p class="filler">等待完成初始化分桶。</p>';
  caption='元素按区间划入桶，再分别执行桶内排序和拼接。';
 }else{
  const title=algorithm==='bubble'?'ADJACENT PAIR / 相邻比较':algorithm==='selection'?'MINIMUM SEARCH / 寻找最小值':algorithm==='insertion'?'ORDERED PREFIX / 插入排序': 'GAP INSERTION / 分组插入';
  content='<div class="struct-label">'+title+'</div>';
  if(active.length)content+=row(active.map(i=>i+': '+values[i]));
  else content+='<p class="filler">按下「单步」开始，观察当前比较或写入的元素。</p>';
  content+='<div class="struct-spacer struct-label">当前轮次 '+f.pass+' · 已确认归位 '+f.sorted.length+' 个元素</div>';
  caption='当前焦点和排序状态会随着时间轴同步变化。';
 }
 ui.inspector.innerHTML=content;
 ui.inspectorCaption.textContent=caption;
}
function renderCode(f){
 const targets={bubble:{compare:3,swap:4},selection:{compare:3,swap:5},insertion:{compare:3,write:4},shell:{compare:4,write:5},merge:{compare:4,write:5},quick:{compare:4,swap:5},heap:{compare:4,swap:5},counting:{count:1,write:4},radix:{bucket:2,write:3,pass:2},bucket:{bucket:2,compare:4,write:5}};
 const index=targets[algorithm]?.[f.kind];
 [...ui.code.children].forEach((line,i)=>line.classList.toggle('active',i===index));
}
function render(previous){
 const f=frames[cursor];if(!f)return;const n=f.values.length;
 renderBars(f,previous);renderInspector(f);renderCode(f);
 ui.compStat.textContent=f.comparisons;ui.swapStat.textContent=f.swaps;
 ui.writeStat.textContent=f.writes;ui.passStat.textContent=f.pass;
 ui.stepStat.textContent=cursor+'/'+(frames.length-1);ui.timeline.value=String(cursor);
 ui.sizeStat.textContent=String(n);ui.operation.textContent=f.detail;
 const percent=cursor/Math.max(1,frames.length-1)*100;
 ui.progress.style.width=percent.toFixed(1)+'%';
 ui.progressText.textContent=Math.round(percent)+'%';
 ui.progressBar.setAttribute('aria-valuenow',String(Math.round(percent)));
 const done=cursor===frames.length-1;
 ui.status.textContent=done?'✓ 排序完成':running?'● 正在运行':cursor?'Ⅱ 已暂停':'○ 准备就绪';
 ui.status.className='status'+(done?' complete':running?' playing':cursor?' paused':'');
 ui.play.textContent=done?'↻ 再播放':'▶ '+(cursor?'继续播放':'开始排序');
 ui.pause.disabled=!running;ui.step.disabled=done;ui.back.disabled=cursor===0;
 const types={compare:'正在比较',swap:'交换元素',write:'写入元素',pass:'轮次完成',count:'累计频次',bucket:'元素分桶',complete:'排序完成',init:'准备就绪'};
 const chapter=types[f.kind]||'处理中';
 ui.hint.textContent='共 '+(frames.length-1)+' 帧 · '+chapter;
 ui.chapter.textContent='当前阶段：'+chapter;
}
function error(message){ui.message.textContent=message;ui.message.classList.add('error')}
function applyCustom(){
 const tokens=ui.custom.value.trim().split(/[\s,，、;；]+/).filter(Boolean);
 if(tokens.length<2||tokens.length>48||!tokens.every(s=>/^[-+]?\d+$/.test(s))){error('请输入 2–48 个整数，用逗号或空格分隔。');return}
 const values=tokens.map(Number);
 if(!values.every(Number.isSafeInteger)||values.some(v=>Math.abs(v)>999)){error('每个整数必须在 -999 至 999 之间。');return}
 rebuild(values);ui.message.classList.remove('error');
 ui.message.textContent='✓ 已载入 '+values.length+' 个整数：'+values.join(', ');
 ui.custom.value='';
}
function applyTheme(next){
 theme=next;document.documentElement.setAttribute('data-theme',theme);
 ui.theme.textContent=theme==='light'?'☾ 深色模式':'☀ 亮色模式';
 ui.theme.setAttribute('aria-label','切换到'+(theme==='light'?'深色':'亮色')+'模式');
 try{localStorage.setItem('sorting-lab-theme',theme)}catch{}
}
function switchTab(name){
 document.querySelectorAll('[data-tab]').forEach(b=>{
  const active=b.dataset.tab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));
 });
 const panels={explain:'panelExplain',pseudocode:'panelCode',profile:'panelProfile',compare:'panelCompare'};
 Object.entries(panels).forEach(([key,id])=>$(id).hidden=key!==name);
}
function compareAlgorithms(){
 const key=ui.compareSelect.value;if(!Object.hasOwn(catalog,key))return;
 const a=frames.at(-1),other=generateTrace(initial,key).at(-1);
 const metrics=[['比较次数','comparisons'],['交换次数','swaps'],['写入次数','writes'],['轮次','pass']];
 const output=metrics.map(([label,prop])=>'<tr><th scope="row">'+label+'</th><td>'+a[prop]+'</td><td>'+other[prop]+'</td></tr>').join('');
 ui.comparison.innerHTML='<table class="compare-table"><thead><tr><th scope="col">教学操作计数</th><th scope="col">'+htmlEscape(catalog[algorithm].name)+'</th><th scope="col">'+htmlEscape(catalog[key].name)+'</th></tr></thead><tbody>'+output+'</tbody></table><p class="compare-note">两种算法使用完全相同的初始数据。表中数据来自各自的完整事件追踪；写入和轮次统计并非跨算法统一的物理成本，也不等于实际执行时间。</p>';
}
ui.options.addEventListener('click',e=>{const b=e.target.closest('[data-algo]');if(b)selectAlgorithm(b.dataset.algo)});
ui.play.addEventListener('click',play);ui.pause.addEventListener('click',pause);
ui.step.addEventListener('click',step);ui.back.addEventListener('click',back);
ui.reset.addEventListener('click',reset);
ui.timeline.addEventListener('input',()=>{stop();cursor=Math.min(frames.length-1,Math.max(0,Number(ui.timeline.value)||0));render()});
ui.shuffle.addEventListener('click',()=>{rebuild(makeData(Number(ui.sizeRange.value),ui.preset.value));ui.message.classList.remove('error');ui.message.textContent='✓ 已根据数据分布生成新数组'});
ui.sizeRange.addEventListener('input',()=>rebuild(makeData(Number(ui.sizeRange.value),ui.preset.value)));
ui.speedRange.addEventListener('input',()=>{ui.speedOutput.textContent=ui.speedRange.value+'×'});
ui.preset.addEventListener('change',()=>rebuild(makeData(Number(ui.sizeRange.value),ui.preset.value)));
ui.apply.addEventListener('click',applyCustom);
ui.custom.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCustom()}});
ui.theme.addEventListener('click',()=>applyTheme(theme==='light'?'dark':'light'));
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
ui.compare.addEventListener('click',compareAlgorithms);
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','BUTTON','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if(e.code==='Space'){e.preventDefault();running?pause():play()}
 else if(e.code==='ArrowRight'){e.preventDefault();step()}
 else if(e.code==='ArrowLeft'){e.preventDefault();back()}
});
window.addEventListener('blur',()=>{if(running)pause()});
try{theme=localStorage.getItem('sorting-lab-theme')==='dark'?'dark':'light'}catch{}
applyTheme(theme);drawAlgorithms();drawDetails();switchTab('explain');rebuild(makeData(22,'random'));
