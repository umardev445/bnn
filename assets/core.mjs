// Core ledger and backup validation. All amounts are integer minor units (paisa/cents).
export const STORAGE_KEY = 'khatabanao:v1';
export const MAX_CUSTOMERS = 2000;
export const MAX_ENTRIES = 8000;
export const MAX_BACKUP_BYTES = 3 * 1024 * 1024;
export const CURRENCIES = ['PKR','INR','AED','USD'];
export const nowDate = () => {const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
export const uid = () => globalThis.crypto?.randomUUID?.() || `k${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
export function escapeHtml(value='') {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function parseAmount(value) {
  const s=String(value).trim();
  if(!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(s)) throw new Error('Enter a valid amount (up to 2 decimal places).');
  const [whole,frac='']=s.split('.');
  const minor=Number(whole)*100+Number((frac+'00').slice(0,2));
  if(!Number.isSafeInteger(minor)||minor<1||minor>999999999999) throw new Error('Amount must be greater than zero and within the limit.');
  return minor;
}
export const amountInput = minor => (minor/100).toFixed(2);
export function formatMoney(minor, currency='PKR', language='en') {
  const sym={PKR:'Rs',INR:'₹',AED:'AED',USD:'$'}[currency]||currency;
  const loc=language==='ur'?'ur-PK':'en-PK';
  return `${sym} ${new Intl.NumberFormat(loc,{minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100)}`;
}
const isString=(v,max)=>typeof v==='string'&&v.length<=max;
const isId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const validDate=s=>{if(typeof s!=='string'||!/^(\d{4})-(\d{2})-(\d{2})$/.test(s)) return false;const d=new Date(`${s}T12:00:00Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s&&s>='2000-01-01'&&s<='2100-12-31';};
export function freshState() {return {version:1,revision:0,settings:{business:'My business',currency:'PKR',locale:'en',theme:'light'},customers:[],entries:[]};}
export function validateState(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==1) throw new Error('Unsupported backup format.');
  if(!Number.isSafeInteger(input.revision)||input.revision<0)throw new Error('Invalid revision.');
  if(!input.settings||typeof input.settings!=='object'||!isString(input.settings.business,100)||!input.settings.business.trim()||!CURRENCIES.includes(input.settings.currency)||!['en','ur'].includes(input.settings.locale)||!['light','dark'].includes(input.settings.theme)) throw new Error('Invalid settings.');
  if(!Array.isArray(input.customers)||input.customers.length>MAX_CUSTOMERS||!Array.isArray(input.entries)||input.entries.length>MAX_ENTRIES)throw new Error('Backup exceeds record limit.');
  const customerIds=new Set();
  for(const c of input.customers){
    if(!c||typeof c!=='object'||!isId(c.id)||customerIds.has(c.id)||!isString(c.name,100)||!c.name.trim()||!isString(c.phone,40)||!isString(c.note,500))throw new Error('Invalid customer data.');
    customerIds.add(c.id);
  }
  const entryIds=new Set();
  for(const x of input.entries){
    if(!x||typeof x!=='object'||!isId(x.id)||entryIds.has(x.id)||!customerIds.has(x.customerId)||!['due','payment'].includes(x.type)||!Number.isSafeInteger(x.amount)||x.amount<=0||x.amount>999999999999||!validDate(x.date)||!isString(x.note,500)) throw new Error('Invalid ledger entry.');
    entryIds.add(x.id);
  }
  return {version:1,revision:input.revision,settings:{business:input.settings.business.trim(),currency:input.settings.currency,locale:input.settings.locale,theme:input.settings.theme},customers:input.customers.map(c=>({id:c.id,name:c.name.trim(),phone:c.phone,note:c.note})),entries:input.entries.map(x=>({id:x.id,customerId:x.customerId,type:x.type,amount:x.amount,date:x.date,note:x.note}))};
}
export const customerBalance=(entries,customerId)=>entries.reduce((sum,x)=>x.customerId===customerId?sum+(x.type==='due'?x.amount:-x.amount):sum,0);
export function totals(state){let due=0,paid=0; for(const x of state.entries){if(x.type==='due')due+=x.amount;else paid+=x.amount;}const balances=state.customers.map(c=>customerBalance(state.entries,c.id));return {due,paid,outstanding:balances.reduce((s,n)=>s+Math.max(n,0),0),advance:balances.reduce((s,n)=>s+Math.max(-n,0),0),active:balances.filter(n=>n>0).length};}
export const sortedEntries=entries=>entries.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
export function ledgerCSV(state){
  const customers=new Map(state.customers.map(c=>[c.id,c.name]));
  const safe=s=>{let v=String(s??''); if(/^\s*[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
  const rows=[['Date','Customer','Type','Amount','Currency','Note']];
  for(const x of sortedEntries(state.entries))rows.push([x.date,customers.get(x.customerId)||'',x.type==='due'?'Udhaar':'Payment',(x.amount/100).toFixed(2),state.settings.currency,x.note]);
  return '\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n');
}
