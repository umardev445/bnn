import {CONFIG} from './config.js';
import {Store} from './store.mjs';
import {STORAGE_KEY,uid,nowDate,parseAmount,amountInput,escapeHtml as e,formatMoney,validateState,customerBalance,totals,sortedEntries,ledgerCSV,MAX_CUSTOMERS,MAX_ENTRIES,MAX_BACKUP_BYTES,CURRENCIES} from './core.mjs';
import {translate} from './i18n.mjs';
import {icon} from './icons.mjs';

const $=selector=>document.querySelector(selector);
const store=new Store();
let state;
let filter='all',clientSearch='',entrySearch='',installPrompt=null;
const t=key=>translate(state?.settings.locale||'en',key);
const money=n=>e(formatMoney(n,state.settings.currency,state.settings.locale));
const label=key=>e(t(key));
const btn=(text,action,ic='plus',cls='btn-primary',attrs='')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${icon(ic)}${e(text)}</button>`;
const iBtn=(action,text,ic,id='')=>`<button type="button" class="icon-button" data-action="${action}" aria-label="${e(text)}" title="${e(text)}" ${id?`data-id="${e(id)}"`:''}>${icon(ic)}</button>`;
const fmtDate=v=>{try {return new Intl.DateTimeFormat(state.settings.locale==='ur'?'ur-PK':'en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${v}T12:00:00Z`));}catch{return v;}};
function toast(message,error=false){const n=document.createElement('div');n.className='toast'+(error?' error':'');n.textContent=message;$('#toasts').append(n);setTimeout(()=>n.remove(),error?8500:4000);}
function fail(ex){toast(ex?.message||t('invalid'),true);}
function go(hash){location.hash=hash;}
function currentRoute(){const hash=decodeURIComponent(location.hash.slice(1));return /^(home|customers|ledger|settings)$/.test(hash)?hash:/^customer\/[a-zA-Z0-9_-]{1,80}$/.test(hash)?hash:'home';}
function currentName(){const route=currentRoute();return route.startsWith('customer/')?'customers':route;}
function changeSettings(changes){state=store.update(s=>Object.assign(s.settings,changes));render();}
function applyPrefs(){document.documentElement.lang=state.settings.locale;document.documentElement.dir=state.settings.locale==='ur'?'rtl':'ltr';document.documentElement.dataset.theme=state.settings.theme;$('meta[name="theme-color"]').content=state.settings.theme==='dark'?'#202e25':'#174d3b';}
function render(){
  applyPrefs();
  const route=currentRoute(),active=currentName();
  const nav=[['home','home'],['customers','people'],['ledger','bill'],['settings','shop']];
  const links=nav.map(([r,ic])=>`<a href="#${r}" class="nav-link ${active===r?'active':''}" ${active===r?'aria-current="page"':''}>${icon(ic)}<span>${label(r)}</span></a>`).join('');
  const brand=`<img src="./assets/icon.svg" alt=""><span>KhataBanao</span>`;
  $('#app').innerHTML=`<div class="layout"><aside class="sidebar"><a class="brand" href="#home" aria-label="KhataBanao home">${brand}</a><div class="workspace-label">${label('workspace')}</div><nav class="nav" aria-label="Main navigation">${links}</nav><div class="sidebar-bottom"><div class="local-card">${icon('shield')}<span>${label('local')}</span></div><div class="sidebar-links"><a href="./help.html">${label('help')}</a><div class="pair"><a href="./privacy.html">${label('privacy')}</a><a href="./terms.html">${label('terms')}</a></div></div><div class="version">KHATABANAO / v${e(CONFIG.version)}</div></div></aside><div class="content"><header class="topbar"><a href="#home" class="brand mobile-brand">${brand}</a><div class="breadcrumb">${label('workspace')} <span> / </span><strong>${label(active)}</strong></div><div class="top-actions"><span class="connection"><span class="status-dot"></span>${label(navigator.onLine?'online':'offline')}</span>${iBtn('theme',t('appearance'),state.settings.theme==='dark'?'sun':'moon')}<button class="lang-button" type="button" data-action="language" aria-label="Change language">${state.settings.locale==='ur'?'English':'اردو'}</button><a class="avatar" href="#settings" title="${label('settings')}">${e(state.settings.business.slice(0,2).toUpperCase())}</a></div></header><main id="main" class="main" tabindex="-1">${route==='home'?homeView():route==='customers'?customersView():route==='ledger'?ledgerView():route==='settings'?settingsView():customerDetail(route.split('/')[1])}<footer class="main-footer"><span>${label('footer')}</span><span>${icon('shield')}${label('connected')}</span></footer></main></div><nav class="bottom-nav" aria-label="Mobile navigation">${nav.map(([r,ic])=>`<a href="#${r}" class="${active===r?'active':''}" ${active===r?'aria-current="page"':''}>${icon(ic)}<span>${label(r)}</span></a>`).join('')}</nav></div>`;
}
function empty(title,text,action='new-customer',cta='addCustomer',ic='people'){
  return `<div class="empty"><div class="empty-icon">${icon(ic)}</div><h3>${label(title)}</h3><p>${label(text)}</p>${action?btn(t(cta),action):''}</div>`;
}
function amountBadge(balance){return balance>0?`<span class="balance-pill pending">${money(balance)}</span>`:balance<0?`<span class="balance-pill advance">+ ${money(-balance)}</span>`:`<span class="balance-pill settled">${money(0)}</span>`;}
function customerLink(id,name){return `<a class="record-link" href="#customer/${e(id)}">${e(name)}</a>`;}
function summaryCards(){const sum=totals(state);return `<section aria-label="${label('allTime')}"><div class="section-head"><h2>${label('allTime')}</h2><span class="currency-chip">${e(state.settings.currency)}</span></div><div class="stats">${[['outstanding',sum.outstanding,'wallet'],['credit',sum.due,'trend'],['received',sum.paid,'check']].map(([k,v,ic])=>`<article class="stat"><div class="stat-head"><span>${label(k)}</span><span class="stat-icon">${icon(ic)}</span></div><div class="stat-amount mono">${money(v)}</div><div class="stat-foot">${state.customers.length} ${label('totalCustomers')} · ${e(state.settings.currency)}</div></article>`).join('')}</div></section>`;}
function hero(){return `<section class="hero"><div class="hero-copy"><div class="eyebrow">KHATABANAO / ${label('workspace')}</div><h1>${label('welcome')}<br><span>${label('welcome2')}</span></h1><p>${label('heroText')}</p><div class="hero-buttons">${btn(t('addCustomer'),'new-customer')}${btn(t('newEntry'),'new-entry','arrow','btn-ghost')}</div></div><div class="hero-art" aria-hidden="true"><div class="art-dot"></div><div class="art-paper"><div class="art-logo">${icon('wallet')}</div><div class="art-label">KHATA LEDGER</div><div class="art-lines"><i></i><i></i><i></i></div><div class="art-lines"><i></i><i></i><i></i></div><div class="art-total"><span>BALANCE</span><strong>8,450.00</strong></div></div><div class="art-check">${icon('check')}</div></div></section>`;}
function entryTable(list,compact=false){if(!list.length)return empty('noActivity','noActivityText',state.customers.length?'new-entry':'new-customer',state.customers.length?'newEntry':'addCustomer','bill');
  const customerMap=new Map(state.customers.map(c=>[c.id,c]));
  return `<div class="ledger-list">${list.map(x=>{
    const c=customerMap.get(x.customerId);
    const giving=x.type==='due';
    return `<article class="ledger-row"><div class="entry-mark ${giving?'debit':'credit'}">${icon(giving?'trend':'check')}</div><div class="ledger-descr"><strong>${c?customerLink(c.id,c.name):'—'}</strong><div class="ledger-meta">${e(fmtDate(x.date))}${x.note?` · ${e(x.note)}`:''}</div></div><div class="ledger-value"><strong class="mono ${giving?'debit-text':'credit-text'}">${giving?'+':'−'} ${money(x.amount)}</strong><span>${label(giving?'dueLabel':'paid')}</span></div>${compact?'':`<div class="ledger-buttons">${iBtn('edit-entry',t('edit'),'edit',x.id)}${iBtn('delete-entry',t('delete'),'trash',x.id)}</div>`}</article>`;
  }).join('')}</div>`;
}
function homeView(){
  const latest=sortedEntries(state.entries).slice(0,5);
  const collection=state.customers.map(c=>({c,balance:customerBalance(state.entries,c.id)})).filter(x=>x.balance>0).sort((a,b)=>b.balance-a.balance).slice(0,4);
  return `${hero()}${summaryCards()}<div class="dashboard-grid"><section class="panel"><div class="panel-header"><h2>${label('recent')}</h2><a class="text-link" href="#ledger">${label('viewAll')}${icon('arrow')}</a></div>${latest.length?entryTable(latest,true):empty('noActivity','noActivityText',state.customers.length?'new-entry':'new-customer',state.customers.length?'newEntry':'addCustomer','bill')}</section><aside class="dashboard-aside"><section class="mini-card quote-card"><div class="mini-icon">${icon('spark')}</div><h3>${label('quickEntry')}</h3><p>${label('quickText')}</p>${btn(t('start'),'new-entry','arrow','btn-light')}</section><section class="mini-card"><div class="mini-icon">${icon('shield')}</div><h3>${label('backupTip')}</h3><p>${label('backupText')}</p>${btn(t('backup'),'backup','download','btn-light')}</section></aside></div>${collection.length?`<section class="top-debtors"><div class="section-head"><h2>${label('outstanding')}</h2><a class="text-link" href="#customers">${label('viewAll')}${icon('arrow')}</a></div><div class="debt-grid">${collection.map(({c,balance})=>`<a href="#customer/${e(c.id)}" class="debt-card"><span class="client-avatar">${e(c.name.slice(0,2).toUpperCase())}</span><span><strong>${e(c.name)}</strong><small>${money(balance)}</small></span>${icon('chevron')}</a>`).join('')}</div></section>`:''}`;
}
function customerCards(){
  const q=clientSearch.trim().toLocaleLowerCase();
  const customers=state.customers.filter(c=>`${c.name} ${c.phone}`.toLocaleLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  if(!customers.length)return `<section class="panel">${state.customers.length?empty('noMatch','noMatchText',null):empty('noCustomers','noCustomersText')}</section>`;
  return `<section class="client-grid">${customers.map(c=>{const bal=customerBalance(state.entries,c.id);const count=state.entries.filter(x=>x.customerId===c.id).length;return `<article class="client-card"><div class="client-card-head"><div class="client-avatar">${e(c.name.slice(0,2).toUpperCase())}</div>${iBtn('edit-customer',t('edit'),'edit',c.id)}</div><h3>${customerLink(c.id,c.name)}</h3><p>${e(c.phone||'—')}</p><div class="customer-amount">${amountBadge(bal)}</div><div class="card-foot"><span>${count} ${label('ledger')}</span><a class="text-link" href="#customer/${e(c.id)}">${label('openCustomer')}${icon('arrow')}</a></div></article>`;}).join('')}</section>`;
}
function customersView(){return `<div class="page-heading"><div><div class="eyebrow">KHATABANAO / ${state.customers.length} ${label('totalCustomers')}</div><h1>${label('customers')}</h1><p>${label('heroText')}</p></div>${btn(t('addCustomer'),'new-customer')}</div><div class="toolbar"><label class="search-box">${icon('search')}<input id="customer-search" type="search" autocomplete="off" value="${e(clientSearch)}" placeholder="${label('searchCustomers')}" aria-label="${label('searchCustomers')}"></label></div><div id="customer-results">${customerCards()}</div>`;}
function ledgerResults(){
  const q=entrySearch.trim().toLocaleLowerCase();const names=new Map(state.customers.map(c=>[c.id,c.name]));
  const rows=sortedEntries(state.entries).filter(x=>(filter==='all'||x.type===filter)&&(!q||`${names.get(x.customerId)} ${x.note} ${x.date}`.toLocaleLowerCase().includes(q)));
  return rows.length?entryTable(rows):`<section class="panel">${state.entries.length?empty('noMatch','noMatchText',null):empty('noActivity','noActivityText',state.customers.length?'new-entry':'new-customer',state.customers.length?'newEntry':'addCustomer','bill')}</section>`;
}
function ledgerView(){return `<div class="page-heading"><div><div class="eyebrow">KHATABANAO / ${state.entries.length} ${label('ledger')}</div><h1>${label('ledger')}</h1><p>${label('helpNote')}</p></div>${btn(t('newEntry'),'new-entry')}</div><div class="toolbar"><div class="tabs" role="group" aria-label="Entry filters">${['all','due','payment'].map(v=>`<button class="tab ${v===filter?'active':''}" type="button" data-action="filter" data-filter="${v}" aria-pressed="${v===filter}">${label(v)}</button>`).join('')}</div><label class="search-box">${icon('search')}<input id="entry-search" type="search" autocomplete="off" value="${e(entrySearch)}" placeholder="${label('searchEntries')}" aria-label="${label('searchEntries')}"></label></div><div id="entry-results" class="panel">${ledgerResults()}</div>`;}
function customerDetail(id){
  const c=state.customers.find(x=>x.id===id);
  if(!c)return `<div class="page-heading"><h1>${label('noMatch')}</h1></div><a class="btn btn-light" href="#customers">${icon('arrow')}${label('back')}</a>`;
  const entries=sortedEntries(state.entries.filter(x=>x.customerId===id)),balance=customerBalance(state.entries,id);
  const given=entries.filter(x=>x.type==='due').reduce((s,x)=>s+x.amount,0),paid=entries.filter(x=>x.type==='payment').reduce((s,x)=>s+x.amount,0);
  return `<div class="page-heading"><div><a href="#customers" class="small-link">← ${label('back')}</a><div class="eyebrow">KHATABANAO / ${label('details')}</div><h1>${e(c.name)}</h1><p>${e(c.phone||c.note||'')}</p></div><div class="heading-actions">${btn(t('statement'),'statement','print','btn-light',`data-id="${e(id)}"`)}${btn(t('newEntry'),'new-entry','plus','btn-primary',`data-id="${e(id)}"`)}</div></div><section class="stats"><div class="stat"><div class="stat-head">${label('balance')}</div><div class="stat-amount mono">${money(balance)}</div><div class="stat-foot">${balance<0?label('advance'):label('outstanding')}</div></div><div class="stat"><div class="stat-head">${label('credit')}</div><div class="stat-amount mono">${money(given)}</div></div><div class="stat"><div class="stat-head">${label('received')}</div><div class="stat-amount mono">${money(paid)}</div></div></section><div class="panel"><div class="panel-header"><h2>${label('ledger')}</h2><div class="row-actions">${iBtn('edit-customer',t('edit'),'edit',id)}${iBtn('delete-customer',t('delete'),'trash',id)}</div></div>${entries.length?entryTable(entries):empty('noEntries','noActivityText','new-entry','newEntry','bill')}</div>`;
}
function field(name,labelText,value='',options=''){return `<div class="field"><label for="${name}">${e(labelText)}</label><input id="${name}" name="${name}" value="${e(value)}" ${options}></div>`;}
function settingsView(){
  const s=state.settings;
  return `<div class="page-heading"><div><div class="eyebrow">KHATABANAO / ${label('profile')}</div><h1>${label('settingsTitle')}</h1><p>${label('settingsText')}</p></div></div><div class="settings-grid"><form id="settings-form" class="panel form-panel"><h2>${label('settings')}</h2><div class="form-grid" style="margin-block-start:22px">${field('business',t('business'),s.business,'required maxlength="100"')}
  <div class="field"><label for="currency">${label('currency')}</label><select id="currency" name="currency" ${state.entries.length?'disabled':''}>${CURRENCIES.map(k=>`<option value="${k}" ${k===s.currency?'selected':''}>${k}</option>`).join('')}</select>${state.entries.length?`<small class="field-hint">${label('cannotCurrency')}</small>`:''}</div>
  <div class="field"><label for="locale">${label('language')}</label><select name="locale" id="locale"><option value="en" ${s.locale==='en'?'selected':''}>English</option><option value="ur" ${s.locale==='ur'?'selected':''}>اردو</option></select></div>
  <div class="field"><label for="theme">${label('appearance')}</label><select name="theme" id="theme"><option value="light" ${s.theme==='light'?'selected':''}>${label('light')}</option><option value="dark" ${s.theme==='dark'?'selected':''}>${label('dark')}</option></select></div></div><div class="save-row"><button type="submit" class="btn btn-primary">${icon('check')}${label('saveSettings')}</button></div></form><aside><section class="mini-card"><div class="mini-icon">${icon('shield')}</div><h2>${label('yourData')}</h2><p>${label('backupText')}</p><div class="data-actions">${btn(t('backup'),'backup','download','btn-light')}${btn(t('restore'),'restore','upload','btn-light')}${btn(t('exportCSV'),'export-csv','download','btn-light')}${btn(t('sample'),'sample','spark','btn-light')}${btn(t('reset'),'reset','trash','btn-danger')}</div><p class="field-hint" style="margin-block-start:18px">${label('backupNoWebView')}</p></section><section class="mini-card"><h3>${label('help')}</h3><div class="legal-links" style="margin-block-start:16px"><a href="./help.html">${label('help')}${icon('chevron')}</a><a href="./privacy.html">${label('privacy')}${icon('chevron')}</a><a href="./terms.html">${label('terms')}${icon('chevron')}</a><a href="./about.html">About${icon('chevron')}</a></div></section></aside></div>`;
}
function openCustomerDialog(id=''){
  const c=state.customers.find(x=>x.id===id)||{name:'',phone:'',note:''};
  const d=$('#editor');d.innerHTML=`<form id="customer-form" data-id="${e(id)}"><div class="modal-head"><div><div class="eyebrow">KHATABANAO</div><h2>${label(id?'edit':'addCustomer')}</h2></div>${iBtn('close-dialog',t('close'),'close')}</div><div class="modal-body"><div class="form-grid">${field('customer-name',t('name')+' *',c.name,'required maxlength="100" autocomplete="name"')}${field('customer-phone',t('phone'),c.phone,'type="tel" maxlength="40" autocomplete="tel"')}<div class="field full"><label for="customer-note">${label('note')}</label><textarea name="customer-note" id="customer-note" maxlength="500" rows="3">${e(c.note)}</textarea></div></div></div><div class="modal-foot"><button type="button" class="btn btn-light" data-action="close-dialog">${label('cancel')}</button><button type="submit" class="btn btn-primary">${icon('check')}${label('save')}</button></div></form>`;d.showModal();$('#customer-name').focus();
}
function openEntryDialog(id='',preCustomer=''){
  if(!state.customers.length){toast(t('noCustomersText'),true);openCustomerDialog();return;}
  const x=state.entries.find(v=>v.id===id)||{customerId:preCustomer||state.customers[0].id,type:'due',amount:0,date:nowDate(),note:''};
  const choices=state.customers.slice().sort((a,b)=>a.name.localeCompare(b.name));
  const d=$('#editor');d.innerHTML=`<form id="entry-form" data-id="${e(id)}"><div class="modal-head"><div><div class="eyebrow">KHATABANAO</div><h2>${label(id?'edit':'newEntry')}</h2></div>${iBtn('close-dialog',t('close'),'close')}</div><div class="modal-body"><div class="form-grid"><div class="field full"><label for="entry-customer">${label('customer')} *</label><select id="entry-customer" name="entry-customer" required>${choices.map(c=>`<option value="${e(c.id)}" ${c.id===x.customerId?'selected':''}>${e(c.name)}</option>`).join('')}</select></div><div class="field full"><label for="entry-type">${label('type')} *</label><select name="entry-type" id="entry-type"><option value="due" ${x.type==='due'?'selected':''}>${label('giveCredit')}</option><option value="payment" ${x.type==='payment'?'selected':''}>${label('receivePayment')}</option></select></div>${field('entry-amount',t('amount')+' *',x.amount?amountInput(x.amount):'','inputmode="decimal" type="number" min="0.01" max="9999999999.99" step="0.01" required placeholder="0.00"')}${field('entry-date',t('date'),x.date,'type="date" min="2000-01-01" max="2100-12-31" required')}<div class="field full"><label for="entry-note">${label('note')}</label><textarea id="entry-note" name="entry-note" rows="3" maxlength="500" placeholder="e.g. Grocery items, partial payment">${e(x.note)}</textarea></div></div></div><div class="modal-foot"><button type="button" class="btn btn-light" data-action="close-dialog">${label('cancel')}</button><button type="submit" class="btn btn-primary">${icon('check')}${label('save')}</button></div></form>`;d.showModal();$('#entry-amount').focus();
}
function confirmDialog(title,body,confirmLabel=t('confirm'),danger=true){return new Promise(resolve=>{
  const d=$('#confirm');let done=false;
  const finish=answer=>{if(done)return;done=true;d.close();resolve(answer);};
  d.innerHTML=`<div class="modal-head"><h2>${e(title)}</h2></div><div class="modal-body"><p>${e(body)}</p></div><div class="modal-foot"><button class="btn btn-light" type="button" data-choose="no">${label('cancel')}</button><button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" data-choose="yes">${e(confirmLabel)}</button></div>`;
  d.querySelector('[data-choose=no]').onclick=()=>finish(false);
  d.querySelector('[data-choose=yes]').onclick=()=>finish(true);
  d.addEventListener('cancel',evt=>{evt.preventDefault();finish(false);},{once:true});
  d.showModal();
});}
function download(text,filename,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function exportBackup(){const envelope={app:'KhataBanao',backupVersion:1,exportedAt:new Date().toISOString(),data:state};download(JSON.stringify(envelope,null,2),`khatabanao-backup-${nowDate()}.json`,'application/json');toast(t('backupDone'));}
function selectFile(){const input=$('#backup-input');input.value='';input.click();}
async function restoreFile(file){if(!file)return;if(file.size>MAX_BACKUP_BYTES)throw new Error('Backup exceeds 3 MB.');let imported;try{const o=JSON.parse(await file.text());if(o.app!=='KhataBanao'||o.backupVersion!==1)throw new Error();imported=validateState(o.data);}catch{throw new Error(t('backupInvalid'));}
  if(await confirmDialog(t('restore'),t('restoreWarn'),t('restore'))){state=store.restore({...imported,revision:state.revision+1});clientSearch='';entrySearch='';filter='all';render();toast(t('restored'));}}
function printCustomer(id){const c=state.customers.find(x=>x.id===id);if(!c)return;const list=state.entries.filter(x=>x.customerId===id).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));let balance=0;
  $('#print-root').innerHTML=`<section class="statement"><header><h1>${e(state.settings.business)}</h1><p>KhataBanao · ${label('statement')}</p></header><div class="statement-info"><div><strong>${e(c.name)}</strong><p>${e(c.phone)}</p></div><div>${e(nowDate())}</div></div><table><thead><tr><th>${label('date')}</th><th>${label('note')}</th><th>${label('due')}</th><th>${label('payment')}</th><th>${label('balance')}</th></tr></thead><tbody>${list.map(x=>{balance+=x.type==='due'?x.amount:-x.amount;return `<tr><td>${e(x.date)}</td><td>${e(x.note||'—')}</td><td>${x.type==='due'?money(x.amount):'—'}</td><td>${x.type==='payment'?money(x.amount):'—'}</td><td>${money(balance)}</td></tr>`;}).join('')}</tbody></table><div class="statement-summary">${label('balance')}: <strong>${money(balance)}</strong></div><p class="statement-footer">Generated locally with KhataBanao · Not a tax invoice.</p></section>`;
  window.print();
}
function addSample(){const names=[['Ahmed Store','03001234567'],['Fatima Traders','03123456789'],['Ali Electronics','']];
  state=store.update(s=>{const ids=names.map(([name,phone])=>{const id=uid();s.customers.push({id,name,phone,note:'Sample record'});return id;});const values=[[0,'due',125000,'Groceries'],[0,'payment',50000,'Cash received'],[1,'due',245000,'Shop supplies'],[2,'due',89000,'Accessories'],[1,'payment',100000,'Partial payment']];for(const [i,type,amount,note] of values)s.entries.push({id:uid(),customerId:ids[i],type,amount,date:nowDate(),note});});render();toast(t('sampleAdded'));
}
function updateState(mutator){state=store.update(mutator);render();}
function saveCustomer(form){
  const f=new FormData(form),id=form.dataset.id,name=String(f.get('customer-name')||'').trim(),phone=String(f.get('customer-phone')||'').trim(),note=String(f.get('customer-note')||'').trim();
  if(!name||name.length>100||phone.length>40||note.length>500)throw new Error(t('invalid'));
  updateState(s=>{if(id){const c=s.customers.find(x=>x.id===id);if(!c)throw new Error('Customer not found.');Object.assign(c,{name,phone,note});}else{if(s.customers.length>=MAX_CUSTOMERS)throw new Error(t('limit'));s.customers.push({id:uid(),name,phone,note});}});
  $('#editor').close();toast(t('saved'));
}
function saveEntry(form){
  const f=new FormData(form),id=form.dataset.id,customerId=String(f.get('entry-customer')||''),type=String(f.get('entry-type')||''),date=String(f.get('entry-date')||''),note=String(f.get('entry-note')||'').trim();
  const amount=parseAmount(f.get('entry-amount'));
  if(!state.customers.some(c=>c.id===customerId)||!['due','payment'].includes(type)||note.length>500)throw new Error(t('invalid'));
  updateState(s=>{const record={customerId,type,date,note,amount};if(id){const x=s.entries.find(v=>v.id===id);if(!x)throw new Error('Entry not found.');Object.assign(x,record);}else{if(s.entries.length>=MAX_ENTRIES)throw new Error(t('limit'));s.entries.push({...record,id:uid()});}});
  $('#editor').close();toast(t('saved'));
}
async function handleClick(event){
  const hit=event.target.closest('[data-action]');if(!hit)return;
  const action=hit.dataset.action,id=hit.dataset.id||'';
  try{
    if(action==='new-customer')openCustomerDialog();
    else if(action==='edit-customer')openCustomerDialog(id);
    else if(action==='new-entry')openEntryDialog('',id);
    else if(action==='edit-entry')openEntryDialog(id);
    else if(action==='close-dialog')$('#editor').close();
    else if(action==='theme')changeSettings({theme:state.settings.theme==='dark'?'light':'dark'});
    else if(action==='language')changeSettings({locale:state.settings.locale==='ur'?'en':'ur'});
    else if(action==='filter'){filter=hit.dataset.filter||'all';const old=$('#entry-search');const pos=old?.selectionStart;render();if(old&&pos!==null){} }
    else if(action==='backup')exportBackup();
    else if(action==='restore')selectFile();
    else if(action==='export-csv'){download(ledgerCSV(state),`khatabanao-ledger-${nowDate()}.csv`,'text/csv;charset=utf-8');toast(t('saved'));}
    else if(action==='statement')printCustomer(id);
    else if(action==='sample'){if(state.customers.length+3>MAX_CUSTOMERS||state.entries.length+5>MAX_ENTRIES)throw new Error(t('limit'));if(await confirmDialog(t('sample'),t('sampleWarning'),t('confirm'),false))addSample();}
    else if(action==='delete-entry'){
      if(await confirmDialog(t('delete'),t('deleteWarning'))) {updateState(s=>{s.entries=s.entries.filter(x=>x.id!==id);});toast(t('deleted'));}
    }
    else if(action==='delete-customer'){
      if(state.entries.some(x=>x.customerId===id))throw new Error(t('customerHasEntries'));
      if(await confirmDialog(t('delete'),t('deleteWarning'))){updateState(s=>{s.customers=s.customers.filter(x=>x.id!==id);});go('customers');toast(t('deleted'));}
    }
    else if(action==='reset'){
      if(await confirmDialog(t('reset'),t('clearWarning'))){updateState(s=>{s.customers=[];s.entries=[];});go('home');toast(t('deleted'));}
    }
  }catch(ex){fail(ex);}
}
function handleInput(event){if(event.target.id==='customer-search'){clientSearch=event.target.value;$('#customer-results').innerHTML=customerCards();}else if(event.target.id==='entry-search'){entrySearch=event.target.value;$('#entry-results').innerHTML=ledgerResults();}}
function handleSubmit(event){if(!['customer-form','entry-form','settings-form'].includes(event.target.id))return;event.preventDefault();try{
  if(event.target.id==='customer-form')saveCustomer(event.target);
  else if(event.target.id==='entry-form')saveEntry(event.target);
  else{const f=new FormData(event.target);const business=String(f.get('business')||'').trim();if(!business||business.length>100)throw new Error(t('invalid'));
    const currency=state.entries.length?state.settings.currency:String(f.get('currency'));
    changeSettings({business,currency,locale:String(f.get('locale')),theme:String(f.get('theme'))});toast(t('saved'));}
}catch(ex){fail(ex);}}
function init(){
  try{state=store.read();}catch(ex){$('#app').innerHTML=`<div class="fatal"><h1>Cannot open saved data</h1><p>${e(ex.message)}</p><p>Data was not changed. Please copy your browser data before further troubleshooting.</p></div>`;return;}
  render();
  document.addEventListener('click',handleClick);
  document.addEventListener('input',handleInput);
  document.addEventListener('submit',handleSubmit);
  $('#backup-input').addEventListener('change',async ev=>{try{await restoreFile(ev.target.files?.[0]);}catch(ex){fail(ex);}finally{ev.target.value='';}});
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){try{state=store.read();render();toast('Data updated from another tab.');}catch(ex){fail(ex);}}});
  window.addEventListener('afterprint',()=>{$('#print-root').innerHTML='';});
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();installPrompt=ev;});
}
init();
