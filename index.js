var express = require('express');
var redis = require('redis');
var url = require('url');
var app = express();

var redisURL = url.parse(process.env.REDIS_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname);
client.auth(redisURL.auth.split(":")[1]);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));



app.get('/', function(request, response) {
  var json = {
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
                     console.log('Worked: ' + value);
                 }
            });
        }
    });
  response.send('Hello World!');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
