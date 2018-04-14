import { Base64 } from 'js-base64'
import { compose, map, toPairs, ifElse, prop, has, tap, head } from 'ramda'
import { Maybe, Task } from './types'


const config = Object.freeze({
  frameId: 'browserswitch-frame',
  menuBaseId: 'browserswitch-menu'
})


const errors = Object.freeze({
  'TAB_NOT_FOUND': 'Current tab could not be determined',
  'TAB_ID_MISSING': 'Missing tab ID'
})


// handleClick :: String -> Object -> IO()
const handleClick = (context, browserId) => contextInfo => {
  const link = generateLink(browserId)(contextInfo)

  sendLink(link)
    .chain(closeCurrentTab(context))
    .fork(
      error => { throw error },
      data  => {}
    )
}


// sendLink :: String -> Task
const sendLink = link =>
  closePreviousFrame()
    .chain(createNewFrame(link))


// closePreviousFrame :: Task
const closePreviousFrame =  () =>
  new Task((reject, resolve) => {
    try {
      document.getElementById(config.frameId).remove()
    } catch (e) {}
    resolve()
  })


// generateLink :: String -> Object -> String
const generateLink = browserId =>
  compose(
    (url => `browser-switch://${browserId}/${url}`),
    Base64.encodeURI,
    ifElse(has('linkUrl'), prop('linkUrl'), prop('pageUrl'))
  )


// createNewFrame :: String -> Task
const createNewFrame = url => () =>
  new Task((reject, resolve) => {
    try {
      var iframe = document.createElement('iframe')
      iframe.setAttribute('id', config.frameId)
      iframe.setAttribute('src', url)
      document.body.appendChild(iframe)
      resolve()
    } catch (e) {
      reject(e)
    }
  })


// closeCurrentTab :: String -> Task
const closeCurrentTab = context => () =>
  context === 'page'
    ? queryTabs()
        .map(takeFirstId)
        .chain(closeTab)
    : Task.of()


// takeFirstId :: Array -> Maybe Int
const takeFirstId =
  compose(
    map(prop('id')),
    Maybe.fromNullable,
    head
  )


// queryTabs :: Task
const queryTabs = () =>
  new Task((reject, resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, matches => {
      matches.length
        ? resolve(matches)
        : reject(errors.TAB_NOT_FOUND)
    })
  })


// closeTab :: Maybe Int -> Task
const closeTab = id =>
  new Task((reject, resolve) => {
    id.matchWith({
      Just: ({value}) => {
        chrome.tabs.remove(value, () => resolve())
      },

      Nothing: () =>
        Task.rejected(errors.TAB_ID_MISSING)
    })
  })


// vvv Refactor vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

// registerMenu ::
const registerMenu = ([browserId, label]) => {
  const baseConfig = {
    documentUrlPatterns: [
      'http://*/*',
      'https://*/*'
    ]
  }

  chrome.contextMenus.create({
    ...baseConfig,
    title: `Open in ${label}`,
    id: `${config.menuBaseId}-link-${browserId}`,
    contexts: ['link'],
    onclick: handleClick('link', browserId)
  })

  chrome.contextMenus.create({
    ...baseConfig,
    title: `Move tab to ${label}`,
    id: `${config.menuBaseId}-page-${browserId}`,
    contexts: ['page'],
    onclick: handleClick('page', browserId)
  })
}


// registerMenus ::
const registerMenus =
  compose(
    map(registerMenu),
    toPairs
  )


registerMenus({
  'safari': 'Safari',
  'opera':  'Opera'
})
