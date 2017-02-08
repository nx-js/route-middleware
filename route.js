'use strict'

const dom = require('@nx-js/dom-util')

const symbols = {
  config: Symbol('router config')
}
const rootRouters = new Set()

window.addEventListener('popstate', routeFromRoot)

function routeFromRoot () {
  rootRouters.forEach(routeRouterAndChildren)
}

function route (router) {
  setupRouter(router)
  extractViews(router)
  routeRouterAndChildren(router)
}
route.$name = 'router'
route.$type = 'component'
module.exports = route

function setupRouter (router) {
  router[symbols.config] = {
    children: new Set(),
    templates: new Map()
  }

  const parentRouter = dom.findAncestor(router, isRouter)
  if (parentRouter) {
    router.$routerLevel = parentRouter.$routerLevel + 1
    const siblingRouters = parentRouter[symbols.config].children
    siblingRouters.add(router)
    router.$cleanup(cleanupRouter, siblingRouters)
  } else {
    router.$routerLevel = 0
    rootRouters.add(router)
    router.$cleanup(cleanupRouter, rootRouters)
  }
}

function isRouter (node) {
  return node[symbols.config] !== undefined
}

function cleanupRouter (siblingRouters) {
  siblingRouters.delete(this)
}

function extractViews (router) {
  const config = router[symbols.config]
  let child = router.firstChild
  while (child) {
    if (child.nodeType === 1) {
      const route = child.getAttribute('route')
      if (route) {
        config.templates.set(route, child)
      } else {
        throw new Error('router children must have a non empty route attribute')
      }
      if (child.hasAttribute('default-route')) {
        config.defaultView = route
      }
    }
    child.remove()
    child = router.firstChild
  }
}

function routeRouterAndChildren (router) {
  const route = history.state.route
  const config = router[symbols.config]
  const templates = config.templates
  const defaultView = config.defaultView
  const currentView = config.currentView
  let nextView = route[router.$routerLevel]
  let useDefault = false

  if (!templates.has(nextView) && templates.has(defaultView)) {
    nextView = defaultView
    useDefault = true
  }

  let defaultPrevented = false
  if (currentView !== nextView) {
    const routeEvent = dispatchRouteEvent(router, currentView, nextView)
    defaultPrevented = routeEvent.defaultPrevented
    if (!defaultPrevented) {
      routeRouter(router, nextView)
      if (useDefault) {
        route[router.$routerLevel] = defaultView
        const state = Object.assign({}, history.state, { route })
        history.replaceState(state, '')
      }
    }
  } else if (!defaultPrevented) {
    config.children.forEach(routeRouterAndChildren)
  }
}

function dispatchRouteEvent (router, fromView, toView) {
  const eventConfig = {
    bubbles: true,
    cancelable: true,
    detail: { from: fromView, to: toView, level: router.$routerLevel }
  }
  const routeEvent = new CustomEvent('route', eventConfig)
  router.dispatchEvent(routeEvent)
  return routeEvent
}

function routeRouter (router, nextView) {
  const config = router[symbols.config]
  config.currentView = nextView
  router.innerHTML = ''
  const template = config.templates.get(nextView)
  if (template) {
    router.appendChild(document.importNode(template, true))
  }
}
