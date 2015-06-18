var express = require('express');
var redis = require('redis');
var url = require('url');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var Krawler = require('krawler');
var cors = require('cors');
var cheerio = require('cheerio');
var app = express();

var redisURL = url.parse(process.env.REDIS_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname);
client.auth(redisURL.auth.split(":")[1]);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(cors());

var job = new CronJob({
  cronTime: '0 * * * * *',
  onTick: function() {
    // Runs every weekday at 00:01:00 AM.
   crawl();
  },
  start: true,
  timeZone: "Europe/Zurich"
});
job.start();

app.get('/', function(request, response) {
  client.hgetall('venues', function(err, value) {
       if (err) {
         response.status(404);
         response.send('Error: Couldnt fetch venues off redis');
         console.error('Error: Couldnt fetch venues off redis');
       } else {
         console.log('Read successfully: ' + moment().format('MMMM Do YYYY, h:mm:ss a'));
         console.log(value);
         response.writeHead(200, {'content-type': 'text/json' });
         response.write( JSON.stringify(value) );
         response.end('\n');
       }
  });
});


function crawl() {
   var content = [];
   var urls = [
    'http://www.palace.sg/',
    'http://grabenhalle.ch/',
    'http://kugl.ch/',
    'http://tankstell.ch/',
    'http://oya-bar.ch/',
    'http://treppenhaus.ch/',
    'http://www.militaerkantine.ch/de/microsites/kultur/',
    'http://talhof.sg/',
    'http://www.flon-sg.ch/'
    ];
     
    var krawler = new Krawler;
     
    krawler
        .queue(urls)
        .on('data', function($, url, response) {
          var body = response.body;
          content.push({"url": url, "body": body});
        })
        .on('error', function(err, url) {
          console.log("Error crawl: " + url);
          content.push({"url": url, "body": ""});
        })
        .on('end', function() {
            filterData(content);
        });
}

function filterData(content) {
    var venues = { "data" : [] };
    console.log(content.length);
    content.forEach(function(entry) {
      switch(entry.url) {
        case 'http://www.palace.sg/':
          venues.data.push({ "name": "PALACE", "color": "stable", "title": "", "link": "", "description": ""});
          break;
        case 'http://grabenhalle.ch/':
          venues.data.push({ "name": "GRABENHALLE", "color": "positive", "title": "", "link": "", "description": ""});
          break;
        case 'http://kugl.ch/':
          venues.data.push(kuglFilter(entry.body));
          break;
        case 'http://tankstell.ch/':
          venues.data.push({ "name": "TANKSTELL", "color": "balanced", "title": "", "link": "", "description": ""});
          break;
        case 'http://oya-bar.ch/':
          venues.data.push({"name": "ØYA", "color": "energized", "title": "", "link": "", "description": ""});
          break;
        case 'http://treppenhaus.ch/':
          venues.data.push({"name": "TREPPENHAUS", "color": "assertive", "title": "", "link": "", "description": ""});
          break;
        case 'http://www.militaerkantine.ch/de/microsites/kultur/':
          venues.data.push({"name": "MILITÄRKANTINE", "stable": "stable", "title": "", "link": "", "description": ""});
          break;
        case 'http://talhof.sg/':
          venues.data.push({"name": "TALHOF", "balanced": "balanced", "title": "", "link": "", "description": ""});
          break;
        case 'http://www.flon-sg.ch/':
          venues.data.push({"name": "FLON", "color": "royal", "title": "", "link": "", "description": ""});
          break;
        default:
          venues.data.push({"name": "", "color": "", "title": "", "link": "", "description": ""});
      }
    });
    console.log(JSON.stringify(venues));
    writeVenues(venues);
}

function kuglFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "KUGL", "color": "calm", "title": "", "link": "", "description": ""};
  $('.event-item-holder').filter(function(){
    var data = $(this).children().first().children().first().children();
    event.title = data.eq(1).children().first().text();
    event.link = data.eq(1).children().first().attr('href');
    event.description = data.eq(2).text();
  });
  
  return event;
}


function writeVenues(venues) {
  client.del('venues');
  client.hmset('venues', venues , function(err) {
        if (err) {
           // Something went wrong
           console.error('Error: Couldnt write venues to redis');
        } else {
           console.log('Write successfully: '+ moment().format('MMMM Do YYYY, h:mm:ss a'));
        }
    });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
