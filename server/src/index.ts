import start, {ServerOptions} from './server';

const options: ServerOptions = {};
options.dev = process.argv.findIndex(arg => arg == '--dev') >= 0;

start(options)
  .catch(err => console.error(err));