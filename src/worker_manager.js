const { fork } = require('child_process');
const path = require('path');

let children = [];

function startWorkers(count) {
  const script = path.join(__dirname, 'worker_process.js');
  for (let i=0;i<count;i++){
    const child = fork(script, [ String(i+1) ], { stdio: 'inherit' });
    children.push(child);
  }
  console.log('Started', count, 'workers (pids):', children.map(c=>c.pid));
}

function stopWorkers() {
  console.log('Stopping workers...');
  for (const c of children) {
    c.kill('SIGINT');
  }
  children = [];
}

module.exports = { startWorkers, stopWorkers };
