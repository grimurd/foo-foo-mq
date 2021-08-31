const Exchanges = [{ name: 'myExchange', type: 'fanout' }];
const Queues = [{ name: 'myQueue' }];
const Bindings = [{ exchange: 'myExchange', target: 'myQueue' }];

const connectionSettings = {
  connection: {
    replyQueue: false
  },
  exchanges: Exchanges,
  queues: Queues,
  bindings: Bindings
};

// const rabbit = require('./src/index');
const rabbit = require('foo-foo-mq');
let retryCounter = 0;
let msgCount = 0;

class RabbitMQ {
  static async init () {
    rabbit.handle('#', (msg) => {
      console.log('Received: ', msg.body);
      msg.ack();
    }, Queues[0].name);
    await rabbit.configure(connectionSettings)
      .then(() => {
        console.log('connected');
      });

    rabbit.on('unreachable', () => {
      console.log(`RabbitMq: Host unreachable. Trying again -- ${++retryCounter}`);
      let intervalId = null;
      intervalId = setInterval(() => {
        console.log(`RabbitMq: Host still unreachable. Trying again -- ${++retryCounter}`);
        retryCounter++;
        console.log('Calling Retry');
        rabbit.retry().then(() => {
          clearInterval(intervalId);
        });
      }, 5000);
    });

    rabbit.on('failed', () => {
      console.log(`RabbitMq: Connection failed. Trying again -- ${retryCounter}`);
    });

    rabbit.on('connected', () => {
      console.log('RabbitMq: connected');
      retryCounter = 0;
    });

    rabbit.startSubscription(Queues[0].name);
  }
}

process.on('unhandledRejection', (err) => {
  console.log(err.message);
});

RabbitMQ.init()
  .then(() => {
    console.log('Initialized');
    setInterval(() => {
      console.log('publishing a message');
      rabbit.publish(Exchanges[0].name, 'testing', { a: msgCount++ });
    }, 3000);
  })
  .catch((err) => {
    console.log('fatal....................');
    console.log(err);
    process.exit(1);
  });

// var settings = {
//   connection: {
//     user: 'guest',
//     pass: 'guest',
//     server: '127.0.0.1',
//     // server: "127.0.0.1, 194.66.82.11",
//     // server: ["127.0.0.1", "194.66.82.11"],
//     port: 5672,
//     timeout: 2000
//     // vhost: "%2fmyhost"
//   },
//   exchanges: // Exchanges,
//     [
//       { name: 'config-ex.1', type: 'fanout', publishTimeout: 1000 },
//       { name: 'config-ex.2', type: 'topic', alternate: 'alternate-ex.2', persistent: true },
//       { name: 'dead-letter-ex.2', type: 'fanout' },
//       { name: 'my-exchange', type: 'fanout', passive: true }
//     ],
//   queues: // Queues,
//     [
//       { name: 'config-q.1', limit: 100, queueLimit: 1000 },
//       { name: 'config-q.2', subscribe: true, deadLetter: 'dead-letter-ex.2' },
//       { name: 'myQueue' }
//     ],
//   bindings: [
//     { exchange: 'config-ex.1', target: 'config-q.1', keys: ['bob', 'fred'] },
//     { exchange: 'config-ex.2', target: 'config-q.2', keys: 'test1' }
//   ]
// };
//
// var rabbit = require('./src/index');
//
// rabbit.configure(settings).then(function () {
//   console.log(
//     'connected'
//   );
//   // ready to go!
// }, (err) => {
//   console.log('uhoh: ', err);
// });
