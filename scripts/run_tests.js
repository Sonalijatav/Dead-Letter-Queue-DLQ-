/*
 A simple test script that enqueues a few jobs to demonstrate behavior.
 Make sure MongoDB is running and `npm install` executed.
*/
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args) {
  console.log('>', cmd, args.join(' '));
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) console.error('Error running', cmd, res.error);
}

const node = process.execPath;
const cli = path.join(__dirname, '..', 'bin', 'queuectl');

run(node, [cli, 'enqueue', JSON.stringify({ command: "echo job1 && sleep 1", max_retries: 2 })]);
run(node, [cli, 'enqueue', JSON.stringify({ command: "invalidcommandthatfails", max_retries: 2 })]);
console.log('Now start a worker in another terminal: node bin/queuectl worker start --count 1');
