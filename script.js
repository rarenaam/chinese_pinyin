const $ = s => document.querySelector(s);

const $$ = s => [...document.querySelectorAll(s)];

let data=[], deck=[], current=null, index=0, score=0, timerId=null, remaining=0, answered=false;

let results=JSON.parse(localStorage.getItem('pinyinStudioResults')||'[]');

let streak=Number(localStorage.getItem('pinyinStudioStreak')||0);

let sessionTotal=10;

const initials=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','w','y'];

const finals=['a','o','e','i','u','ü','ai','ei','ui','ao','ou','iu','ie','üe','er','an','en','in','un','ün','ang','eng','ing','ong'];

const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/u:/g,'ü').replace(/\s+/g,'');

function selected(name){return $(`input[name="${name}"]:checked`).value}

function setFeedback(text,kind=''){const el=$('#feedback');el.textContent=text;el.className='feedback '+kind}

function updateStats(){

 $('#statPlayed').textContent=results.length;

 const correct=results.filter(x=>x.correct).length;

 $('#statAccuracy').textContent=results.length?Math.round(correct/results.length*100)+'%':'—';

 $('#statStreak').textContent=streak;

 $('#recentResults').innerHTML=results.length?results.slice(-8).reverse().map(r=>`<div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #29395f;padding:10px 0"><span>${r.correct?'✓':'✕'} ${r.answer||'—'} <small style="color:#a8b6df">(${r.expected})</small></span><span style="color:#a8b6df;font-size:12px">${r.correct?'Goed':'Fout'}</span></div>`).join(''):'Speel je eerste quiz om hier resultaten te zien.';

}

function showPage(page){

 ['quiz','groups','stats'].forEach(p=>$('#'+p+'Page').classList.toggle('hidden',p!==page));

 $$('.navitem').forEach(b=>b.classList.toggle('active',b.dataset.page===page));

 $('#pageTitle').textContent=({quiz:'Jouw luisterquiz',groups:'Oefenen per groep',stats:'Jouw statistieken'})[page];

 if(page==='stats')updateStats();

}

$$('.navitem').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));

$$('input[name="group"]').forEach(r=>r.addEventListener('change',()=>$('#customWrap').classList.toggle('visible',selected('group')==='custom')));

async function loadData(){

 try{const response=await fetch('./data.json');if(!response.ok)throw new Error('data.json niet gevonden');data=await response.json();$('#voiceStatus').textContent='● '+data.length+' klankcombinaties';}

 catch(e){$('#voiceStatus').textContent='Data niet geladen';setFeedback('Kon data.json niet laden. Upload index.html én data.json naar dezelfde GitHub-map.','bad');}

}

function matchingEntries(){

 let pool=data.slice(); const group=selected('group');

 if(group==='initial')pool=pool.filter(x=>{let onset=initials.find(i=>x.base.startsWith(i));return !!onset});

 if(group==='final')pool=pool.filter(x=>finals.some(f=>x.base===f||x.base.endsWith(f)));

 if(group==='custom'){

  const wanted=$('#customInput').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);

  pool=pool.filter(x=>wanted.includes(x.base));

 }

 const tone=selected('tones');if(tone!=='all')pool=pool.filter(x=>x.tone===Number(tone));

 return pool;

}

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function startQuiz(){

 if(!data.length){setFeedback('De dataset is nog niet geladen. Controleer of data.json naast index.html staat.','bad');return}

 const pool=matchingEntries();

 if(!pool.length){setFeedback('Geen klanken gevonden. Controleer je groep of eigen selectie.','bad');return}

 sessionTotal=Number($('#amount').value);deck=shuffle(pool).slice(0,Math.min(sessionTotal,pool.length));index=0;score=0;

 showPage('quiz');nextQuestion();

}

function nextQuestion(){

 clearInterval(timerId);answered=false;

 if(index>=deck.length){

  $('#questionCount').textContent=`${deck.length} / ${deck.length}`;$('#progressBar').style.width='100%';$('#timer').textContent='✓ Klaar';

  $('#soundLabel').textContent=`Quiz afgerond — ${score} van ${deck.length} goed`;$('#playBtn').textContent='✓';$('#playBtn').disabled=true;

  $('#answerInput').disabled=true;$('#checkBtn').disabled=true;

  setFeedback(`Je score: ${Math.round(score/deck.length*100)}%. Klik op “Start quiz” om opnieuw te oefenen.`,score/deck.length>=.7?'good':'');

  clearInterval(timerId);return;

 }

 current=deck[index];$('#questionCount').textContent=`${index+1} / ${deck.length}`;$('#progressBar').style.width=`${index/deck.length*100}%`;

 $('#soundLabel').textContent='Luister goed en typ de pinyin';$('#playBtn').textContent='♫';$('#playBtn').disabled=false;$('#answerInput').disabled=false;$('#checkBtn').disabled=false;$('#answerInput').value='';$('#answerInput').focus();setFeedback('Tip: je kunt ook pinyin zonder toonaccenten invoeren.');

 const secs=Number($('#seconds').value);remaining=secs;$('#timer').textContent=secs?`◷ ${remaining}s`:'◷ Geen timer';

 if(secs){timerId=setInterval(()=>{remaining--;$('#timer').textContent=`◷ ${remaining}s`;if(remaining<=0){clearInterval(timerId);if(!answered)submitAnswer(true)}},1000)}

 // Call speech synchronously during the user's click/submit action.

 // This avoids browsers blocking delayed speech as autoplay.

 playSound();

}

function playSound(){

 // The large sound button is also a convenient way to start the first quiz.

 if(!current){startQuiz();return;}

 if(!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance==='undefined'){

  setFeedback('Deze browser ondersteunt geen spraakaudio. Probeer de website in Chrome or Edge.','bad');

  $('#voiceStatus').textContent='Audio niet ondersteund';

  return;

 }

 const synth=window.speechSynthesis;

 synth.cancel();

 const utterance=new SpeechSynthesisUtterance(current.hanzi);

 utterance.lang='zh-CN';utterance.rate=.78;utterance.pitch=1;

 const voices=synth.getVoices();

 const zh=voices.find(v=>/^zh(?:[-_](?:CN|Hans|TW|HK|SG))?$/i.test(v.lang))||voices.find(v=>v.lang.toLowerCase().startsWith('zh'));

 if(zh){utterance.voice=zh;utterance.lang=zh.lang;$('#voiceStatus').textContent='Chinese stem: '+zh.name;}

 else {$('#voiceStatus').textContent='Chinese stem wordt gezocht';}

 utterance.onstart=()=>{if(zh)$('#voiceStatus').textContent='● Audio speelt';};

 utterance.onend=()=>{if(zh)$('#voiceStatus').textContent='● Audio klaar';};

 utterance.onerror=(event)=>{

  const detail=event && event.error ? ' ('+event.error+')' : '';

  setFeedback('De browser kon de Chinese uitspraak niet afspelen'+detail+'. Controleer of je apparaat een Chinese spraakstem heeft en of het geluid aanstaat.','bad');

  $('#voiceStatus').textContent='Audio mislukt';

 };

 if(!zh){setFeedback('Geen aparte Chinese stem gevonden. De browser probeert het toch; als je niets hoort, installeer dan een Chinese spraakstem in je apparaatinstellingen.','');}

 try{synth.speak(utterance);}catch(err){

  setFeedback('Audio starten is mislukt. Probeer Chrome of Edge en controleer de spraaksteminstellingen.','bad');

  $('#voiceStatus').textContent='Audio mislukt';

 }

}

function submitAnswer(timeout=false){

 if(answered||!current)return;

 if(!timeout&&!$('#answerInput').value.trim()){$('#answerInput').focus();return}

 answered=true;clearInterval(timerId);

 const answer=timeout?'':$('#answerInput').value.trim();

 const correct=normalize(answer)===normalize(current.pinyin);

 if(correct)score++;

 results.push({answer,expected:current.pinyin,correct,base:current.base,tone:current.tone,at:Date.now()});

 if(results.length>200)results=results.slice(-200);

 streak=correct?streak+1:0;

 localStorage.setItem('pinyinStudioResults',JSON.stringify(results));localStorage.setItem('pinyinStudioStreak',String(streak));

 if(correct){setFeedback('Goed! ✓ '+current.pinyin+' — '+current.hanzi,'good')}

 else{setFeedback((timeout?'Tijd voorbij. ':'Niet helemaal. ')+'Antwoord: '+current.pinyin+' ('+current.hanzi+')', 'bad')}

 $('#soundLabel').textContent=current.hanzi+' · '+current.pinyin;

 $('#checkBtn').textContent=index===deck.length-1?'Resultaat bekijken →':'Volgende vraag →';

}

$('#answerForm').addEventListener('submit',e=>{e.preventDefault();if(answered){index++;$('#checkBtn').textContent='Controleren ↗';nextQuestion()}else submitAnswer()});

$('#playBtn').addEventListener('click',playSound);

$('#skipBtn').addEventListener('click',()=>{if(current){if(!answered){answered=true;clearInterval(timerId);results.push({answer:'',expected:current.pinyin,correct:false,base:current.base,tone:current.tone,at:Date.now()});localStorage.setItem('pinyinStudioResults',JSON.stringify(results));streak=0;localStorage.setItem('pinyinStudioStreak','0')}index++;$('#checkBtn').textContent='Controleren ↗';nextQuestion()}});

$('#startBtn').addEventListener('click',startQuiz);

$$('.jumpGroup').forEach(b=>b.addEventListener('click',()=>{const r=$(`input[name="group"][value="${b.dataset.group}"]`);r.checked=true;$('#customWrap').classList.toggle('visible',b.dataset.group==='custom');showPage('quiz');if(b.dataset.group==='custom')$('#customInput').focus()}));

$('#resetStats').addEventListener('click',()=>{if(confirm('Weet je zeker dat je alle lokale statistieken wilt wissen?')){results=[];streak=0;localStorage.removeItem('pinyinStudioResults');localStorage.removeItem('pinyinStudioStreak');updateStats()}});

if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

loadData();
