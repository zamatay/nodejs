const http = require('http');

const
    BASE_PORT = 80,
    hostname = '127.0.0.1',
    id = parseInt(process.argv[2], 10)
    port = BASE_PORT + id - 1,
    pid = process.pid,
    user = {name:"jura", age:22};

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

const types = {
    object: ([data], callback) => callback(JSON.stringify(data)),
    undefined: (args, callback)=>callback('404 not found'),
    function: ([fn, req, res], callback)=>{
        if (fn.length === 3)
            fn(req, res, callback);
        else
            callback(JSON.stringify(fn(req, res)));
    }
}
console.log(`Worker: ${id}, pid: ${pid}, port: ${port}`);

const worker = (data, req, res)=>{
    const type = typeof data;
    if (type =='string') return res.end(data);
    const serializer = types[type];
    serializer([data, req, res], data=>worker(data, req, res));
}

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
