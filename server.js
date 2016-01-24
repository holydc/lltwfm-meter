var fs = require('fs');
var http = require('http');
var https = require('https');
var parseUrl = require('url').parse;
var path = require('path');
var querystring = require('querystring');

var moment = require('./moment');

//var port = process.env.port || 1337;
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var games = [
  {title:'Afternoon',id:14223},
  {title:'Evening',id:14224}
];

var sections = [
  {title:'VIP1',id:11898}, {title:'VIP2',id:11899}, {title:'VIP3',id:11900}, {title:'VIP4',id:11918}, {title:'VIP5',id:11919},
  {title:'S1',id:11901}, {title:'S2',id:11920}, {title:'S3',id:11902}, {title:'S4',id:11903}, {title:'S5',id:11904},
  {title:'A1',id:11905}, {title:'A2',id:11906}, {title:'A3',id:11921}, {title:'A4',id:11922}, {title:'A5',id:11907}
];

var DATA_FILE = 'data.json';

function getContentType(filename) {
  switch (path.extname(filename).toLowerCase()) {
    case '.js':
      return 'application/javascript';
    case '.gif':
      return 'image/gif';
    case '.jpg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.css':
      return 'text/css';
    case '.html':
      return 'text/html';
    default:
      return 'text/plain';
  }
}

function handleGet(url, response) {
  var filename = path.basename(parseUrl(url).pathname);
  if (!filename) {
    filename = 'index.html';
  }
  fs.readFile(filename, function (error, data) {
    function output() {
      response.writeHead(200, {
        'Content-Type': getContentType(filename)
      });
      response.end(data);
    }

    if (filename === 'index.html') {
      fs.readFile('visit', function (error, count) {
        if (error) {
          count = 0;
        }
        ++count;
        data = data.toString().replace("o'_'o", count);
        output();
        fs.writeFile('visit', count);
      });
    } else {
      output();
    }
  });
}

function outputDataFile(response) {
  fs.readFile(DATA_FILE, function (error, data) {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    });
    response.end(data);
  });
}

function update(response) {
  var requested = 0, responded = 0;
  var result = {};

  function query(game, section) {
    ++requested;

    var url = 'https://www.famiticket.com.tw/FWT/FWT0040.aspx?activitycode=1512Z04005&chose_type=false&ticket_total=1&game_id=' + game.id + '&section_id=' + section.id;
    https.get(url, function (res) {
      var html = '';
      res.on('data', function (data) {
        html += data;
      });
      res.on('end', function () {
        if (!result[section.title]) {
          result[section.title] = {};
        }
        result[section.title][game.title] = [html.match(/src="image\/icon\/icon_4.gif"/g).length, html.match(/src="image\/icon\/icon_[47].gif"/g).length];

        ++responded;
        if (responded === requested) {
          fs.writeFile(DATA_FILE, JSON.stringify(result), function (error) {
            outputDataFile(response);
          });
        }
      });
    });
  }

  for (var i = 0; i < games.length; ++i) {
    for (var j = 0; j < sections.length; ++j) {
      query(games[i], sections[j]);
    }
  }
}

function handleData(response) {
  fs.stat(DATA_FILE, function (error, stats) {
    if (error || (moment().diff(moment(stats.mtime), 'hours') > 1)) {
      update(response);
    } else {
      outputDataFile(response);
    }
  });
}

http.createServer(function (request, response) {
  switch (request.url) {
    case '/data.json':
      handleData(response);
      break;
    default:
      handleGet(request.url, response);
      break;
  }
}).listen(port, ip);
