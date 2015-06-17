var express = require('express');
var redis = require('redis');
var url = require('url');
var CronJob = require('cron').CronJob;
var Crawler = require('crawler');
var app = express();

var redisURL = url.parse(process.env.REDIS_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname);
client.auth(redisURL.auth.split(":")[1]);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


var job = new CronJob({
  cronTime: '* * * * * *',
  onTick: function() {
    // Runs every weekday at 00:01:00 AM.
    crawl();
  },
  start: true,
  timeZone: "Europe/Zurich"
});
job.start();

app.get('/', function(request, response) {
  /*var json = {
  	name: 'KUGL', 
  	color: 'calm', 
  	title: 'HERR VOGEL @ Club der Traumtänzer', 
  	link: 'http://www.kugl.ch/',
  	description: 'Deephouse, Techno / 18+ / 23:00-06:00 / Nur 15chf Eintritt'
  };
  
  client.hmset('venue', json , function(err) {
        if (err) {
           // Something went wrong
           console.error('errorWrite');
        } else {
            client.hgetall('venue', function(err, value) {
                 if (err) {
                     console.error('errorRead');
                 } else {
                     console.log('Worked: ' + value.toString());
                 }
            });
        }
    });*/
  response.send('Hello World!');
});

function crawl() {
  var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page 
    callback : function (error, result, $) {
        // $ is Cheerio by default 
        //a lean implementation of core jQuery designed specifically for the server 
        /*$('a').each(function(index, a) {
            var toQueueUrl = $(a).attr('href');
            c.queue(toQueueUrl);
        });*/
        console.log($('title'), ': ',result.body.length, 'bytes');
    }
  });
  
  c.queue(['http://www.kugl.ch/', 'http://www.grabenhalle.ch/']);
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
