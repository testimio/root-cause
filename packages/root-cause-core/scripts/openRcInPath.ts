import open from 'open';
import { parse } from 'path';
import { openServer } from '../lib/server';

async function main() {
  const path = process.argv[2];
  const execName = parse(__filename).base;

  if (!path) {
    console.error(`
Usage: yarn ts-node ${execName} <path to test run>

f.e: yarn ts-node ${execName} lib/testsResults/.root-cause/runs/mock_invocation_id/<run id>
`);
    return;
  }

  const url = await openServer(Number(process.env.PORT) || 9876, path);
  open(url);

  console.log('Press any key to exit');

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}

main().catch(console.error);
