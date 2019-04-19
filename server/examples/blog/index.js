const {router, api} = require('../../dist');

router.get('/hello', async (ctx) => {
  ctx.res.body = 'hello';
});

api.fun('hello', async ctx => {

}, {
  res: {
    label: '格式',
    values: ['string', 'json'],
    defaultValue: 'string'
  }
});