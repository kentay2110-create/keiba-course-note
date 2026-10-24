'use strict';
const venues=['札幌','函館','福島','新潟','東京','中山','中京','京都','阪神','小倉'];
// 選択可能距離は編集可能なノートの入口。実施の有無は各レースの出馬表で確認。
const distances={'芝':[1000,1200,1400,1500,1600,1700,1800,2000,2200,2300,2400,2500,2600,3000,3200,3400,3600],'ダート':[1000,1150,1200,1300,1400,1600,1700,1800,1900,2000,2100,2400,2500]};
const starter={};
let courseData=null;
async function loadPublishedCourses(){
  try { const r=await fetch('./course-data.json',{cache:'no-cache'});if(!r.ok)throw Error('コースデータを取得できません');courseData=await r.json();for(const c of courseData.courses){starter[c.id]={fact:c.shape,source:c.evidence,shape:c.shape,trend:c.trend,checks:c.checks,memo:''};}refreshDistances(); }
  catch(err){document.getElementById('saveStatus').textContent='公開データの読み込みに失敗しました。通信状態を確認してください。';}
}
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString('ja-JP');
let notes={};try{const x=JSON.parse(localStorage.getItem('race-course-notes-v1')||'{}');if(x&&typeof x==='object'&&!Array.isArray(x))notes=x;}catch(e){}
function key(){return `${$('venue').value}|${$('surface').value}|${$('distance').value}`;}
function loadCourse(){const k=key(),preset=starter[k]||{},item=notes[k]||preset;$('courseName').textContent=`${$('venue').value}｜${$('surface').value}${$('distance').selectedOptions[0]?.text||$('distance').value+'m'}`;$('verified').innerHTML='';const b=document.createElement('strong');b.textContent=preset.fact?'初期登録のコース概要':'基本情報は未登録';const p=document.createElement('div');p.textContent=preset.fact||'公開データ未登録。コースの特性はJRAなどで確認してください。'; if(courseData && ['東京','京都'].includes($('venue').value)){const c=courseData.courses.find(x=>x.id===k);if(c){p.textContent+='\n【注意】'+c.caution;}else{const c=courseData.commonByVenue?.[$('venue').value];if(c)p.textContent+='\n【共通】'+c.officialFacts.join('／');}}$('verified').append(b,p);for(const f of ['shape','trend','checks','memo'])$(f).value=typeof item[f]==='string'?item[f]:'';$('saveStatus').textContent=notes[k]?'保存済みのメモを表示中':'';}
function refreshDistances(){
 const prev=$('distance').value,venue=$('venue').value,surface=$('surface').value;
 let options=[];
 if(courseData && ['東京','京都'].includes(venue)){
   options=courseData.courses.filter(c=>c.venue===venue && c.surface===surface)
     .map(c=>({value:c.id.split('|')[2],label:`${c.distance}m${c.variant?'（'+c.variant+'回り）':''}`}))
     .sort((a,b)=>parseInt(a.value)-parseInt(b.value) || a.label.localeCompare(b.label,'ja'));
 }else options=distances[surface].map(d=>({value:String(d),label:`${d}m`}));
 $('distance').replaceChildren(...options.map(o=>new Option(o.label,o.value)));
 if(options.some(o=>o.value===prev))$('distance').value=prev;
 else {const v=options.find(o=>o.value==='1600'||o.value==='1600-外');if(v)$('distance').value=v.value;else $('distance').selectedIndex=0;}
 loadCourse();
}
$('venue').replaceChildren(...venues.map(v=>new Option(v+'競馬場',v)));
$('venue').value='東京';$('surface').value='芝';refreshDistances();
$('venue').addEventListener('change',refreshDistances);
$('surface').addEventListener('change',refreshDistances);$('distance').addEventListener('change',loadCourse);
$('save').addEventListener('click',()=>{notes[key()]=Object.fromEntries(['shape','trend','checks','memo'].map(k=>[k,$(k).value]));try{localStorage.setItem('race-course-notes-v1',JSON.stringify(notes));$('saveStatus').textContent='保存しました。この端末のブラウザに保存されています。';}catch(e){$('saveStatus').textContent='保存できませんでした。端末の空き容量・ブラウザ設定を確認してください。';}});
$('reset').addEventListener('click',loadCourse);
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-page]').forEach(t=>t.classList.toggle('active',t===b));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===b.dataset.page));}));
for(let n=5;n<=18;n++)$('horses').add(new Option(`${n}頭`,String(n)));$('horses').value='16';
function calc(){const n=Number($('horses').value),type=$('bet').value,a=n*(n-1)/2;const combos=type==='wide'||type==='quinella'?a:type==='exacta'?n*(n-1):type==='trio'?a*(n-2)/3:n*(n-1)*(n-2);let tickets=Number($('tickets').value);tickets=Number.isFinite(tickets)?Math.max(0,Math.min(combos,Math.floor(tickets))):0;const covered=tickets/combos;const winning=type==='wide'?(tickets===1?3/a:NaN):covered;$('total').textContent=fmt(combos)+'通り';$('share').textContent=(covered*100).toFixed(2)+'%';$('chance').textContent=Number.isFinite(winning)&&winning>0?`約${fmt(Math.round(1/winning))}分の1`:'—';$('percent').textContent=Number.isFinite(winning)?(winning*100).toFixed(3)+'%':'買い目の組み合わせによって異なります';$('calcNote').textContent=type==='wide'?'ワイドは3着以内の2頭を選ぶ方式です。1点買いの参考確率は8頭以上・全着順等確率のモデルです。複数点の的中確率は組み合わせ次第なので表示しません。':'すべての着順が等確率、異なる組み合わせを購入すると仮定した数学上の値。実際の的中確率・回収率ではありません。';}
['horses','bet','tickets'].forEach(id=>$(id).addEventListener('input',calc));calc();
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),notes},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='keiba-course-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
$('import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2_000_000)throw Error('ファイルが大きすぎます');const data=JSON.parse(await file.text());if(data.version!==1||!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error('対応していないファイルです');if(!confirm('現在のメモを復元データで上書きします。よろしいですか？'))return;const clean={};for(const [k,v] of Object.entries(data.notes)){if(!/^.+\|(芝|ダート)\|\d+(?:-(?:内|外))?$/.test(k)||!v||typeof v!=='object')continue;clean[k]={};for(const f of ['shape','trend','checks','memo'])clean[k][f]=String(v[f]||'').slice(0,20000);}localStorage.setItem('race-course-notes-v1',JSON.stringify(clean));notes=clean;loadCourse();$('importStatus').textContent='復元しました。';}catch(err){$('importStatus').textContent='復元できませんでした：'+err.message;}finally{e.target.value='';}});
loadPublishedCourses();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
