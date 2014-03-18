#!/bin/bash

### BEGIN INIT INFO
# Provides: raspi-dashboard
# Required-Start:
# Required-Stop:
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Start raspi-dashboard at boot time
### END INIT INFO

NODE=/usr/local/bin/node
FILE=/home/pi/raspi-dashboard/server.js
USER=pi
OUT=/home/pi/raspi-dashboard/server.log

case "$1" in

start)
	echo "raspi-dashboard: starting"
	$NODE $FILE > $OUT
	;;

stop)
	echo "raspi-dashboard: stopping"
	sudo pkill node
	;;
*)
	echo "Usage /etc/init.d/raspi-dashboard [start|stop]"
esac

exit 0
