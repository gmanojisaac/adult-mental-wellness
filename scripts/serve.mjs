import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import visitorHandler from '../api/visitors.js';
const root=path.resolve('src');
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{const requestUrl=new URL(req.url,'http://localhost');if(requestUrl.pathname==='/api/visitors'){await visitorHandler(req,res);return;}try{let file=path.resolve(root,'.'+decodeURIComponent(requestUrl.pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();if((await stat(file)).isDirectory())file=path.join(file,'index.html');const data=await readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');const range=req.headers.range;if(range){const [a,b]=range.replace('bytes=','').split('-');const start=Number(a),end=b?Number(b):data.length-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});res.end(data.subarray(start,end+1));}else{res.setHeader('Accept-Ranges','bytes');res.end(data);}}catch{res.writeHead(404);res.end('Page not found');}}).listen(port,'0.0.0.0',()=>console.log(`Website ready at http://localhost:${port}`));
