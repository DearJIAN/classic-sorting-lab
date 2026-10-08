/* Sorting visualizer: genuine algorithm-specific snapshots for ten classic sorts.
 * Frames are deterministic and independent of the browser.
 */
export const catalog = Object.freeze({
 bubble:{name:'冒泡排序',english:'Bubble Sort',abbr:'BUBBLE',family:'交换排序',avg:'O(n²)',best:'O(n)',worst:'O(n²)',space:'O(1)',stable:true,summary:'逐次比较相邻元素，较大的数字向右侧移动；一轮没有交换便提前终止。',code:['for end = n-1 down to 1','  swapped = false','  for i = 0 to end-1','    if a[i] > a[i+1]','      swap(a[i], a[i+1])','      swapped = true','  if !swapped: break']},
 selection:{name:'选择排序',english:'Selection Sort',abbr:'SELECT',family:'选择排序',avg:'O(n²)',best:'O(n²)',worst:'O(n²)',space:'O(1)',stable:false,summary:'每轮扫描未排序部分，选出最小值放到前端。',code:['for i = 0 to n-1','  minIndex = i','  for j = i+1 to n-1','    if a[j] < a[minIndex]','      minIndex = j','  swap(a[i], a[minIndex])']},
 insertion:{name:'插入排序',english:'Insertion Sort',abbr:'INSERT',family:'插入排序',avg:'O(n²)',best:'O(n)',worst:'O(n²)',space:'O(1)',stable:true,summary:'将当前元素插入左侧已经排好序的序列，必要时逐个右移。',code:['for i = 1 to n-1','  key = a[i]','  j = i-1','  while j >= 0 and a[j] > key','    a[j+1] = a[j]','    j--','  a[j+1] = key']},
 shell:{name:'希尔排序',english:'Shell Sort',abbr:'SHELL',family:'插入排序',avg:'依赖增量',best:'依赖增量',worst:'O(n²)',space:'O(1)',stable:false,summary:'先按较大间隔进行分组插入排序，再不断缩小间隔直到 1。',code:['gap = floor(n/2)','while gap > 0','  for i = gap to n-1','    key = a[i]','    shift earlier gap elements','    insert key','  gap = floor(gap/2)']},
 merge:{name:'归并排序',english:'Merge Sort',abbr:'MERGE',family:'分治排序',avg:'O(n log n)',best:'O(n log n)',worst:'O(n log n)',space:'O(n)',stable:true,summary:'递归拆分数组，按顺序比较两段的元素并合并。',code:['mergeSort(left, right)','  split at midpoint','  mergeSort(left, mid)','  mergeSort(mid, right)','  compare two sorted halves','  write smaller into output']},
 quick:{name:'快速排序',english:'Quick Sort',abbr:'QUICK',family:'分治排序',avg:'O(n log n)',best:'O(n log n)',worst:'O(n²)',space:'O(log n) 平均',stable:false,summary:'用中间值作枢轴，左右扫描并交换错位元素，再处理子区间。',code:['stack = [(0, n-1)]','while stack not empty','  [lo,hi] = pop()','  pivot = a[mid]','  move i right and j left','  swap when i <= j','  push remaining partitions']},
 heap:{name:'堆排序',english:'Heap Sort',abbr:'HEAP',family:'选择排序',avg:'O(n log n)',best:'O(n log n)',worst:'O(n log n)',space:'O(1)',stable:false,summary:'建立最大堆，依次把堆顶最大值交换到末尾，再向下调整堆。',code:['build max heap','for end = n-1 down to 1','  swap(a[0], a[end])','  siftDown(0, end-1)','  compare parent and children','  swap with larger child']},
 counting:{name:'计数排序',english:'Counting Sort',abbr:'COUNT',family:'非比较排序',avg:'O(n+k)',best:'O(n+k)',worst:'O(n+k)',space:'O(k)',stable:true,summary:'统计每个整数出现次数，再按数值顺序写回；这里显示计数和写回步骤。',code:['min = minimum(a)','count[value-min]++','for value ascending','  repeat count[value] times','    write value to output']},
 radix:{name:'基数排序',english:'Radix Sort',abbr:'RADIX',family:'非比较排序',avg:'O(d(n+b))',best:'O(d(n+b))',worst:'O(d(n+b))',space:'O(n+b)',stable:true,summary:'按个位、十位、百位等逐轮稳定分桶；负数按绝对值处理后逆序拼回。',code:['split negatives and nonnegatives','for digit = 1,10,100,...','  stable buckets by digit','  collect buckets in order','reverse negative magnitudes','concatenate signed groups']},
 bucket:{name:'桶排序',english:'Bucket Sort',abbr:'BUCKET',family:'分布排序',avg:'期望 O(n+k)',best:'O(n+k)',worst:'O(n²)',space:'O(n+k)',stable:true,summary:'把数据映射到数值区间中的若干桶，在每个桶中插入排序，最后顺序拼接。',code:['allocate sqrt(n) buckets','for value in a','  bucketIndex = normalized(value)','  append value to bucket','insertionSort(each bucket)','concatenate bucket outputs']}
});
export function generateTrace(input,algorithm='bubble'){
 if(!Object.hasOwn(catalog,algorithm))throw new RangeError('Unknown algorithm: '+algorithm);
 if(!Array.isArray(input)||!input.every(Number.isSafeInteger))throw new TypeError('Expected safe integers');
 if(input.length>96)throw new RangeError('Visual length must be <=96');
 const a=input.slice(),n=a.length;const frames=[];let comparisons=0,swaps=0,writes=0,pass=0;
 let context={},confirmed=new Set();
 function snap(kind='init',active=[],detail='等待开始',sorted=[]){
  const permanent=[...confirmed].filter(i=>i>=0&&i<n);
  const local=['insertion','merge','shell','quick','counting','radix','bucket'].includes(algorithm)?sorted.filter(i=>i>=0&&i<n):[];
  frames.push({values:a.slice(),kind,active:active.filter(i=>i>=0&&i<n),detail,
   sorted:permanent,localSorted:local,meta:JSON.parse(JSON.stringify(context)),comparisons,swaps,writes,pass});
 }
 function cmp(i,j,detail){comparisons++;snap('compare',[i,j],detail||'比较 '+a[i]+' 与 '+a[j])}
 function compareValue(i,value,detail){comparisons++;snap('compare',[i],detail||'比较 '+a[i]+' 与 '+value)}
 function swap(i,j,detail){if(i===j)return;[a[i],a[j]]=[a[j],a[i]];swaps++;writes+=2;snap('swap',[i,j],detail||'交换位置 '+i+' 和 '+j)}
 function write(i,value,detail){a[i]=value;writes++;snap('write',[i],detail||'写入 '+value)}
 function round(detail,sorted=[]){if(['bubble','selection','heap'].includes(algorithm))for(const i of sorted)confirmed.add(i);pass++;snap('pass',[],detail,sorted)}
 snap();
 if(algorithm==='bubble'){
  for(let end=n-1;end>0;end--){let moved=false;for(let i=0;i<end;i++){context={type:'bubble',end,left:i,right:i+1,phase:'compare'};cmp(i,i+1);if(a[i]>a[i+1]){context.phase='swap';swap(i,i+1);moved=true}}context.phase='round';round(moved?'第 '+pass+' 轮结束：最大值归位':'本轮没有交换，提前结束',!moved?Array.from({length:n},(_,i)=>i):Array.from({length:n-end},(_,i)=>end+i));if(!moved)break}
 }else if(algorithm==='selection'){
  for(let i=0;i<n;i++){let min=i;for(let j=i+1;j<n;j++){context={type:'selection',i,j,min,phase:'compare'};cmp(min,j,'寻找最小值：'+a[j]+' 与 '+a[min]);if(a[j]<a[min])min=j}context={type:'selection',i,j:null,min,phase:'swap'};swap(i,min,'将本轮最小值放到下标 '+i);round('第 '+pass+' 轮：左侧区间已排序',Array.from({length:i+1},(_,k)=>k))}
 }else if(algorithm==='insertion'){
  for(let i=1;i<n;i++){let key=a[i],j=i-1;context={type:'insertion',i,j,key,phase:'compare'};while(j>=0){context.j=j;context.phase='compare';compareValue(j,key);if(a[j]<=key)break;context.phase='shift';write(j+1,a[j],'右移 '+a[j]);j--}context.j=j+1;context.phase='insert';write(j+1,key,'把 '+key+' 插入正确位置');round('已处理前 '+(i+1)+' 个元素',Array.from({length:i+1},(_,k)=>k))}
 }else if(algorithm==='shell'){
  for(let gap=Math.floor(n/2);gap>0;gap=Math.floor(gap/2)){for(let i=gap;i<n;i++){const key=a[i];let j=i;context={type:'shell',gap,i,j,key,phase:'compare'};while(j>=gap){context.j=j;context.phase='compare';compareValue(j-gap,key,'间隔 '+gap+'：比较 '+a[j-gap]+' 与 '+key);if(a[j-gap]<=key)break;context.phase='shift';write(j,a[j-gap],'间隔 '+gap+'：右移 '+a[j-gap]);j-=gap}context.j=j;context.phase='insert';write(j,key,'间隔 '+gap+'：插入 '+key)}round('完成一轮 gap = '+gap)}
 }else if(algorithm==='merge'){
  function merge(l,r){if(r-l<=1)return;let m=l+Math.floor((r-l)/2);merge(l,m);merge(m,r);const left=a.slice(l,m),right=a.slice(m,r);let i=0,j=0,k=l;context={type:'merge',left,right,range:[l,r],leftIndex:0,rightIndex:0,writeIndex:l,phase:'compare'};while(i<left.length&&j<right.length){context.leftIndex=i;context.rightIndex=j;context.writeIndex=k;context.phase='compare';comparisons++;snap('compare',[k],'归并左右区间：'+left[i]+' vs '+right[j]);if(left[i]<=right[j]){context.phase='write-left';context.writeIndex=k;write(k++,left[i++],'归并写入左侧值');context.leftIndex=i}
   else{context.phase='write-right';context.writeIndex=k;write(k++,right[j++],'归并写入右侧值');context.rightIndex=j}}while(i<left.length){context.phase='flush-left';context.writeIndex=k;context.leftIndex=i;write(k++,left[i++],'写入左侧余项')}while(j<right.length){context.phase='flush-right';context.writeIndex=k;context.rightIndex=j;write(k++,right[j++],'写入右侧余项')}round('归并区间 ['+l+', '+(r-1)+']',Array.from({length:r-l},(_,i)=>l+i))}merge(0,n)
 }else if(algorithm==='quick'){
  const stack=[[0,n-1]];while(stack.length){let [lo,hi]=stack.pop();if(lo>=hi)continue;const pivot=a[lo+Math.floor((hi-lo)/2)];let i=lo,j=hi;context={type:'quick',pivot,lo,hi,i,j,phase:'partition'};while(i<=j){while(i<=hi){context.i=i;context.j=j;compareValue(i,pivot,'与枢轴 '+pivot+' 比较');if(a[i]>=pivot)break;i++}while(j>=lo){context.i=i;context.j=j;compareValue(j,pivot,'与枢轴 '+pivot+' 比较');if(a[j]<=pivot)break;j--}if(i<=j){context.i=i;context.j=j;context.phase='swap';swap(i,j,'围绕枢轴 '+pivot+' 交换');i++;j--;context.phase='partition'}}if(lo<j)stack.push([lo,j]);if(i<hi)stack.push([i,hi]);round('枢轴 '+pivot+' 已分割区间 ['+lo+', '+hi+']');}
 }else if(algorithm==='heap'){
  function down(start,end){let root=start;context={type:'heap',root,end,phase:'sift',selected:[root]};while(root*2+1<=end){let child=root*2+1;context={type:'heap',root,end,left:child,right:child+1<=end?child+1:null,phase:'sift',selected:[root,child,child+1<=end?child+1:null].filter(v=>v!==null)};if(child+1<=end){cmp(child,child+1,'寻找更大的孩子');if(a[child]<a[child+1])child++}cmp(root,child,'比较堆顶与孩子');if(a[root]>=a[child])return;context.selected=[root,child];context.phase='swap';swap(root,child,'最大堆：交换父子');root=child;context.phase='sift'}}
  for(let i=Math.floor(n/2)-1;i>=0;i--)down(i,n-1);
  round('最大堆构建完成');
  for(let end=n-1;end>0;end--){context={type:'heap',root:0,end:end-1,selected:[0,end],phase:'extract'};swap(0,end,'把当前最大值放到右端');context={type:'heap',root:0,end:end-1,phase:'sift',selected:[0]};down(0,end-1);round('右侧 '+(n-end)+' 个元素已归位',Array.from({length:n-end},(_,k)=>end+k))}
 }else if(algorithm==='counting'){
  if(n){
   const min=Math.min(...a),max=Math.max(...a),range=max-min+1,dense=Number.isSafeInteger(range)&&range<=65536;
   const histogram=dense?new Uint32Array(range):new Map(),seen=new Set();
   const get=v=>dense?histogram[v-min]:(histogram.get(v)||0);
   const set=(v,k)=>{if(dense)histogram[v-min]=k;else histogram.set(v,k);seen.add(v)};
   const entries=()=>[...seen].sort((u,v)=>u-v).map(v=>[v,get(v)]);
   for(let i=0;i<n;i++){const value=a[i];set(value,get(value)+1);
    context={type:'counting',mode:dense?'dense':'sparse-fallback',range,counts:entries(),phase:'count',activeKey:value,sourceIndex:i};
    snap('count',[i],'计数 '+value+'，出现 '+get(value)+' 次')}
   const keys=dense?Array.from({length:range},(_,i)=>i+min):[...seen].sort((u,v)=>u-v);
   let k=0;for(const v of keys){while(get(v)>0){set(v,get(v)-1);
    context={type:'counting',mode:dense?'dense':'sparse-fallback',range,counts:entries(),phase:'write',activeKey:v,sourceIndex:null,writeIndex:k};
    write(k++,v,'从计数桶写入 '+v)}}
   round(dense?'数组计数排序：按频次完成写回':'数值跨度过大：使用稀疏频次回退')
  }
 }else if(algorithm==='radix'){
  if(n){let neg=a.filter(v=>v<0).map(v=>-v),pos=a.filter(v=>v>=0);const mixed=neg.map(v=>-v).concat(pos);for(let i=0;i<n;i++)write(i,mixed[i],'负数与非负数分组');round('分组完成：先处理负数的绝对值');
   function digits(values,isNeg){if(!values.length)return values;let max=Math.max(...values);for(let exp=1;exp<=max;exp*=10){const buckets=Array.from({length:10},()=>[]);for(const v of values){const digit=Math.floor(v/exp)%10;buckets[digit].push(v);context={type:'radix',exp,digit,buckets:buckets.map(b=>b.slice()),sign:isNeg?'negative':'positive',phase:'distribute',activeBucket:digit,activeValue:isNeg?-v:v};snap('bucket',[],'按数位 '+exp+' 将 '+(isNeg?-v:v)+' 放入 '+digit+' 号桶')}values=buckets.flat();const out=isNeg?values.map(v=>-v).concat(pos):neg.map(v=>-v).concat(values);context={type:'radix',exp,digit:null,buckets:buckets.map(b=>b.slice()),sign:isNeg?'negative':'positive',phase:'collect',activeBucket:null,activeValue:null};for(let i=0;i<out.length;i++){context.writeIndex=i;write(i,out[i],(isNeg?'负数':'非负数')+'按数位 '+exp+' 重排')}round((isNeg?'负数':'非负数')+'：完成数位 '+exp);if(exp>Number.MAX_SAFE_INTEGER/10)break}return values}
   neg=digits(neg,true);pos=digits(pos,false);neg.reverse();const out=neg.map(v=>-v).concat(pos);for(let i=0;i<n;i++)write(i,out[i],'拼接有序负数与非负数');round('基数排序完成')
  }
 }else if(algorithm==='bucket'){
  if(n>1){const min=Math.min(...a),max=Math.max(...a),count=Math.max(1,Math.ceil(Math.sqrt(n))),buckets=Array.from({length:count},()=>[]);
   if(min===max){round('所有数据相等，无需移动')}else{for(let i=0;i<n;i++){const idx=Math.min(count-1,Math.floor((a[i]-min)/(max-min)*count));buckets[idx].push(a[i]);context={type:'bucket',buckets:buckets.map(b=>b.slice()),min,max,selected:idx,phase:'distribute',activeValue:a[i]};snap('bucket',[i],'将 '+a[i]+' 分配到桶 '+(idx+1)+'/'+count)}round('完成 '+count+' 个桶的分配');let k=0;for(let bi=0;bi<count;bi++){const b=buckets[bi];const update=(phase,focus)=>{context={type:'bucket',buckets:buckets.map(q=>q.slice()),min,max,selected:bi,phase,focus}};update('sort',null);
    for(let i=1;i<b.length;i++){const key=b[i];let j=i-1;while(j>=0){update('sort',j);comparisons++;snap('compare',[],'桶 '+(bi+1)+' 内比较 '+b[j]+' 与 '+key);
      if(b[j]<=key)break;b[j+1]=b[j];update('shift',j+1);writes++;snap('bucket-write',[],'桶 '+(bi+1)+' 内右移 '+b[j]);j--}
     b[j+1]=key;update('insert',j+1);writes++;snap('bucket-write',[],'桶 '+(bi+1)+' 内插入 '+key)}
    for(const v of b){update('collect',null);write(k++,v,'按序写出桶 '+(bi+1))}
    update('complete',null);round('桶 '+(bi+1)+' 合并完成')}}}
 }
 if(!frames.length||frames[frames.length-1].kind!=='complete'){snap('complete',[],'排序完成！',Array.from({length:n},(_,i)=>i))}
 return frames;
}
