const STATE_SET_HOURS_COUNTER = 0;
const STATE_SET_MINUTES_COUNTER = 1;
const STATE_RUNNING_FORWARD = 2;
const STATE_PAUSING = 3;
const STATE_RUNNING_BACK = 4;
const STATE_END = 5;

const FONT_SIZE = 60;
const X_OFFSET = 120;
const FIRSTLINE_Y = 80;
const SECONDTLINE_Y = 160;

var state = STATE_SET_HOURS_COUNTER;
var counterHour = 0;
var counterMinute = 0;

var btn1EventId;
var btn2EventId;
var btn3EventId;

/*
* user input overall time
*/
var initCounter = 0;

/*
* passing time counter
*/
var counter = 0;

/*
* time interval to arive to pause destination
*/
var timeToArrive = 0;

/*
* time interval taking pause in remote location
*/
var timePause = 0;
var timePauseRest = 0;
/*
* time interval to come back
*/
var timeToBack = 0;

/*
* refresh rate for this app
*/
var counterInterval = 1000;

function nextState() {
  if (state < 0 || state >= 5) return;
  state += 1;
  if (btn1EventId) clearWatch(btn1EventId);
  btn1EventId = undefined;
  if (btn3EventId) clearWatch(btn3EventId);
  btn3EventId = undefined;
  if (state == STATE_RUNNING_FORWARD) {
	  timePauseRest = initCounter;
  }
}

function incrCounterHour() {
  if (counterHour == 23) counterHour = 0;
  else counterHour += 1;
  initCounter = counterHour*1000*3600;
  showSetup();
}

function decrCounterHour() {
  if (counterHour === 0) counterHour = 23;
  else counterHour -= 1;
  initCounter = counterHour*1000*3600;
  showSetup();
}

function incrCounterMinute() {
  if (counterMinute == 59) counterMinute = 0;
  else counterMinute += 1;
  initCounter = counterHour*1000*3600 + counterMinute*1000*60;
  showSetup();
}

function decrCounterMinute() {
  if (counterMinute === 0) counterMinute = 59;
  else counterMinute -= 1;
  initCounter = counterHour*1000*3600 + counterMinute*1000*60;
  showSetup();
}

function main() {
  switch(state) {
    case STATE_SET_HOURS_COUNTER:
      if (!btn1EventId) btn1EventId = setWatch(incrCounterHour, BTN1, { repeat: true });
      if (!btn3EventId) btn3EventId = setWatch(decrCounterHour, BTN3, { repeat: true });
      showSetup();
      break;
    case STATE_SET_MINUTES_COUNTER:
      if (!btn1EventId) btn1EventId = setWatch(incrCounterMinute, BTN1, { repeat: true });
      if (!btn3EventId) btn3EventId = setWatch(decrCounterMinute, BTN3, { repeat: true });
      showSetup();
      break;
    case STATE_RUNNING_FORWARD: //show nav time incr
	    counter += counterInterval;
	    timeToArrive += counterInterval;
	    timePauseRest -= (2 * counterInterval);
	    if (timePauseRest <= 0) {
	      state = STATE_RUNNING_BACK;
	    } else {
	      drawTwoLineInterface(formatedCounter(timeToArrive),formatedCounter(timePauseRest));
	    }
      break;
    case STATE_PAUSING:
	    timePauseRest -= counterInterval;
      timePause += counterInterval;
	    counter += counterInterval;
	    if (timePauseRest <= 0) {
	      drawTwoLineInterface(formatedCounter(counter),formatedTime(timeToArrive));
	    } else {
	      drawTwoLineInterface(formatedCounter(timePauseRest),formatedTime(timeToArrive));
	    }
      break;
    case STATE_RUNNING_BACK:
	    counter += counterInterval;
	    timeToBack += counterInterval;
	    if (timeToArrive > timeToBack) {
	      drawTwoLineInterface(formatedCounter(timeToArrive - timeToBack),formatedTime(timeToArrive - timeToBack));
	    } else if (counter <= initCounter) {
	      drawTwoLineInterface(formatedCounter(initCounter - counter),formatedTime(0));
	    } else {
	      drawTwoLineInterface(formatedCounter(counter),formatedTime(0));
	    }
      break;
    case STATE_END:
      drawTwoLineInterface(formatedCounter(initCounter),formatedCounter(counter));
      clearInterval(runningIntervalHandler);
  }
}

setWatch(nextState, BTN2,{ repeat: true });

function showSetup() {
  drawTwoLineInterface(formatedSetupCounter(),formatedTime(initCounter));
}

function formatedSetupCounter() {
  return (counterHour > 9 ? counterHour : ('0' + counterHour)) + ':' + (counterMinute > 9 ? counterMinute : ('0' + counterMinute));
}

function formatedCounter(myCounter) {
  var hours = Math.floor(myCounter/(1000*60*60));
  var minutes = Math.floor((myCounter % (1000*60*60))/(1000*60));
  if (hours == 0 || hours == undefined) {
    var seconds = Math.floor((myCounter % (1000*60))/1000);
    return (minutes>9? minutes : '0' + minutes) + ':' + (seconds>9? seconds : '0' + seconds);
  }
  return (hours > 9 ? hours : '0' + hours) + ':' + (minutes>9? minutes : '0' + minutes);
}

function formatedTime(myTimeInterval) {
  var d = new Date();
  d.setTime(d.getTime() + myTimeInterval);
  var h = d.getHours();
  var m = d.getMinutes();
  return (h > 9 ? h : '0' + h) + ':' + (m > 9 ? m : '0' + m);
}

function showOverflow() {
  if (timeToArrive >= timeToBack) {
    //we still know the latecoming
    drawTwoLineInterface(formatedCounter(timePause),formatedTime(timeToArrive - timeToBack));
  } else {
    //we do know nothing
    drawTwoLineInterface(formatedCounter(initCounter),formatedCounter(counter));
  }
}

function drawTwoLineInterface(line1, line2) {
  g.clear();
  g.drawString(line1,X_OFFSET,FIRSTLINE_Y);
  g.drawString(line2,X_OFFSET,SECONDTLINE_Y);
  switch(state) {
    case STATE_SET_HOURS_COUNTER:
      drawHighlightHour();
      break;
    case STATE_SET_MINUTES_COUNTER:
      drawHighlightMinite();
      break;
    case STATE_RUNNING_FORWARD:
      drawStateForward();
      break;
    case STATE_PAUSING:
      drawStatePausing();
      break;
    case STATE_RUNNING_BACK:
      drawStateBack();
      break;
  }
  g.flip();
}

function drawHighlightHour() {
  var polyTop = [90,40,75,20,60,40];
  var polyBottom = [90,110,75,130,60,110];
  g.fillPoly(polyTop,true);
  g.fillPoly(polyBottom,true);
}

function drawHighlightMinite() {
  var polyTop = [175,40,160,20,145,40];
  var polyBottom = [175,110,160,130,145,110];
  g.fillPoly(polyTop,true);
  g.fillPoly(polyBottom,true);
}

function drawStateForward() {
  var poly1 = [105,230,120,220,105,210];
  var poly2 = [130,230,145,220,130,210];
  g.fillPoly(poly1,true);
  g.fillPoly(poly2,true);
}

function drawStatePausing() {
  var poly1 = [125,230,140,230,140,210,125,210];
  var poly2 = [95,230,110,230,110,210,95,210];
  g.fillPoly(poly1,true);
  g.fillPoly(poly2,true);
}

function drawStateBack() {
  var poly1 = [120,230,105,220,120,210];
  var poly2 = [145,230,130,220,145,210];
  g.fillPoly(poly1,true);
  g.fillPoly(poly2,true);
}

g.setFontAlign(0,0); // center font
g.setFont("Vector",FONT_SIZE);
var runningIntervalHandler = setInterval(main, counterInterval);