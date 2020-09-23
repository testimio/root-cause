'use strict';

module.exports = {
  preset: 'ts-jest',
  // This is here to avoid running built tests on dist/ dir
  roots: ['<rootDir>/lib/'],
};
