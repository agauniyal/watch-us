// watch.js server with client

var s = require('./watch');
s.watchAt(4444, 8888);

var w = require('./watch');
w.declare("MyMachine#1", '127.0.0.1', 4444, '/');
w.connectWithDelay(3000);
