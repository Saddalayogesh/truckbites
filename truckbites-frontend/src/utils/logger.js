const LOG_PREFIX = '[TruckBites]';

const levels = {
  DEBUG: { priority: 0, label: 'DEBUG', color: '#6B7280' },
  INFO: { priority: 1, label: 'INFO', color: '#2563EB' },
  WARN: { priority: 2, label: 'WARN', color: '#F59E0B' },
  ERROR: { priority: 3, label: 'ERROR', color: '#EF4444' },
};

const currentLevel = import.meta.env.DEV ? 'DEBUG' : 'INFO';

function shouldLog(level) {
  return levels[level].priority >= levels[currentLevel].priority;
}

function log(level, component, message, data) {
  if (!shouldLog(level)) return;

  const style = `color: ${levels[level].color}; font-weight: bold;`;
  const label = `%c${LOG_PREFIX}[${level}][${component}]`;

  if (data !== undefined) {
    if (level === 'ERROR') {
      console.error(label, style, message, data);
    } else if (level === 'WARN') {
      console.warn(label, style, message, data);
    } else {
      console.log(label, style, message, data);
    }
  } else {
    if (level === 'ERROR') {
      console.error(label, style, message);
    } else if (level === 'WARN') {
      console.warn(label, style, message);
    } else {
      console.log(label, style, message);
    }
  }
}

const logger = {
  debug: (component, message, data) => log('DEBUG', component, message, data),
  info: (component, message, data) => log('INFO', component, message, data),
  warn: (component, message, data) => log('WARN', component, message, data),
  error: (component, message, data) => log('ERROR', component, message, data),
};

export default logger;
