var decoded;
var gatt;
var mmservice;

function decode(d) {
  var status = d.getUint8(0);
  var value = d.getFloat32(1);
  var mode = d.getUint8(5);
  updateDisplay(value);
}

function updateDisplay(value) {
  var s = value.toString();

  var R = Bangle.appRect;
  g.reset().clearRect(R);
  g.setFont("12x20").setFontAlign(-1,-1).drawString("voltage", R.x, R.y);
  g.setFont("12x20").setFontAlign(1,1).drawString("V", R.x+R.w-1, R.y+R.h-1);
  var fontSize = 80;
  g.setFont("Vector",fontSize).setFontAlign(0,0);
  while (g.stringWidth(s) > R.w-20) {
    fontSize -= 2;
    g.setFont("Vector", fontSize);
  }
  g.drawString(s, R.x+R.w/2, R.y+R.h/2);
}

Bangle.loadWidgets();
Bangle.drawWidgets();
E.showMessage(/*LANG*/"Connecting...");

NRF.requestDevice({ filters: [{ services: '57d3a771-267c-4394-8872-78223e92aec4' }] }).then(function(device) {
  return device.gatt.connect();
}).then(function(g) {
  gatt = g;
  return gatt.getPrimaryService("7481d2f-5781-442e-bb9a-fd4e3441dadc");
}).then(function(service) {
  mmservice = service
  return mmservice.getCharacteristic("53dc9a7a-bc19-4280-b76b-002d0e23b078");
}).then(function(characteristic) {
  return characteristic.writeValue(0x01FF0003e8);
}).then(function (){
  mmservice.getCharacteristic("047d3559-8bee-423a-b229-4417fa603b90");
}).then(function(c) {
  c.on('characteristicvaluechanged', function(event) {
    d = event.target.value;
    decode(d);
  });
  return c.startNotifications();
}).then(function() {
  E.showMessage(/*LANG*/"Connected.");
}).catch(function(e) {
  E.showMessage(e.toString());
});



// .then(function(c) {
//   c.on('characteristicvaluechanged', function(event) {
//     d = event.target.value;
//     decode(d);
//   });
//   return c.startNotifications();
// }).then(function() {
//   E.showMessage(/*LANG*/"Connected.");
// }).catch(function(e) {
//   E.showMessage(e.toString());
// });
