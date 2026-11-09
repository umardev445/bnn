import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,parseAmount,amountInput,validateState,customerBalance,totals,ledgerCSV,MAX_CUSTOMERS} from '../assets/core.mjs';
import {Store} from '../assets/store.mjs';

const fixture=()=>{const s=freshState();s.customers.push({id:'c1',name:'Ahmed',phone:'123',note:''},{id:'c2',name:'Fatima',phone:'',note:''});s.entries.push({id:'e1',customerId:'c1',date:'2026-11-01',type:'due',amount:10005,note:'Shop'},{id:'e2',customerId:'c1',date:'2026-11-02',type:'payment',amount:5000,note:'Cash'},{id:'e3',customerId:'c2',date:'2026-11-04',type:'payment',amount:300,note:''});return s;};
test('integer paise preserve cents',()=>{assert.equal(parseAmount('100.05'),10005);assert.equal(parseAmount('0.01'),1);assert.equal(amountInput(10005),'100.05');assert.equal(parseAmount('9999999999.99'),999999999999);});
test('invalid money rejected',()=>{for(const x of ['0','-2','1.123','NaN','1e6','2,500','99999999999.99','']) assert.throws(()=>parseAmount(x));});
test('balances and totals include customer advance separately',()=>{const s=fixture();assert.equal(customerBalance(s.entries,'c1'),5005);assert.equal(customerBalance(s.entries,'c2'),-300);assert.deepEqual(totals(s),{due:10005,paid:5300,outstanding:5005,advance:300,active:1});});
test('backup valid and copies only expected fields',()=>{const s=fixture();s.customers[0].unknown='no';const v=validateState(s);assert.equal(v.customers[0].unknown,undefined);assert.equal(v.entries.length,3);});
test('backup rejects dangling reference and duplicate ids',()=>{const s=fixture();s.entries[0].customerId='missing';assert.throws(()=>validateState(s));const c=fixture();c.customers[1].id='c1';assert.throws(()=>validateState(c));});
test('backup rejects invalid date, negative amount and prototype-looking input',()=>{const s=fixture();s.entries[0].date='2026-02-31';assert.throws(()=>validateState(s));const c=fixture();c.entries[0].amount=-20;assert.throws(()=>validateState(c));assert.throws(()=>validateState({...freshState(),version:3}));});
test('CSV quotes and prevents spreadsheet formula injection',()=>{const s=fixture();s.customers[0].name='=IMPORTXML("bad")';const out=ledgerCSV(s);assert.ok(out.includes("'=IMPORTXML"));assert.ok(out.includes('""bad""'));});
test('a failed save leaves previous storage intact',()=>{let raw=null,fail=false;const storage={getItem(){return raw;},setItem(k,v){if(fail)throw new Error('quota');raw=v;}};const store=new Store(storage);store.update(x=>x.customers.push({id:'a',name:'Alpha',phone:'',note:''}));fail=true;assert.throws(()=>store.update(x=>x.customers.push({id:'b',name:'Beta',phone:'',note:''})));assert.equal(store.read().customers.length,1);});
test('reject oversize backup record lists',()=>{const s=freshState();s.customers=Array.from({length:MAX_CUSTOMERS+1},(_,i)=>({id:'c'+i,name:'C',phone:'',note:''}));assert.throws(()=>validateState(s));});
test('new storage returns independent default state',()=>{const storage={getItem:()=>null,setItem(){}};const store=new Store(storage);const a=store.read();a.customers.push({id:'x'});assert.equal(store.read().customers.length,0);});
