function incrementor(x) {
  --x;
  return (x * x * x) + 1;
}

incrementor.duration = 3000;
incrementor.interval = 30;
incrementor.increment = incrementor.interval / incrementor.duration;

function createImage(src, parent) {
  var img = document.createElement('img');
  parent.appendChild(img);
  img.src = src;
  return img;
}

function createSectionBackground(el, parent, front) {
  var left = 0, top = 0, width = el.offsetWidth, height = el.offsetHeight;
  while (el) {
    left += el.offsetLeft;
    top += el.offsetTop;
    el = el.offsetParent;
  }
  
  var div = document.createElement('div');
  parent.appendChild(div);
  div.style.position = 'absolute';
  div.style.left = '' + left + 'px';
  div.style.top = '' + top + 'px';
  div.style.width = '' + width + 'px';
  div.style.height = '' + height + 'px';
  if (!front) {
    div.style.zIndex = -1;
  }
  return div;
}

function createSection(title, data, parent) {
  var type = title.match(/([^\d]+)\d/)[1];
  var bar = document.createElement('div');
  parent.appendChild(bar);
  bar.className = [title, type, 'section'].join(' ');

  var meter = document.createElement('div');
  bar.appendChild(meter);
  meter.className = [type, 'meter'].join(' ');
  
  var info = document.createElement('div');
  bar.appendChild(info);
  info.className = 'meter';
  
  var reserved = data.Afternoon[0] + data.Evening[0], total = data.Afternoon[1] + data.Evening[1];
  var x = 0;
  var t = setInterval(function () {
    var y = incrementor(x);
    if (y >= 1) {
      clearInterval(t);
      y = 1;
    }
    y *= reserved;
    
    var percentage = y * 100 / total;
    meter.style.height = '' + percentage + '%';
    info.innerHTML = '' + title + '<br>' + Math.floor(y) + '/' + total + '<br>' + (Math.floor(percentage * 100) / 100) + '%';
    x += incrementor.increment;
  }, incrementor.interval);
}

function draw(canvas, percentage) {
  var x = canvas.width / 2, y = canvas.height / 2;
  var lineWidth = 20;
  var radius = x - (lineWidth / 2);
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = lineWidth;

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.stroke();
  
  context.beginPath();
  context.arc(x, y, radius, 1.5 * Math.PI, (1.5 + (2 * percentage)) * Math.PI);
  context.strokeStyle = 'white';
  context.stroke();
  
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.font = '24px sans-serif';
  context.fillText('' + (Math.floor(percentage * 10000) / 100) + '%', x, y);
}

function createDetail(title, data, parent) {
  var className = [title, 'detail'].join(' ');
  var detail = document.createElement('div');
  parent.appendChild(detail);
  detail.className = className;

  var expanded = false;
  var timers = [];
  detail.addEventListener('click', function () {
    if (!expanded) {
      function onExpanded() {
        function showInfo(title, data) {
          var div = document.createElement('div');
          detail.appendChild(div);

          var canvas = document.createElement('canvas');
          div.appendChild(canvas);
          canvas.width = 200;
          canvas.height = 200;

          var span = document.createElement('span');
          div.appendChild(span);

          var x = 0;
          var t = setInterval(function () {
            var y = incrementor(x);
            if (y >= 1) {
              clearInterval(t);
              y = 1;
            }
            y *= data[0];
            draw(canvas, y / data[1]);
            span.textContent = title + ': ' + Math.floor(y) + ' / ' + data[1];
            x += incrementor.increment;
          }, incrementor.interval);
          timers.push(t);
        }

        showInfo('午場', data.Afternoon);
        showInfo('晚場', data.Evening);
      }

      var transitionProperties = ['left', 'top', 'width', 'height'];
      detail.className += ' expanded';
      detail.addEventListener('transitionend', function _onTransitionEnd(event) {
        var i = transitionProperties.indexOf(event.propertyName);
        if (i >= 0) {
          transitionProperties.splice(i, 1);
        }
        if (transitionProperties.length === 0) {
          detail.removeEventListener('transitionend', _onTransitionEnd);
          onExpanded();
        }
      });
    } else {
      for (var i = 0; i < timers.length; ++i) {
        clearInterval(timers[i]);
      }
      timers = [];
      detail.innerHTML = '';
      detail.className = className;
    }
    expanded = !expanded;
  });
}

function ready() {
  var center = document.createElement('center');
  document.body.appendChild(center);

  createImage('event.jpg', center);
  center.appendChild(document.createElement('br'));

  var seats = createImage('seats.png', center);
  center.appendChild(document.createElement('br'));
  
  var message = document.createElement('span');
  center.appendChild(message);
  message.style.color = 'black';
  message.textContent = 'Loading...';

  var sectionBackground = createSectionBackground(seats, document.body);
  var sectionForeground = createSectionBackground(seats, document.body, true);
  
  /*
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState !== this.DONE) {
      return;
    }

    var data = JSON.parse(this.response);
    var reserved = 0, total = 0;
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        var _data = data[k];
        createSection(k, _data, sectionBackground);
        createDetail(k, _data, sectionForeground);
        reserved += (_data.Afternoon[0] + _data.Evening[0]);
        total += (_data.Afternoon[1] + _data.Evening[1]);
      }
    }
    message.textContent = 'Total: ' + reserved + ' / ' + total + ' (' + (Math.floor(reserved * 10000 / total) / 100) + ')';
  };
  xhr.open('GET', 'data');
  xhr.send();
  */
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  iframe.style.position = 'absolute';
  iframe.style.visibility = 'hidden';
  iframe.addEventListener('load', function (event) {
    var data = JSON.parse(iframe.contentDocument.body.textContent);
    var reserved = 0, total = 0;
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        var _data = data[k];
        createSection(k, _data, sectionBackground);
        createDetail(k, _data, sectionForeground);
        reserved += (_data.Afternoon[0] + _data.Evening[0]);
        total += (_data.Afternoon[1] + _data.Evening[1]);
      }
    }
    message.textContent = 'Total: ' + reserved + ' / ' + total + ' (' + (Math.floor(reserved * 10000 / total) / 100) + ')';
  });
  iframe.src = 'data';
}

(function () {
  document.addEventListener('DOMContentLoaded', ready);
})();
