var config = require('./config.js');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {log: false});
server.listen(config.port);
app.use(express.static(__dirname + '/web'));

var os = require('os');
var fs = require('fs');
var exec = require('child_process').exec;
var async = require('async');

console.info('*** Raspberry PI Dashboard ***');
console.info('     Press Ctrl+C to exit     ')


io.sockets.on('connection', function(socket) {

    socket.on('get_init_stats', function() {
        // Stuff that are only needed once

        async.parallel({
            memory_total: function(callback) {
                callback(null, Math.round(os.totalmem() / 1024 / 1024));
            },
            fs: function(callback) {
                // Getting details about mounted filesystems
                exec('df -h', function(err, stdout, stderr) {
                    var df = stdout.split('\n');
                    var filesystems = []
                    for(i = 1; i < df.length; i++) {
                        var raw = df[i].split(/\s+/);

                        // We only need those that are defined in config.js
                        if(config.filesystems.indexOf(raw[0]) > -1) {
                            filesystems.push({
                                total: raw[1],
                                used: raw[2],
                                free: raw[3],
                                percent: raw[4],
                                mount: raw[5]
                            });
                        }
                    }
                    callback(err, filesystems);
                });
            }
            // cpu_max: function(callback) {
            //     fs.readFile('/sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq', 'utf-8', function(err, data) {
            //         callback(err, data / 1000);
            //     });
            // }
        },
        function(err, stats) {
            if(err) {
                console.error(err.toString());
            } else {
                stats.commands = config.commands;
                stats.status = config.status;

                socket.emit('init_stats', stats);
            }
        });
    });

    socket.on('get_stats', function() {
        // Stuff that need to be updated every time

        async.parallel({
            temp: function(callback) {
                fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf-8', function(err, data) {
                    callback(err, Math.round(data / 1000));
                });
            },
            // cpu: function(callback) {
            //     fs.readFile('/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq', 'utf-8', function(err, data) {
            //         callback(err, Math.round(data / 1000));
            //     });
            // },
            cpu: function(callback) {
                var percent = 0; 
                exec('ps -eo pcpu', function(err, stdout) {
                    var raw = stdout.split('\n');
                    for(i = 1; i < raw.length; i++) {
                        if(raw[i].length === 0 || raw[i] == ' 0.0') { // Notice the untrimmed space
                            continue;
                        }
                        percent += parseFloat(raw[i].trim());
                    }
                    callback(err, Math.round(percent))
                });
            },
            load: function(callback) {
                fs.readFile('/proc/loadavg', 'utf-8', function(err, data) {
                    var raw = data.split(' ');
                    callback(err, [ raw[0], raw[1], raw[2] ]);
                })
            },
            uptime: function(callback) {
                callback(null, os.uptime());
            },
            memory_used: function(callback) {
                var used =  Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);
                callback(null, used);
            }
        },
        function(err, stats) {
            if(err) {
                console.error(err.toString());
            } else {
                socket.emit('stats', stats);
            }
        });
    });

    socket.on('command', function(data) {
        // Launching commands defined in config.js

        var command;
        for(i = 0; i < config.commands.length; i++) {
            if(config.commands[i].id === parseInt(data.id)) {
                command = config.commands[i];
                break;
            }
        }

        exec(command.command, function(err, stdout) {
            if(err) {
                console.error(err.toString());
                socket.emit('command_result', { status: 'fail', command: command.command, err: err.toString() });
            } else {
                console.info('Running command: ' + command.label);
                console.info(stdout);
                var resp = {
                    status: 'success',
                    command: command.command,
                    stdout: stdout,
                    refresh: command.refresh_status || false
                }
                socket.emit('command_result', resp);
            }
        })
    });

    socket.on('get_status', function() {
        async.map(config.status,
            function(status, callback) {
                exec('pgrep ' + status.pname, function(err, stdout) {
                    if(stdout.length > 0) {
                        callback(null, {
                            id: status.id,
                            bool: true,
                            value: status.text_on
                        });
                    } else {
                        callback(null, {
                            id: status.id,
                            bool: false,
                            value: status.text_off
                        });
                    }
                });
            },
            function(err, results) {
                if(err) {
                    console.error(err.toString());
                } else {
                    socket.emit('status', results);
                }
        });
    });
});