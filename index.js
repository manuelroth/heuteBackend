var express = require('express');
var redis = require('redis');
var url = require('url');
var app = express();

var redisURL = url.parse(process.env.REDIS_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname);
client.auth(redisURL.auth.split(":")[1]);

var bar = "";
client.set('foo', 'bar');
client.get('foo', function(err, reply) {
  bar = reply.toString();
  console.log(reply.toString());
});

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  response.send('Hello World!' + " " + bar);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
