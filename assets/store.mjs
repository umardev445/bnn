import {freshState,validateState,STORAGE_KEY} from './core.mjs';
export class Store {
  constructor(storage=localStorage){this.storage=storage;}
  read(){const raw=this.storage.getItem(STORAGE_KEY);if(!raw)return freshState();try{return validateState(JSON.parse(raw));}catch{throw new Error('Saved data is unreadable. Export your browser storage before clearing anything.');}}
  write(next){const safe=validateState(next);this.storage.setItem(STORAGE_KEY,JSON.stringify(safe));return safe;}
  update(callback){const current=this.read(),draft=JSON.parse(JSON.stringify(current));callback(draft);draft.revision=current.revision+1;return this.write(draft);}
  restore(next){return this.write(validateState(next));}
}
