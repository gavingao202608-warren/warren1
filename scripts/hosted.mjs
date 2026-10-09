import {spawn} from 'node:child_process';
if(!process.env.DATABASE_URL)throw new Error('Hosted deployment requires DATABASE_URL for durable customer records');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0'],{stdio:'inherit'});
let sync;let discovery;
function refresh(){if(sync)return;sync=spawn('npm',['run','sync-inventory'],{stdio:'inherit'});sync.on('exit',code=>{sync=undefined;if(code===0&&!discovery){discovery=spawn('npm',['run','submit:indexnow'],{stdio:'inherit'});discovery.on('exit',()=>{discovery=undefined;});}});}
refresh();const timer=setInterval(refresh,6*3600000);
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{clearInterval(timer);sync?.kill(signal);discovery?.kill(signal);server.kill(signal);});
server.on('exit',code=>{clearInterval(timer);sync?.kill();discovery?.kill();process.exitCode=code??1;});
