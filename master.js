const   cp = require('child_process'),
        os = require('os');

const
    pid = process.pid,
    count = os.cpus().length;

console.log(`Master pid: ${pid}`);
console.log(`Starting ${count} forks`);

for (let i = 0; i<count;){
    cp.fork('./worker.js', [++i]);
}
