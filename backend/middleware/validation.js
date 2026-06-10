const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

const hasDollarKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) return true;
    if (typeof obj[key] === 'object' && hasDollarKeys(obj[key])) return true;
  }
  return false;
};

const isValidInteger = (value) => {
  return Number.isInteger(value) && value >= 0;
};

module.exports = {
  isValidObjectId,
  hasDollarKeys,
  isValidInteger,
};
