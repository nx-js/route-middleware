# The route middleware

The `route` middleware is responsible for client-side routing.

- name: route
- direct middleware dependencies: none
- all middleware dependencies: none
- type: component middleware
- [docs](http://nx-framework.com/docs/middlewares/route)

## Installation

`npm install @nx-js/route-middleware`

## Usage

```js
const component = require('@nx-js/core')
const route = require('@nx-js/route-middleware')

component()
  .use(route)
  .register('router-comp')
```

```html
<router-comp>
  <div route="profile" default-route></div>
  <div route="settings"></div>
</router-comp>
```
