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
  client.get('venues', function(err, value) {
       if (err) {
         response.status(404);
         response.send('Error: Couldnt fetch venues off redis');
         console.error('Error: Couldnt fetch venues off redis');
       } else {
         console.log('Read successfully: ' + moment().format('MMMM Do YYYY, h:mm:ss a'));
         console.log(value);
         response.json(value);
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
     
    var krawler = new Krawler({
      maxConnections: 10,
      forceUTF8: true,
      headers: {
        'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.124 Safari/537.36'
      }
    });
     
    krawler
        .queue(urls)
        .on('data', function($, url, response) {
          var body = response.body;
          content.push({"url": url, "body": body});
        })
        .on('error', function(err, url) {
          console.log("Error crawl: " + url);
          console.log(err);
          content.push({"url": url, "body": ""});
        })
        .on('end', function() {
          filterData(content);
        });
}

function filterData(content) {
    var venues = { "data" : [] };
    content.forEach(function(entry) {
      switch(entry.url) {
        case 'http://www.palace.sg/':
          venues.data[0] = { "name": "PALACE", "color": "stable", "title": "Keine Veranstaltung", "link": "http://www.palace.sg/", "description": ""};
          break;
        case 'http://grabenhalle.ch/':
          venues.data[1] = grabenFilter(entry.body);
          break;
        case 'http://kugl.ch/':
          venues.data[2] = kuglFilter(entry.body);
          break;
        case 'http://tankstell.ch/':
          venues.data[3] = tankstellFilter(entry.body);
          break;
        case 'http://oya-bar.ch/':
          venues.data[4] = oyaFilter(entry.body);
          break;
        case 'http://treppenhaus.ch/':
          venues.data[5] = treppenhausFilter(entry.body);
          break;
        case 'http://www.militaerkantine.ch/de/microsites/kultur/':
          venues.data[6] = militaerkantineFilter(entry.body);
          break;
        case 'http://talhof.sg/':
          venues.data[7] = talhofFilter(entry.body);
          break;
        case 'http://www.flon-sg.ch/':
          venues.data[8] = flonFilter(entry.body);
          break;
      }
    });
    writeVenues(venues);
}

function flonFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "FLON", "color": "royal", "title": "Keine Veranstaltung", "link": "http://www.flon-sg.ch/", "description": ""};
  if(content !== ""){
    $('#events').filter(function(){
  	  var data = $(this).children().first();
      var infos = data.children().first().text();
      var eventDate = infos.match(/\d{1,}\.\d{1,}\.\d{1,}/)[0];
      var actualDate = moment().locale('de').format("L");
      if(eventDate === actualDate) {
        event.title = data.children().eq(1).children().first().text();
        event.link = "http://www.flon-sg.ch/" + data.children().eq(1).children().first().attr('href');
        //todo description anpassen
        event.description = data.children().eq(2).text();
      } else {
        event.link = "http://www.flon-sg.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function talhofFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "TALHOF", "color": "balanced", "title": "Keine Veranstaltung", "link": "http://talhof.sg/", "description": ""};
  if(content !== ""){
    $('#events').filter(function(){
  	  var data = $(this).children().first();
      var infos = data.children().first().text();
      var eventDate = infos.match(/\d{1,}\.\d{1,}\.\d{1,}/)[0];
      var actualDate = moment().locale('de').format("L");
      if(eventDate === actualDate) {
        event.title = data.children().eq(1).children().first().text();
        event.link = "http://talhof.sg" + data.children().eq(1).children().first().attr('href');
        //todo description anpassen
        event.description = data.children().eq(2).text();
      } else {
        event.link = "http://talhof.sg/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function militaerkantineFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "MILITÄRKANTINE", "color": "stable", "title": "Keine Veranstaltung", "link": "http://www.militaerkantine.ch/de/microsites/kultur/", "description": ""};
  if(content !== ""){
    $('#infoseite').filter(function(){
  	  var data = $(this).children().eq(1);
      var infos = data.children().eq(1).children().first().text();
      var eventDate = infos.match(/\d{2}\.\s\w{1,}\s\d{4}/i)[0];
      var actualDate = moment().locale('de').format("LL");
      event.link = "http://www.militaerkantine.ch/de/microsites/kultur/";
      if(eventDate === actualDate) {
        event.title = data.children().eq(2).children().first().text();
        event.description = infos.replace(/\w{2},\s\d{2}\.\s\w{1,}\s\d{4}/, '').trim();
      } else {
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function treppenhausFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "TREPPENHAUS", "color": "assertive", "title": "Keine Veranstaltung", "link": "http://treppenhaus.ch/", "description": ""};
  if(content !== ""){
    $('main.content').filter(function(){
  	  var data = $(this).children().eq(2).children().first();
      var day = data.children().first().children().eq(1).children().first().text() + ". ";
      var month = $(this).children().eq(1).text().replace(':', '') + " ";
      var year = moment().format("YYYY");
      var eventDate = day + month + year;
      var actualDate = moment().locale('de').format("LL");
      if(eventDate === actualDate) {
        event.title = data.children().eq(1).children().eq(1).children().first().text().trim();
        event.link = data.attr('href');
        //todo description anpassen
        event.description = "";
      } else {
        event.link = "http://treppenhaus.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function kuglFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "KUGL", "color": "calm", "title": "Keine Veranstaltung", "link": "http://kugl.ch/", "description": ""};
  if(content !== ""){
    $('.event-item-holder').filter(function(){
      var data = $(this).children().first().children().first().children();
      var day = data.first().children().eq(1).text();
      var month = data.first().children().eq(3).text();
      var year = moment().format("YYYY");
      var eventDate = month + " " + day + ", " + year;
      var actualDate = moment().format("ll");
      if(eventDate === actualDate) {
        event.title = data.eq(1).children().first().text();
        event.link = data.eq(1).children().first().attr('href');
        event.description = data.eq(2).text();
      } else {
        event.link = "http://kugl.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function grabenFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "GRABENHALLE", "color": "positive", "title": "Keine Veranstaltung", "link": "http://grabenhalle.ch/", "description": ""};
  if(content !== ""){
    $('#content').filter(function(){
      var data = $(this).children().eq(2).children().first().children().first().children().first().children().first().children().eq(1).children();
      var infos = data.first().text();
      var eventDate = infos.match(/\d{1,}\.\s\w{1,}/i)[0] + " " + moment().format("YYYY");
      var actualDate = moment().locale('de').format("LL");
      if(eventDate === actualDate) {
        event.title = data.eq(5).children().first().text();
        event.link = "http://grabenhalle.ch" + data.eq(5).attr('href');
        var descriptionTable = data.find('table').first().children();
        var description = descriptionTable.first().children().first().text();
        description += " " + descriptionTable.first().children().eq(1).text();
        description += " " + descriptionTable.eq(1).children().first().text();
        description += " " + descriptionTable.eq(1).children().eq(1).text();
        description += " " + descriptionTable.eq(2).children().first().text();
        description += " " + descriptionTable.eq(2).children().eq(1).text();
        event.description = description;
      } else {
        event.link = "http://grabenhalle.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function tankstellFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "TANKSTELL", "color": "balanced", "title": "Keine Veranstaltung", "link": "http://treppenhaus.ch/", "description": ""};
  if(content !== ""){
    $('#content').filter(function(){
      var data = $(this).children().first();
      var infos = data.children().first().text();
      var array = infos.match(/\|\s.{1,}\|/i);
      var replace1 = array[0].replace('| ','');
      var eventDate = replace1.replace(' |', '');
      var actualDate = moment().locale('de').format("LL");
      event.link = "http://tankstell.ch/";
      if(eventDate === actualDate) {
        event.title = data.children().eq(1).text();
        var description = infos.match(/\|\s\d{4}.{1,}/i)[0].slice(2);
        event.description = description;
      } else {
        event.link = "http://treppenhaus.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function oyaFilter(content) {
  var $ = cheerio.load(content);
  var event = { "name": "ØYA", "color": "energized", "title": "Keine Veranstaltung", "link": "http://oya-bar.ch/", "description": ""};
  if(content !== ""){
    $('#events_container').filter(function(){
      var data = $(this).children().first().children();
      var infos = data.eq(1).text();
      var eventDate = infos.match(/\d{2}\.\s\w{1,}/i)[0] + " " + moment().format("YYYY");
      var actualDate = moment().locale('de').format("LL");
      if(eventDate === actualDate) {
        event.link = "http://oya-bar.ch/" + data.eq(2).children().first().attr('href');
        event.title = data.eq(2).children().first().text();
        event.description = infos.match(/\d{2}\:\d{2}/i) + " Uhr";
      } else {
        event.link = "http://oya-bar.ch/";
        event.title = "Keine Veranstaltung";
      }
    });
  }
  return event;
}

function writeVenues(venues) {
  client.del('venues');
  var jsonString = JSON.stringify(venues);
  console.log(jsonString);
  client.set('venues', jsonString , function(err) {
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
