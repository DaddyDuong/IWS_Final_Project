const fs = require('fs');
const path = 'c:/CONGANHLAPTRINH/FIT_SUBJECTS/IWS FINAL/IWS_Final_Project/frontend/src/lib/mockData.js';
const content = fs.readFileSync(path, 'utf8');
const jsonStr = content.replace('export const mockProducts = ', '').replace(/;\s*$/, '');
const products = JSON.parse(jsonStr);

products.forEach(p => {
  if (!p.screen) p.screen = p.name.includes('15') || p.name.includes('16') ? '15.6" WQXGA (2560 x 1600) IPS' : '14.0" WQXGA (2560 x 1600) IPS';
  if (!p.graphic) p.graphic = 'Intel Arc Graphics';
  if (!p.battery) p.battery = '75 Wh (Up to 14 hours)';
  if (!p.weight) p.weight = '1.35 kg';
  if (!p.dimensions) p.dimensions = '315.6 x 224.4 x 15.9 mm';
  if (!p.os) p.os = 'Windows 11 Home';
  if (!p.port) p.port = '2 x Thunderbolt 4, 1 x USB-A 3.2, 1 x HDMI 2.1, 1 x Audio Jack';
  if (!p.connectivity) p.connectivity = 'Wi-Fi 6E, Bluetooth 5.3';
  if (!p.keyboard) p.keyboard = 'Backlit keyboard';

  // Add detailed ram and storage since the existing ones are ramGb and storageGb
  if (!p.ram) p.ram = `${p.ramGb}GB DDR5`;
  if (!p.storage) p.storage = `${p.storageGb}GB SSD`;
});

fs.writeFileSync(path, 'export const mockProducts = ' + JSON.stringify(products, null, 2) + ';\n');
