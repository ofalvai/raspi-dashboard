# Raspi-dashboard

A simple and customisable realtime dashboard for your Raspberry Pi in your browser.

__Raspi-dashboard__ displays realtime statistics about your device, and lets you execute (predefined) commands. Powered by node.js, socket.io, Highcharts.js, and Twitter Bootstrap.

![Screenshot](/screenshot.png?raw=true)

## Install & usage

Download and install the latest node.js for the Raspberry Pi (thanks to the [node_arm](https://github.com/nathanjohnson320/node_arm) project):
```
$ wget http://node-arm.herokuapp.com/node_latest_armhf.deb
$ sudo dpkg -i node_latest_armhf.deb
```

Clone this repository:
```
$ git clone git://github.com/ofalvai/raspi-dashboard.git
```

Install required modules
```
$ cd raspi-dashboard
$ npm install
```

Set the `server_location` variable in `/web/scripts/app.js` to point to your Raspberry Pi's local IP address.

Run raspi-dashboard:
```
$ node server.js
```

Open `http://yourip:8081' (eg. http://192.168.1.100:8081) in your browser and have fun!

## Config

Most of the stuff can be customized in `config.js`, such as the default port, custom commands, and status labels. Sample config:
``` javascript
module.exports = {
    port: 8081,
    filesystems: [
        '/dev/mmcblk0p2',
        '/dev/sda1'
    ],
    commands: [
        {
            id: 0,
            label: 'Start XBMC',
            command: 'initctl start xbmc',
            refresh_status: true
        }
    ],
    status: [
        {
            id: 0,
            label: 'XBMC',
            pname: 'xbmc.bin',
            text_on: 'Running',
            text_off: 'Not running',
        }
    ]
}

```

For more details, see the comments in the file.


## Running in the background

Use the `nohup` command to launch the app, and continue using your console:

```
$ nohup node server.js
```

## Running at startup

I've prepared an init script (`initscript.sh`) that you can use to launch raspi-dashboard automatically when your device boots up.

Please note: If you cloned this repo somewhere else than your home directory, make sure you edit the variables accordingly in the init script.

Use the following commands to set up the init script:

```
$ sudo cp initscript.sh /etc/init.d/raspi-dashboard
$ sudo chmod +x /etc/init.d/raspi-dashboard
$ sudo update-rc.d raspi-dashboard defaults
```

## Known issues

- The CPU usage is unreliable and is only an estimate. Use `top` (or even better, `htop`) via SSH for precise measurement.
- The RAM usage is sometimes reported incorrectly. This is a node.js bug, I think. Again, use 'top' if you need accurate results.
- There's a memory leak in Highcharts.js. I can't do too much about it, even the documentation demos are leaking. If it bothers you, don't leave the tab open for a long time, or use a longer refresh interval.

## Licence

The MIT License (MIT)

Copyright (c) 2014 Olivér Falvai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.