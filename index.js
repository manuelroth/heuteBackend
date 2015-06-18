var express = require('express');
var redis = require('redis');
var url = require('url');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var Crawler = require('crawler');
var cors = require('cors');
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
    
    var venues = crawl();
    client.hmset('venues', venues , function(err) {
        if (err) {
           // Something went wrong
           console.error('Error: Couldnt write venues to redit');
        } else {
           console.log('Successfully written: '+ moment().format('MMMM Do YYYY, h:mm:ss a'));
        }
    });
  },
  start: true,
  timeZone: "Europe/Zurich"
});
job.start();

app.get('/', function(request, response) {
  client.hgetall('venues', function(err, value) {
       if (err) {
           response.status(404);
           response.send('Error: Couldnt fetch venues off redit')
           console.error('Error: Couldnt fetch venues off redit');
       } else {
         console.log('Successfully read: ' + moment().format('MMMM Do YYYY, h:mm:ss a'));
         response.json(value);;
       }
  });
});

function crawl() {
  var venues = { palace: {}, grabenhalle: {}, kugl: {}, tankstell: {}, oya: {}, treppenhaus: {}, militaerkantine: {}, talhof: {}, flon: {}};
  var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page 
    callback : function (error, result, $) {
      
    }
  });
  
  
  c.queue([{
    uri: 'http://www.palace.sg/',
    jQuery: true,
 
    // The global callback won't be called 
    callback: function (error, result, $) {
        var event = { name: 'PALACE', color: 'stable', title: '', link: '', description: ''};
        
        venues.palace = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://www.grabenhalle.ch/',
    jQuery: true,
 
    // The global callback won't be called 
    callback: function (error, result, $) {
        var event = { name: 'GRABENHALLE', color: 'positive', title: '', link: '', description: ''};
        
        /*$('div#content > table > tbody > tr > td > table:nth-child(1)').filter(function(){
          var data = $(this).children().first().children().first().children().eq(1).children();
          event.title = data.eq(5).text();
          event.link = 'http://www.grabenhalle.ch' + data.eq(5).attr('href');
          event.description = data.eq(10).children().first().children().eq(1).children().first().children().first().;
        });*/

        venues.grabenhalle = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://kugl.ch/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'KUGL', color: 'calm', title: '', link: '', description: ''};
        
        $('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });
        venues.kugl = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://tankstell.ch/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'TANKSTELL', color: 'balanced', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.tankstell = event;
    }
  }]);
  
   c.queue([{
    uri: 'http://oya-bar.ch/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'ØYA', color: 'energized', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.oya = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://treppenhaus.ch/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'TREPPENHAUS', color: 'assertive', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.treppenhaus = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://www.militaerkantine.ch/de/microsites/kultur/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'MILITÄRKANTINE', color: 'stable', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.militaerkantine = event;
    }
  }]);
  
  c.queue([{
    uri: 'http://talhof.sg/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'TALHOF', color: 'balanced', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.talhof = event;
    }
  }]);
  
   c.queue([{
    uri: 'http://www.flon-sg.ch/',
    jQuery: true,
    
    // The global callback won't be called 
    callback : function (error, result, $) {
        var event = { name: 'FLON', color: 'royal', title: '', link: '', description: ''};
        
        /*$('.event-item-holder').filter(function(){
          var data = $(this).children().first().children().first().children();
          event.title = data.eq(1).children().first().text();
          event.link = data.eq(1).children().first().attr('href');
          event.description = data.eq(2).text();
        });*/
        venues.flon = event;
    }
  }]);
  
  return venues;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
