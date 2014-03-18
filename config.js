module.exports = {
    // The components of the dashboard can be customized here.
    // Make sure you restart server.js to apply the changes

    port: 8081, // Note: You also have to set the device's IP address in app.js
    filesystems: [
        // List of mounted filesystems
        // These are displayed in the system info table

        '/dev/mmcblk0p2', // The default partition on the SD card
        '/dev/sda1' // My external HDD
    ],
    commands: [
        // Commands can be launched from the dashboard, but you have to define them here first.
        
        // If you want to run commands as root, the node process must be running as root ('sudo node server.js')
        // Please note: Even though the commands are defined here, and cannot be modified on the client side,
        // running something as root AND exposing it to the web is quite dangerous...
        {
            id: 0,
            label: 'Start XBMC',
            command: 'initctl start xbmc',
            refresh_status: true
            // If set to true, the process status will be refreshed after issuing the command.
            // This is useful when the command launches/kills one of the monitored processes.
        },
        {
            id: 1,
            label: 'Stop XBMC',
            command: 'initctl stop xbmc',
            refresh_status: true
        },
        {
            id: 2,
            label: 'Start Deluge',
            command: 'service start deluge',
            refresh_status: true
        },
        {
            id: 3,
            label: 'Shutdown',
            command: 'poweroff'
            // Note:  Needs to be run as root
        },
        {
            id: 4,
            label: 'Reboot',
            command: 'reboot'
            // Note:  Needs to be run as root
        },
        {
            id: 5,
            label: 'config.txt',
            command: 'cat /boot/config.txt'
        }
    ],
    status: [
        // You can use the 'top' command to find out the process' name. 
        {
            id: 0,
            label: 'XBMC',
            pname: 'xbmc.bin',
            text_on: 'Running',
            text_off: 'Not running',
        },
        {
            id: 1,
            label: 'Deluge',
            pname: 'deluged'
            text_on: 'Running',
            text_off: 'Not running',
        }
    ]
}
