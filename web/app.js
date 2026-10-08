import { catalog, generateTrace, createExperimentReport, experimentReportToCsv } from '../src/trace-engine.js';

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
 compareSelect:$('compareSelect'),compare:$('compareBtn'),comparison:$('comparisonResult'),
 dualWorkspace:$('dualWorkspace'),dualTimeline:$('dualTimeline'),
 dualProgressText:$('dualProgressText'),dualPlay:$('dualPlayBtn'),dualPause:$('dualPauseBtn'),
 dualBack:$('dualBackBtn'),dualNext:$('dualNextBtn'),dualReset:$('dualResetBtn'),
 dualSpeed:$('dualSpeed'),dualSpeedOutput:$('dualSpeedOutput'),dualExportJson:$('dualExportJson'),
 dualExportCsv:$('dualExportCsv'),dualExportStatus:$('dualExportStatus'),
 dualNameLeft:$('dualNameLeft'),dualNameRight:$('dualNameRight'),
 dualBarsLeft:$('dualBarsLeft'),dualBarsRight:$('dualBarsRight'),
 dualZeroLeft:$('dualZeroLeft'),dualZeroRight:$('dualZeroRight'),
 dualScaleLeft:$('dualScaleLeft'),dualScaleRight:$('dualScaleRight'),
 dualFrameLeft:$('dualFrameLeft'),dualFrameRight:$('dualFrameRight'),
 dualActivityLeft:$('dualActivityLeft'),dualActivityRight:$('dualActivityRight'),
 dualStatsLeft:$('dualStatsLeft'),dualStatsRight:$('dualStatsRight')
};
let algorithm='bubble',initial=[],frames=[],cursor=0,running=false,timer=null,theme='light',barNodes=[];
const dual={left:null,right:null,leftFrames:[],rightFrames:[],report:null,progress:0,running:false,timer:null,
 nodes:{left:[],right:[]}};
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
 barNodes=[];ui.bars.replaceChildren();invalidateDual();ui.comparison.replaceChildren();render();
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
 const active=new Set(frame.active||[]),sorted=new Set(frame.sorted||[]),localSorted=new Set(frame.localSorted||[]),done=frame.kind==='complete';
 frame.values.forEach((value,i)=>{
  const obj=barNodes[i],b=obj.bar;
  b.className='bar'+(value<0?' negative':'');
  if(done||sorted.has(i))b.classList.add('sorted');
  else if(active.has(i))b.classList.add(frame.kind==='swap'?'swapping':frame.kind==='write'||frame.kind==='bucket-write'?'writing':frame.kind==='bucket'||frame.kind==='count'?'collecting':'comparing');
  else if(localSorted.has(i))b.classList.add('local-sorted');
  if(algorithm==='quick'&&frame.meta?.type==='quick'){
    const meta=frame.meta;
    if(i<meta.lo||i>meta.hi)b.classList.add('range-dim');
    obj.track.dataset.pointer=i===meta.i&&i===meta.j?'IJ':i===meta.i?'I':i===meta.j?'J':'';
  }else obj.track.dataset.pointer='';
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
function svgElement(name, attrs={}) {
 const el=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
 return el;
}
function heapCoordinates(i,width){
 const level=Math.floor(Math.log2(i+1)),first=2**level-1;
 return {x:(i-first+.5)*width/(2**level),y:43+level*75,level};
}
function renderHeapTree(f,previous){
 const n=f.values.length,levels=Math.max(1,Math.floor(Math.log2(Math.max(1,n)))+1);
 const width=Math.max(390,2**(levels-1)*48),height=levels*75+10;
 let svg=ui.inspector.querySelector('svg.heap-tree');
 if(!svg || Number(svg.dataset.size)!==n){
  ui.inspector.replaceChildren();
  const heading=document.createElement('div');heading.className='struct-label';
  heading.textContent='MAX HEAP / 真实父子连接 · 可横向滚动';ui.inspector.append(heading);
  const viewport=document.createElement('div');viewport.className='heap-viewport';
  svg=svgElement('svg',{class:'heap-tree',width,height,viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'二叉堆树形结构，包含 '+n+' 个元素'});
  svg.dataset.size=String(n);
  const edgeLayer=svgElement('g',{class:'heap-edges'});
  const nodeLayer=svgElement('g',{class:'heap-nodes'});
  for(let i=1;i<n;i++){
   const a=heapCoordinates(Math.floor((i-1)/2),width),b=heapCoordinates(i,width);
   const link=svgElement('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'heap-edge','data-edge-child':i});edgeLayer.append(link);
  }
  for(let i=0;i<n;i++){
   const {x,y}=heapCoordinates(i,width);
   const g=svgElement('g',{class:'heap-node','data-heap-node':i,transform:'translate('+x+' '+y+')'});
   const circle=svgElement('circle',{r:19,cx:0,cy:0,class:'heap-circle'});
   const value=svgElement('text',{x:0,y:5,'text-anchor':'middle',class:'heap-value'});value.textContent=String(f.values[i]);
   const index=svgElement('text',{x:0,y:32,'text-anchor':'middle',class:'heap-index'});index.textContent=String(i);
   g.append(circle,value,index);nodeLayer.append(g);
  }
  svg.append(edgeLayer,nodeLayer);viewport.append(svg);ui.inspector.append(viewport);
 }
 const m=f.meta||{},end=Number.isInteger(m.end)?m.end:n-1;
 const highlighted=new Set(m.selected||[]),fixed=new Set(f.sorted||[]);
 for(let i=0;i<n;i++){
  const node=svg.querySelector('[data-heap-node="'+i+'"]');
  node.classList.toggle('heap-focus',highlighted.has(i));
  node.classList.toggle('heap-fixed',fixed.has(i)||i>end);
  const value=node.querySelector('.heap-value');value.textContent=String(f.values[i]);
 }
 for(const line of svg.querySelectorAll('.heap-edge')){
  line.classList.toggle('inactive',Number(line.dataset.edgeChild)>end);
 }
 if(previous!==undefined && cursor===previous+1 && f.kind==='swap' && f.active.length===2 &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const [i,j]=f.active;
  if(i!==j){
   const p=heapCoordinates(i,width),q=heapCoordinates(j,width);
   for(const [target,from] of [[i,j],[j,i]]){
    const label=svg.querySelector('[data-heap-node="'+target+'"] .heap-value');
    const src=from===i?p:q,dest=target===i?p:q;
    if(label&&label.animate)label.animate([
      {transform:'translate('+(src.x-dest.x)+'px,'+(src.y-dest.y)+'px)',opacity:1},
      {transform:'translate(0px,0px)',opacity:1}
    ],{duration:Math.min(420,Math.max(170,speed()*.85)),easing:'ease-in-out'});
   }
  }
 }
 const note=document.createElement('div');note.className='heap-caption';
 note.textContent='有效堆：0–'+Math.max(0,end)+' · 已归位：'+(n-1-end)+' · 当前阶段：'+(m.phase||'构建中');
 const old=ui.inspector.querySelector('.heap-caption');if(old)old.replaceWith(note);else ui.inspector.append(note);
 ui.inspectorCaption.textContent='每条连线对应数组父节点 ⌊(i−1)/2⌋；节点内是当前数值，下方小字是数组下标。交换时数值沿节点路径移动；超过堆边界的节点退出活动堆。';
}
function listChips(values,focus=-1,read=0){
 return '<div class="struct-row">'+values.map((v,i)=>'<span class="struct-chip'+(i===focus?' emphasis':i<read?' consumed':'')+'">'+htmlEscape(v)+'</span>').join('')+'</div>';
}
function renderInspector(f,previous){
 const meta=f.meta||{},values=f.values,active=f.active||[];let content='',caption='';
 if(algorithm==='heap'){renderHeapTree(f,previous);return}
 if(algorithm==='bubble'){
  content='<div class="struct-label">ADJACENT ELEMENTS / 当前相邻元素</div>'+listChips(active.map(i=>'['+i+'] '+values[i]))
   +'<div class="struct-spacer struct-label">扫描边界：'+(meta.end??'—')+' · 已归位 '+f.sorted.length+' / '+values.length+'</div>';
  caption='相邻比较后，大数向右冒泡。已归位元素持续标记，若本轮无交换，全部元素直接确认为有序。';
 }else if(algorithm==='selection'){
  content='<div class="struct-label">MINIMUM CANDIDATE / 当前最小候选</div>'+listChips(['第 '+(meta.i??'—')+' 轮','min = '+(meta.min??'—'),'j = '+(meta.j??'—')])
   +'<div class="struct-spacer struct-label">候选值：'+(meta.min===undefined?'—':values[meta.min])+' · 已归位 '+f.sorted.length+' 个</div>';
  caption='不断扫描未排序区间，最小值候选随比较变化；左侧已确认部分不会重新变灰。';
 }else if(algorithm==='insertion'){
  content='<div class="struct-label">INSERTION KEY / 当前待插入元素</div>'+listChips(['key = '+(meta.key??'—'),'j = '+(meta.j??'—')])
   +'<div class="struct-spacer struct-label">已经有序的前缀（仍可能右移）</div>'+listChips(values.slice(0,Math.max(1,meta.i??1)));
  caption='淡绿色表示局部有序前缀，并不意味着下标已最终固定；元素右移时仍会更新。';
 }else if(algorithm==='shell'){
  const gap=meta.gap??1,group=Number.isInteger(meta.i)?meta.i%gap:0,part=values.filter((_,i)=>i%gap===group);
  content='<div class="struct-label">GAPPED INSERTION / 分组插入</div>'+listChips(['gap = '+gap,'key = '+(meta.key??'—'),'j = '+(meta.j??'—')])
  +'<div class="struct-spacer struct-label">当前余数类 '+group+'（数组下标 mod gap）</div>'+listChips(part);
  caption='随 gap 逐步缩小，间隔相同的元素属于一组；gap = 1 时完成最后一轮插入。';
 }else if(algorithm==='quick'){
  const lo=meta.lo??0,hi=meta.hi??values.length-1,pivot=meta.pivot;
  content='<div class="struct-label">PIVOT / 当前枢轴值</div>'+listChips([pivot===undefined?'—':pivot],0)
  +'<div class="struct-spacer struct-label">左右扫描指针</div>'+listChips(['i = '+(meta.i??'—'),'j = '+(meta.j??'—'),'['+lo+' … '+hi+']'])
  +'<div class="struct-spacer struct-label">当前分区 / 下标标签：I 为左指针，J 为右指针</div>'
  +'<div class="quick-lane">'+values.slice(lo,hi+1).map((v,d)=>{const i=lo+d,flag=(i===meta.i?'I':'')+(i===meta.j?'J':'');return '<div class="quick-item'+(flag?' active':'')+'"><small>'+i+'</small><strong>'+htmlEscape(v)+'</strong><em>'+flag+'</em></div>'}).join('')+'</div>';
  caption='枢轴是当前分区选定的数值，不保证它始终位于同一个数组下标；指针根据比较结果向内移动。';
 }else if(algorithm==='merge'){
  const left=meta.left||[],right=meta.right||[],range=meta.range||[];
  content='<div class="struct-label">LEFT BUFFER / 左辅助数组 · 已读 '+(meta.leftIndex??0)+'</div>'+listChips(left,meta.leftIndex,meta.leftIndex)
  +'<div class="struct-spacer struct-label">RIGHT BUFFER / 右辅助数组 · 已读 '+(meta.rightIndex??0)+'</div>'+listChips(right,meta.rightIndex,meta.rightIndex)
  +'<div class="struct-spacer struct-label">回写目标：a['+(meta.writeIndex??'—')+'] · 阶段：'+htmlEscape(meta.phase||'待命')+'</div>'
  +'<div class="struct-label">当前归并区间 ['+(range[0]??'—')+', '+(range[1]===undefined?'—':range[1]-1)+']</div>';
  caption='比较时指针高亮；写入时回填目标随帧变化，灰色数字为已消费的缓冲区元素。归并区间的局部有序不等于最终归位。';
 }else if(algorithm==='counting'){
  const counts=meta.counts||[],total=Math.max(1,...counts.map(x=>x[1]));
  content='<div class="struct-label">FREQUENCY HISTOGRAM / 频次表'+(meta.mode==='sparse-fallback'?' · 稀疏回退':' · 稠密计数')+'</div>'
   +'<div class="counting-list">'+counts.map(([key,count])=>'<div class="counting-item'+(key===meta.activeKey?' focus':'')+'"><span>'+htmlEscape(key)+'</span><div class="counting-track"><i style="width:'+(100*count/total).toFixed(2)+'%"></i></div><strong>'+count+'</strong></div>').join('')+'</div>';
  if(!counts.length)content+='<p class="filler">尚未开始频次统计。</p>';
  caption=(meta.phase==='write'?'正在按数值从小到大回填，右侧计数会同步减少。':'当前从左到右统计每个整数的出现次数。')+(meta.mode==='sparse-fallback'?' 数值跨度过大时自动使用稀疏映射回退。':'');
 }else if(algorithm==='radix'){
  const buckets=meta.buckets||Array.from({length:10},()=>[]);
  content='<div class="struct-label">DIGIT BUCKETS / 个位 · 十位 · 百位</div>'
  +'<div class="struct-row">'+chip('位权 '+(meta.exp??'—'))+chip(meta.sign==='negative'?'负数绝对值':'非负数')+chip(meta.phase==='collect'?'收集阶段':'分桶阶段')+'</div>'
  +'<div class="bucket-list radix-buckets">'+buckets.map((b,i)=>'<div class="bucket-item'+(i===meta.activeBucket?' bucket-selected':'')+'"><span class="bucket-number">'+i+'</span><div class="bucket-values">'+(b.length?b.map(v=>'<span>'+htmlEscape(meta.sign==='negative'?-v:v)+'</span>').join(''):'<span>·</span>')+'</div></div>').join('')+'</div>';
  caption='0–9 号桶按当前位权稳定接收元素，之后依序收集。'+(meta.phase==='collect'?'现在按桶顺序写回主数组。':meta.activeValue!==undefined?'当前元素：'+meta.activeValue:'');
 }else if(algorithm==='bucket'){
  const b=meta.buckets||[],total=b.length,min=meta.min??0,max=meta.max??0;
  content='<div class="struct-label">RANGE BUCKETS / 按数值区间分配</div>'
  +'<div class="struct-row">'+chip('当前桶 '+(meta.selected===undefined?'—':meta.selected+1))+chip('阶段 '+(meta.phase||'准备'))+'</div>'
  +'<div class="bucket-list range-buckets">'+b.map((bucket,i)=>{const lo=min+(max-min)*i/total,hi=i===total-1?max:min+(max-min)*(i+1)/total;return '<div class="bucket-item'+(i===meta.selected?' bucket-selected':'')+'"><span class="bucket-number">'+(i+1)+'<small>'+Math.round(lo)+'–'+Math.round(hi)+'</small></span><div class="bucket-values">'+(bucket.length?bucket.map((v,j)=>'<span class="'+(i===meta.selected&&j===meta.focus?'bucket-focused':'')+'">'+htmlEscape(v)+'</span>').join(''):'<span>·</span>')+'</div></div>'}).join('')+'</div>';
  if(!total)content+='<p class="filler">等待初始化数值区间桶。</p>';
  caption='先分配，再在每个桶内部执行插入排序：比较、右移和插入都有真实事件帧；最后顺序写回。';
 }
 ui.inspector.innerHTML=content;
 ui.inspectorCaption.textContent=caption;
}
function renderCode(f){
 const targets={bubble:{compare:3,swap:4},selection:{compare:3,swap:5},insertion:{compare:3,write:4},shell:{compare:4,write:5},merge:{compare:4,write:5},quick:{compare:4,swap:5},heap:{compare:4,swap:5},counting:{count:1,write:4},radix:{bucket:2,write:3,pass:2},bucket:{bucket:2,compare:4,'bucket-write':4,write:5}};
 const index=targets[algorithm]?.[f.kind];
 [...ui.code.children].forEach((line,i)=>line.classList.toggle('active',i===index));
}
function render(previous){
 const f=frames[cursor];if(!f)return;const n=f.values.length;
 renderBars(f,previous);renderInspector(f,previous);renderCode(f);
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
 const types={compare:'正在比较',swap:'交换元素',write:'写入元素',pass:'轮次完成',count:'累计频次',bucket:'元素分桶','bucket-write':'桶内写入',complete:'排序完成',init:'准备就绪'};
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
 if(name==='compare'&&!dual.report&&initial.length>=2)compareAlgorithms();
 else if(name!=='compare'&&dual.running)pauseDual();
}
function invalidateDual(){
 stopDual();dual.left=null;dual.right=null;dual.report=null;dual.leftFrames=[];dual.rightFrames=[];
 dual.progress=0;dual.nodes={left:[],right:[]};
 ui.dualWorkspace.hidden=true;ui.dualProgressText.textContent='0.0%';
 ui.dualTimeline.value='0';ui.dualExportStatus.textContent='';
}
function stopDual(){dual.running=false;if(dual.timer!==null)clearTimeout(dual.timer);dual.timer=null}
function compareAlgorithms(){
 stop();
 const right=ui.compareSelect.value;
 if(!Object.hasOwn(catalog,right)||right===algorithm)return;
 invalidateDual();
 dual.left=algorithm;dual.right=right;dual.leftFrames=frames;
 dual.rightFrames=generateTrace(initial,right);
 dual.report=createExperimentReport(initial,dual.left,dual.right,[dual.leftFrames,dual.rightFrames]);
 ui.dualNameLeft.textContent=catalog[dual.left].name+' / '+catalog[dual.left].english;
 ui.dualNameRight.textContent=catalog[dual.right].name+' / '+catalog[dual.right].english;
 ui.dualWorkspace.hidden=false;
 ui.dualBarsLeft.replaceChildren();ui.dualBarsRight.replaceChildren();
 ui.dualStatsLeft.replaceChildren();ui.dualStatsRight.replaceChildren();
 ui.dualExportStatus.textContent='';
 renderDual();
 const metrics=[['比较次数','comparisons'],['交换次数','swaps'],['写入次数','writes'],['轮次','pass']];
 const output=metrics.map(([label,prop])=>'<tr><th scope="row">'+label+'</th><td>'+dual.report.results[0].totals[prop]+'</td><td>'+dual.report.results[1].totals[prop]+'</td></tr>').join('');
 ui.comparison.innerHTML='<table class="compare-table"><thead><tr><th scope="col">全流程事件计数</th><th scope="col">'+htmlEscape(catalog[dual.left].name)+'</th><th scope="col">'+htmlEscape(catalog[dual.right].name)+'</th></tr></thead><tbody>'+output+'</tbody></table><p class="compare-note">相同初始数组：['+initial.join(', ')+']。两侧按照各自总帧数的比例同步推进；单步操作及计数口径不同，不能当作算法运行时间比较。</p>';
}
function makeDualBars(side,n){
 const el=side==='left'?ui.dualBarsLeft:ui.dualBarsRight,frag=document.createDocumentFragment(),nodes=[];
 for(let i=0;i<n;i++){
  const track=document.createElement('div');track.className='dual-bar-track';
  const bar=document.createElement('div');bar.className='dual-bar';
  const label=document.createElement('span');label.className='dual-bar-label';bar.append(label);
  track.append(bar);frag.append(track);nodes.push({bar,label});
 }
 el.replaceChildren(frag);dual.nodes[side]=nodes;
}
function renderDualSide(side){
 const left=side==='left',framesForSide=left?dual.leftFrames:dual.rightFrames;
 const frameIndex=Math.round((framesForSide.length-1)*dual.progress/1000);
 const f=framesForSide[frameIndex];
 const barsEl=left?ui.dualBarsLeft:ui.dualBarsRight,zeroEl=left?ui.dualZeroLeft:ui.dualZeroRight;
 const scaleEl=left?ui.dualScaleLeft:ui.dualScaleRight;
 const frameEl=left?ui.dualFrameLeft:ui.dualFrameRight,activityEl=left?ui.dualActivityLeft:ui.dualActivityRight;
 const statsEl=left?ui.dualStatsLeft:ui.dualStatsRight;
 const n=f.values.length;if(dual.nodes[side].length!==n)makeDualBars(side,n);
 const min=Math.min(0,...initial),max=Math.max(0,...initial),range=Math.max(1,max-min),zero=(0-min)/range*100;
 zeroEl.style.bottom='calc(18px + (100% - 36px) * '+(zero/100)+')';
 scaleEl.textContent='['+min+', '+max+']';
 frameEl.textContent=frameIndex+' / '+(framesForSide.length-1);
 activityEl.textContent=f.detail;
 const active=new Set(f.active),sorted=new Set(f.sorted),localSorted=new Set(f.localSorted||[]);
 for(let i=0;i<n;i++){
  const v=f.values[i],item=dual.nodes[side][i],bar=item.bar;
  bar.className='dual-bar'+(v<0?' negative':'');
  if(f.kind==='complete'||sorted.has(i))bar.classList.add('sorted');
  else if(active.has(i))bar.classList.add(f.kind==='swap'?'swapping':f.kind==='write'||f.kind==='bucket-write'?'writing':'comparing');
  else if(localSorted.has(i))bar.classList.add('local-sorted');
  bar.style.bottom=(v>=0?zero:zero+v/range*100)+'%';
  bar.style.height=Math.max(.7,Math.abs(v)/range*100)+'%';
  item.label.textContent=n<=20?String(v):'';
  bar.title='下标 '+i+'：'+v;
 }
 barsEl.setAttribute('aria-label',(left?'算法 A':'算法 B')+'，数组：'+f.values.join('，'));
 const metrics=[['比较',f.comparisons],['交换',f.swaps],['写入',f.writes],['轮次',f.pass]];
 // Keep the stats nodes alive; update only their values for smooth playback.
 if(statsEl.children.length!==metrics.length){
  statsEl.innerHTML=metrics.map(([label])=>'<div><small>'+label+'</small><strong>0</strong></div>').join('');
 }
 metrics.forEach(([,value],i)=>{statsEl.children[i].querySelector('strong').textContent=String(value)});
}
function renderDual(){
 if(!dual.report)return;
 renderDualSide('left');renderDualSide('right');
 ui.dualTimeline.value=String(dual.progress);
 ui.dualProgressText.textContent=(dual.progress/10).toFixed(1)+'%';
 const finished=dual.progress>=1000;
 ui.dualPlay.textContent=finished?'↻ 从头播放':dual.running?'● 正在同步播放':dual.progress?'▶ 继续同步播放':'▶ 同步播放';
 ui.dualPause.disabled=!dual.running;
 ui.dualBack.disabled=dual.progress===0;
 ui.dualNext.disabled=finished;
}
function advanceDual(){
 if(!dual.running)return;
 const speeds=[0,2,3,5,9,15],tick=speeds[Number(ui.dualSpeed.value)]||5;
 dual.progress=Math.min(1000,dual.progress+tick);
 if(dual.progress===1000)stopDual();
 renderDual();
 if(dual.running)dual.timer=setTimeout(advanceDual,70);
}
function playDual(){
 if(!dual.report)return;
 if(dual.running)return;
 if(dual.progress===1000)dual.progress=0;
 dual.running=true;renderDual();dual.timer=setTimeout(advanceDual,70);
}
function pauseDual(){stopDual();renderDual()}
function seekDual(progress){
 stopDual();dual.progress=Math.min(1000,Math.max(0,Math.round(progress)||0));renderDual();
}
function stepDual(direction){
 if(!dual.report)return;
 // One shared tick corresponds to at least one frame on the longer native trace.
 const total=Math.max(dual.leftFrames.length-1,dual.rightFrames.length-1,1);
 const quantum=Math.max(1,Math.ceil(1000/total));
 seekDual(dual.progress+direction*quantum);
}
function downloadDual(format){
 if(!dual.report)return;
 const stamp=dual.report.generatedAt.replace(/[:.]/g,'-');
 const filename='sorting-lab-'+dual.left+'-vs-'+dual.right+'-'+stamp+'.'+format;
 const contents=format==='csv'?experimentReportToCsv(dual.report):JSON.stringify(dual.report,null,2);
 const type=format==='csv'?'text/csv;charset=utf-8':'application/json;charset=utf-8';
 const url=URL.createObjectURL(new Blob([contents],{type}));
 try{
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();
  ui.dualExportStatus.textContent='✓ 已请求导出 '+format.toUpperCase()+'：'+filename;
 }finally{setTimeout(()=>URL.revokeObjectURL(url),2000)}
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
ui.dualPlay.addEventListener('click',playDual);
ui.dualPause.addEventListener('click',pauseDual);
ui.dualBack.addEventListener('click',()=>stepDual(-1));
ui.dualNext.addEventListener('click',()=>stepDual(1));
ui.dualReset.addEventListener('click',()=>seekDual(0));
ui.dualTimeline.addEventListener('input',()=>seekDual(Number(ui.dualTimeline.value)));
ui.dualSpeed.addEventListener('input',()=>ui.dualSpeedOutput.textContent=ui.dualSpeed.value+'×');
ui.dualExportJson.addEventListener('click',()=>downloadDual('json'));
ui.dualExportCsv.addEventListener('click',()=>downloadDual('csv'));
ui.compareSelect.addEventListener('change',compareAlgorithms);
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','BUTTON','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if(e.code==='Space'){e.preventDefault();running?pause():play()}
 else if(e.code==='ArrowRight'){e.preventDefault();step()}
 else if(e.code==='ArrowLeft'){e.preventDefault();back()}
});
window.addEventListener('blur',()=>{if(running)pause();if(dual.running)pauseDual()});
try{theme=localStorage.getItem('sorting-lab-theme')==='dark'?'dark':'light'}catch{}
applyTheme(theme);drawAlgorithms();drawDetails();switchTab('explain');rebuild(makeData(22,'random'));
