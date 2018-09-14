var cluster = require("cluster");

var worker_id = 0;

var workers = [];

cluster.setupMaster({
  exec : "server.js",
  silent : false
});

for (var i = 0; i < 3; i += 1) {
    workers[i] = cluster.fork();
}

cluster.on('exit', function(worker, code, signal) {
    console.log('worker %d died (%s). restarting...',
    worker.process.pid, signal || code);
    cluster.fork();
});

