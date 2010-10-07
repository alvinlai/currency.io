/*

    TODO:
    - Add support for decimal places (up to 2)
    - Last synced

*/
Object.prototype.touch = function(func) {

  var up,
      func,
      moving,
      target;

  if (window.Touch){

    this.addEventListener('touchstart', function(e){
      e.preventDefault();

      if (!e.touches || e.touches.length > 1) return;

      this.className = 'active';
      this.addEventListener('touchmove', moving = function(e){}, false);

    }, false);

    this.addEventListener('touchend', function(e){
      e.preventDefault();

      this.className = '';
      this.removeEventListener('touchmove', moving);

      if (func) func.apply(this, [e]);

    }, false);

  } else {

    this.addEventListener('click', func);

  }

}

var $ = function(q, e) {
  var e = e || document,
      match = e.querySelectorAll(q);
  return match.length > 1 ? match : match[0];
}

var Converter = {
  update_currency_display: function() {
    var from_id = window.from_to.from,
        to_id = window.from_to.to,
        from = window.currencies[from_id],
        to = window.currencies[to_id];

    Calculator.rate = from.rate_usd * (1 / to.rate_usd);

    $("#input h2").innerHTML = '<em>'+from.symbol+'</em> '+from.name;
    $("#output h2").innerHTML = '<em>'+to.symbol+'</em> '+to.name;

    html = '<button id="change">Change</button> '+from_id+' <span>&rarr;</span> '+to_id;
    $('#rates').innerHTML = html;

    Calculator.add('');
  },

  update_currencies: function() {
    var currencies = [];
    for (var currency in window.currencies) {
      if (!window.currencies.hasOwnProperty(currency)) continue;
      currencies.push(currency);
    }

    if (!navigator.onLine) return;

    var r = new XMLHttpRequest();
    r.open('POST', '/exchange?currencies='+currencies.toString(), true);
    r.send(null);

    r.onreadystatechange = function() {
      if (r.readyState === 4) {
        if (this.status == 200) {
          var data = JSON.parse(r.responseText);
          for (var key in data) window.currencies[key].rate_usd = data[key];

          localStorage.currencies = JSON.stringify(window.currencies);
          Converter.update_currency_display();
        } else {
          console.error('Request failed.');
        }
      }
    }
  }
}

var Calculator = {
  input: $('#input h1'),
  output: $('#output h1'),
  rate: 0,

  add: function(value) {
    var old = this.input.innerText !== '0' ? this.strip_commas(this.input.innerText) : '';
    this.update_values(old + value);
  },

  update_values: function(value) {
    var value = this.strip_commas(value),
        output_value = (value * this.rate).toFixed();

    if (value.length > 11 || output_value.length > 11) return;
    if (!value) value = 0;

    this.input.innerHTML = this.add_commas(value);
    this.output.innerHTML = this.add_commas(output_value);
  },

  clear: function() {
    this.update_values('0');
  },

  add_commas: function(num) {
    var re = /(\d+)(\d{3,3})/,
        split = (''+num).split('.'),
        num = split[0],
        decimals = split[1] !== undefined ? '.'+split[1] : '';

    while (re.test(num)) num = num.replace(re, '$1,$2');
    return num + decimals;
  },

  strip_commas: function(num) {
    return num.replace(/,/g, '');
  }

}

/*

  Handle button events

*/

var buttons = $('#input-pad p');
for (var i = 0, ii = buttons.length; i < ii; i++) {
  if (!!buttons[i].id.length) continue;
  buttons[i].touch(function() { Calculator.add(this.innerText); });
}

$('#clear').touch(function(e) {
  Calculator.clear();
});

$('#rates').touch(function(e) {
  var target = e.target;

  if (target.id == 'change') {
    e.stopPropagation();
    $('#rate-selection').style.display = 'block';
  }
});

$('#rate-selection').touch(function(e) {
  var target = e.target;

  if (target.id == 'close') {
    e.stopPropagation();
    $('#rate-selection').style.display = 'none';
  }
});

var rates = $('#rate-selection a');
for (var i = 0, ii = rates.length; i < ii; i++) {
  rates[i].touch(function() {
    var ref = this.id.split('-');
    window.from_to[ref[0]] = ref[1];
    localStorage.from_to = JSON.stringify(window.from_to);

    Converter.update_currency_display();
  });
}

if(!navigator.onLine) $('#network-status').className = 'offline';

Converter.update_currency_display();
Converter.update_currencies();
