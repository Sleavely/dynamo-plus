const path = require('path')
const src = path.resolve(process.cwd(), 'src')

describe('dynamo-plus', () => {
  it('can be loaded without throwing exceptions', () => {
    expect(() => {
      require(`${src}/..`)
    }).not.toThrow()
  })
})
