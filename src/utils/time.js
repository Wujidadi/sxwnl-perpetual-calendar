// 時間／日期格式工具。

export function parseTimeToHours(s) {
  s = String(s).replace(/[^0-9:\.]/g, '');
  const parts = s.split(':');
  let a, b, c;
  if (parts.length === 1) {
    a = parts[0].substr(0, 2) - 0;
    b = parts[0].substr(2, 2) - 0;
    c = parts[0].substr(4, 2) - 0;
  } else if (parts.length === 2) {
    a = parts[0] - 0;
    b = parts[1] - 0;
    c = 0;
  } else {
    a = parts[0] - 0;
    b = parts[1] - 0;
    c = parts[2] - 0;
  }
  return a + b / 60 + c / 3600;
}

export function formatDateTime(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}
