const http = require('http');
const os = require('os');
const cluster = require('cluster');
const types = require('./types');

const hostname = '127.0.0.1';
const port = '80';
const pid = process.pid;

const user = {name:"jura", age:22};
const staticRouting = {
    '/': '<h1>Welcome to homepage</h1><hr>',
    '/user': user,
    '/user/name': ()=>user.name.toUpperCase(),
    '/user/age': ()=>user.age,
    '/user/*': (client, par)=>`parameter=${par[0]}`,
    '/hello': {hello:'world', andArray:[1,2,3,4,5,6,7]},
    '/api/method_1': (req, resp, callback)=>{
        console.log(`${req.url} ${resp.statusCode}`);
        callback({status: resp.statusCode});
    },
    '/api/method_2': req =>({
        user,
        url: req.url,
        cookie: req.headers.cookie
    })

}

const matching = [];
for (const key in staticRouting){
    if (key.includes('*')){
        const rx = new RegExp(key.replace('*', '(.*)'));
        const route = staticRouting[key];
        matching.push([rx, route]);
        delete staticRouting[key];
    }
}

const router=client=>{
    let par;
    let route = staticRouting[client.req.url];
    if (!route){
        for (let i = 0; i < matching.length; i++){
            const rx = matching[i];
            par = client.req.url.match(rx[0]);
            if (par){
                par.shift();
                route = rx[1];
                break;
            }
        }
    }
    const type = typeof route;
    const render = types[type];
    return render(route, par, client);
}

const worker = (data, req, res)=>{
    const type = typeof data;
    if (type =='string') return res.end(data);
    const serializer = types[type];
    serializer([data, req, res], data=>worker(data, req, res));
}

if (cluster.isMaster){
    const count = os.cpus().length;
    console.log(`Master pid: ${pid}`);
    console.log(`Starting ${count} forks`);
    for (let i = 0; i < count; i++){
        cluster.fork();
    }
} else {
    const id = cluster.worker.id;
    console.log(`Worker ${id}, pid: ${pid}, port: ${port}`);
    const server = http.createServer((request, response)=>{
        const result = staticRouting[request.url];
        worker(result, request, response);
        //response.end(result.toString());
    })
    server.listen(port, hostname, ()=>{
        console.log(`Server running at http://${hostname}:${port}`)
    })
    server.on('error', err=>{
        if (err.code === 'EACCES'){
            console.log(`No access to port: ${port}`);
        }
    })

    server.on('clientError', (err, socket)=>{
        socket.end(`HTTP/1.1 400 Bad Request\r\n\r\n`);
    })
}


setInterval(()=>user.age++, 2000);