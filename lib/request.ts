export class BodyError extends Error {constructor(message:string,public status=400){super(message);}}
export async function readText(req:Request,max=10000){
 if(Number(req.headers.get('content-length')||0)>max)throw new BodyError('Request too large',413);
 const reader=req.body?.getReader();if(!reader)return '';let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new BodyError('Request too large',413);}chunks.push(value);}
 return Buffer.concat(chunks).toString('utf8');
}
export async function readJSON(req:Request){if(!req.headers.get('content-type')?.includes('application/json'))throw new BodyError('JSON content type required',415);try{return JSON.parse(await readText(req));}catch(e){if(e instanceof BodyError)throw e;throw new BodyError('Invalid JSON body');}}
