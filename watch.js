// @file name : watch.js
// author : Abhinav Gauniyal

// requires

var os = require('os');
var http = require('http');
var net = require('net');
var diskspace = require('diskspace');

var s = net.Socket();

// variables - declares and default values

var machineName = "MyMachine" + (Math.floor(Math.random() * (9000 - 2000)) + 2000) + ""; // generate random name for fallback
var address = '127.0.0.1'; // localhost
var portnum = 4444; // default port num for socket communication
var mountPoint = '/';

// calculate static values
var hostName = os.hostname();
var hostPlatform = os.platform();
var hostArch = os.arch();
var hostRelease = os.release();

// will later use
var jsonString;
var dataToTransmit = [];
var spaceArray = [];

// functions

function declare(name, addr, port, mtpt) {
    machineName = name;
    address = addr;
    portnum = port;
    mountPoint = mtpt;
}


function checkDiskspace(mountPoint) {
    diskspace.check(mountPoint, function(err, total, free, status) {
        spaceArray = [bToS(total), bToS(free), status];
    });
}


function collectNow() {

    checkDiskspace(mountPoint); //check diskspace

    var hostInfo = {
        machineName: machineName,
        time: Date(),
        address: address,
        portnum: portnum,
        name: hostName,
        platform: hostPlatform,
        arch: hostArch,
        release: hostRelease,
        space: spaceArray,
        cpus: os.cpus(),
        metrics: {
            Uptime: os.uptime(),
            TotalMem: bToS(os.totalmem()),
            FreeMem: bToS(os.freemem())
        },
        metrics_unpretty: {
            Uptime: os.uptime(),
            TotalMem: os.totalmem(),
            FreeMem: os.freemem()
        }
    };
    return hostInfo;
}


function connectWithDelay(delay) {
    jsonString = JSON.stringify(collectNow());
    s.connect(portnum, address);
    s.write(jsonString, function(err) {
        s.end();
    });
    setTimeout(function() {
        connectWithDelay(delay);
    }, delay);
}


function updateDataWith(parsedData) {
    if (dataToTransmit.length === 0) {
        dataToTransmit.push(parsedData);
    } else {
        var isPresent = false;
        var location = 0;
        for (var i = 0; i < dataToTransmit.length; ++i) {
            if (dataToTransmit[i].machineName == parsedData.machineName) {
                isPresent = true;
                location = i;
            } else continue;
        }
        if (isPresent) {
            dataToTransmit[location] = parsedData;
        } else {
            dataToTransmit.push(parsedData);
        }
    }
}

// reference : http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function bToS(bytes) {
    if (bytes === 0) return '0 Byte';
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

// create server

function watchAt(port1, port2) {

    // create socket

    net.createServer(function(socket) {

        socket.on('data', function(data) {
            var incomingData = data.toString();
            if ((incomingData.split(' ')[0]) == 'GET') incomingData = "{ }"; //quick fix for browser accessing that very port
            var parsedData = JSON.parse(incomingData);
            updateDataWith(parsedData);

        });
    }).listen(port1, '127.0.0.1');
    console.log("Socket is active at port" + port1 + ", transmitting data to server.");

    // create server

    http.createServer(function(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(dataToTransmit));

    }).listen(port2, '127.0.0.1');
    console.log("Server is active , check json output on http://localhost:" + port2 + "/");
}


exports.connectWithDelay = connectWithDelay;
exports.declare = declare;
exports.watchAt = watchAt;


// ====================================================
// start server as :
// ....................................................
// var s = require('watch');
// var socket-port = 4444;
// var http-port = 8888;
// s.watchAt(socketport, http-port);
// ....................................................
// ----------------------------------------------------
//
// ----------------------------------------------------
// connect client as :
// ....................................................
// var w = require('./watch');
// w.declare("MyMachine#1", '127.0.0.1', 4444,'/home');
// w.connectWithDelay(3000);
// ....................................................
// but not inside your server loop or any loop if you don't want trouble.s
// ====================================================
