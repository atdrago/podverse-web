const { WEB_ORIGIN } = require('../constants')

module.exports = {
  before: function (browser) {
    browser.url(`${WEB_ORIGIN}/`)
  },
  'History': function (browser) {
    browser
      .click('div a[href="/history"]')
      .waitForElementWithText('.page-header h1', 'History')
      .waitForElementWithText('.message-with-action div', 'Log in to view your history')


      .loginUsingModal('premium@stage.podverse.fm')
      .waitForElementWithText('.page-scrollable-content .episode-list-item div.text-wrapper', '#1428 - Brian Greene')
      .logOutUsingModal()



  },
  after: function (browser) {
    browser.end()
  }
}
