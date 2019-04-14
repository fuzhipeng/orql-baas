exports.log = {
  label: '日志',
  options: {
    showAfter: {
      label: '显示after',
      type: 'select',
      values: ['true', 'false']
    }
  },
  before: () => {
    console.log('before: ' + new Date());
  },
  after: () => {
    console.log('after: ' + new Date());
  }
}