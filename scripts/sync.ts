import {syncInventory} from '../lib/sync'; syncInventory().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(String(e));process.exitCode=1;});
