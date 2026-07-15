const http=require('http');
const fs=require('fs');
const path=require('path');
const root = __dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  if(p==='/admin'||p==='/admin/'||p==='/admin.com')p='/admin.html';
  const file=path.resolve(root,'.'+p);
  if(path.relative(root,file).startsWith('..')||path.isAbsolute(path.relative(root,file))){res.writeHead(403);return res.end('Forbidden')}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
    res.end(data);
  });
}).listen(process.env.PORT||3000,()=>console.log('Hotspot Rental: http://localhost:3000'));
