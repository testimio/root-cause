'use strict';

const a = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';

export function guid(n = 10) {
  let str = '';
  for (let i = 0; i < n; i++) {
    const index = Math.floor(Math.random() * (a.length - 1));
    str += a[index];
  }
  return str;
}
