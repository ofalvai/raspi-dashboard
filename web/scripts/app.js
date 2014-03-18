var config = {
    // The important options are in config.js, but some things need to be defined here

    // Set this to the Raspberry PI's local IP address
    // You can find it out with the ifconfig command, or in XBMC on the system status screen
    // The dashboard can be accessed at this address, but don't forget the port number defined in config.js!
    // So the default address looks like this: http://192.168.1.100:8080
    server_location: 'http://192.168.1.100',

    // How often the dashboard updates (in miliseconds)
    // You can also manually update with the refresh button on the toolbar
    refresh_interval: 1000,

    // Sets the number of points visible on the system graph at a time.
    // A higher value means a "denser" graph
    graph_length: 10 
}

var socket = io.connect(config.server_location);

var statInterval = null;
function initInterval() {
    statInterval = window.setInterval(function() {
        socket.emit('get_stats');
    }, config.refresh_interval);
}

initInterval();

socket.emit('get_init_stats');
socket.emit('get_stats')
socket.emit('get_status');

socket.on('disconnect', function() {
    $('#connection-lost').modal();

    // Reconnect
    socket.on('connect', function() {
        $('#connection-lost').modal('hide');
    })
});

socket.on('init_stats', function(data) {
    init(data);
});

socket.on('stats', function(data) {
    render(data);
});

socket.on('status', function(data) {
    refresh_status(data);
});

socket.on('command_result', function(data) {
    command_result(data);
});

var chart = {};

function init(socket_data) {
    render(socket_data, true);

    $('.loading').remove();

    config.memory_total = socket_data.memory_total;
    // config.cpu_max = socket_data.cpu_max;

    // Displaying the defined commands
    for(i = 0; i < socket_data.commands.length; i++) {
        var command = socket_data.commands[i];
        $('<button class="command btn btn-default" />')
            .text(command.label)
            .attr({
                'title': command.command,
                'data-toggle': 'tooltip'
            })
            .data(command)
            .appendTo('#commands');
    }

    // Displaying the defined status labels
    for(i = 0; i < socket_data.status.length; i++) {
        var status = socket_data.status[i];
        var $el = $('<tr class="status" />').attr('data-id', status.id);
        $('<td class="status-label" />').text(status.label + ': ').appendTo($el);
        $('<td class="status-value"><span class="status-value-label" /></td').appendTo($el);
        $el.appendTo('#status');
    }

    $('#refresh-interval').val(config.refresh_interval / 1000);

    $(document).ready(function() {
        $('.command').on('click', function() {
            var command = $(this).data();
            socket.emit('command', {id: command.id});
            $('#command-result').append('<p class="command-label">' + command.command + '</p>').show();
        });

        $('#refresh-interval').on('change', function() {
            window.clearInterval(statInterval);
            config.refresh_interval = parseInt($(this).val()) * 1000
            initInterval();
            socket.emit('get_stats');
            socket.emit('get_status');
        });

        $('#refresh-now').on('click', function(e) {
            e.preventDefault();
            socket.emit('get_stats');
            socket.emit('get_status');
        });

        $('#clear-command-result').on('click', function() {
            $('#command-result').empty();
            $(this).fadeOut(200);
        });

        $('[data-toggle=tooltip]').tooltip();

        $('#reload').on('click', function() {
            location.reload();
        });


        chart = new Highcharts.Chart(
        {
            chart: {
                type: 'line',
                renderTo: $('#graph').get(0)
            },
            title: {
                text: null
            },
            yAxis: [
                {
                    title: {
                        text: 'RAM usage'
                    },
                    labels: {
                        format: '{value} MB'
                    },
                    max: config.memory_total,
                    min: 0,
                    opposite: true
                },
                {
                    title: {
                        text: 'CPU Usage/Temperature'
                    },
                    max: 100,
                    min: 0
                }
            ],
            legend: {
                layout: 'horizontal',
                align: 'top',
                verticalAlign: 'top',
                borderWidth: 0
            },
            series: [
            {
                name: 'CPU Usage',
                tooltip : {
                    valueSuffix: ' %'
                },
                yAxis: 1
            },
            {
                name: 'CPU Temperature',
                tooltip: {
                    valueSuffix: ' °C'
                },
                dataLabels: {
                    enabled: false,
                    format: '{y} °C'
                },
                yAxis: 1
            },
            {
                name: 'RAM Usage',
                tooltip : {
                    valueSuffix: ' MB'
                },
                yAxis: 0
            }],
            tooltip: {
                shared: true,
                crosshairs: true
            },
            exporting: {
                enabled: false
            }
        });

    });
}



function render(socket_data, is_init) {
    // This function displays the returned data

    if(is_init) {
        // Displaying mounted filesystems
        for(i = 0; i < socket_data.fs.length; i++) {
            var fs = socket_data.fs[i],
                label = fs.mount == '/' ? 'SD Card' : fs.mount,
                details = fs.used + ' of ' + fs.total + ' total (' + fs.percent + ')',
                $tr = $('<tr />'),
                $label = $('<td />').text(label).appendTo($tr),
                $placeholder = $('<td class="fs" />').text(details).appendTo($tr);
            $('tbody', '#stats').append($tr);
            $('#stats').show();
        }
    } else {
        $('.cell-value', '#stats').empty();

        // CPU temp
        $('.cell-value.cpu-temp').text(socket_data.temp + ' °C').removeClass('danger warning');
        if(socket_data.temp > 80) {
            $('.cell-value.cpu-temp').addClass('danger');
        } else if(socket_data.temp > 70) {
            $('.cell-value.cpu-temp').addClass('warning');
        }

        // CPU usage
        $('.cell-value.cpu-freq').text(socket_data.cpu + ' %');

        // System load
        var $el = $('<div />');
        $('<span data-toggle="tooltip" title="1 min" />').text(socket_data.load[0]).appendTo($el);
        $('<span>, </span>').appendTo($el);
        $('<span data-toggle="tooltip" title="5 min" />').text(socket_data.load[1]).appendTo($el);
        $('<span>, </span>').appendTo($el);
        $('<span data-toggle="tooltip" title="15 min" />').text(socket_data.load[2]).appendTo($el);
        $el.appendTo('.cell-value.load');
        $('[data-toggle="tooltip"]', '.cell-value.load').tooltip();

        
        // Uptime
        $('.cell-value.uptime').text(format_time(socket_data.uptime));

        // Memory
        var percentage = Math.round((socket_data.memory_used / config.memory_total) * 100),
            details = socket_data.memory_used + 'MB of ' + config.memory_total + ' MB total (' + percentage + '%)';
        $('.cell-value.memory').text(details).removeClass('danger');
        if(percentage > 90) {
           $('.cell-value.memory').addClass('danger');
        }

        // Highcharts
        var do_shift = chart.series[0].data.length >= config.graph_length ? true : false;
        // If the chart's length is more than the max length, values get shifted off the graph

        chart.series[0].addPoint({yAxis: 1, y: socket_data.cpu}, true, do_shift);
        chart.series[1].addPoint({yAxis: 1, y: socket_data.temp}, true, do_shift);
        chart.series[2].addPoint({yAxis: 0, y: socket_data.memory_used}, true, do_shift);
    }


}

function refresh_status(socket_data) {
    for(i = 0; i < socket_data.length; i++) {
        var $el = $('.status').filter(function(index) {
            return $(this).attr('data-id') == socket_data[i].id;
        });
        $('.status-value-label', $el).removeClass('status-true status-false')
                                     .addClass(socket_data[i].bool ? 'status-true' : 'status-false')
                                     .text(socket_data[i].value)
    }
};


function format_time(secs) {
    var time = {
        day: Math.floor(secs / 86400) % 365,
        hour: Math.floor(secs / 3600) % 24,
        minute: Math.floor(secs / 60) % 60,
        second: Math.floor(secs % 60)
    }

    var dict = ['day', 'hour', 'minute', 'second'];
    var output = '';

    for(i = 0; i < 4; i++) {
        var part = time[dict[i]];
        if(part > 1) {
            output += part + ' ' + dict[i] + 's ';
        } else if(part > 0) {
            output += part + ' ' + dict[i] + ' ';
        }
    }

    return output;
}

function command_result(response) {
    var $el = $('<p />');
    if(response.status == 'success') {
        response.stdout = response.stdout.replace(/\n/g, '<br />');
        $el.append('<span>' + response.stdout + '</span>');
    } else {
        $el.append('<span>' + response.err + '</span>');
        $('p.command-label:last', '#command-result').addClass('error');
    }

    if(response.refresh) {
        window.setTimeout(function() {
            // Delaying the process status refresh because some processes may not be running immediately
            socket.emit('get_status');
        }, 300);
    }

    $('#command-result').append($el).scrollTop($(this).height());
    $('#clear-command-result').fadeIn(200);
}