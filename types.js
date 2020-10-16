const types = {
//    object: (data, callback) => callback(JSON.stringify(data)),
    object: JSON.stringify,
    string: s=>s,
    number: n=>n.toString(),
    undefined: (args, callback)=>callback('404 not found'),
    function: ([fn, req, res], callback)=>{
        if (fn.length === 3)
            fn(req, res, callback);
        else
            callback(JSON.stringify(fn(req, res)));
    }
}

module.exports = types;
