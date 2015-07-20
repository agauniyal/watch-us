# watch-us
monitors your servers/API/web endpoints via sockets

#### How to use

Declare these lines in your server
```
var s = require('./watch');
s.watchAt(4444, 8888);
```

Connect a client as follows
```
var w = require('./watch');
w.declare("MyMachine#1", '127.0.0.1', 4444, '/');
w.connectWithDelay(3000);
```

A sample server.js file is provided. <b>Please do not use in production, it is a naive implementation.</b>
