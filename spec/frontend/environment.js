/* eslint-disable import/no-commonjs, max-classes-per-file */

const path = require('path');
const { TestEnvironment } = require('jest-environment-jsdom');
const { ErrorWithStack } = require('jest-util');
const {
  setGlobalDateToFakeDate,
  setGlobalDateToRealDate,
} = require('./__helpers__/fake_date/fake_date');
const { TEST_HOST } = require('./__helpers__/test_constants');
const { createGon } = require('./__helpers__/gon_helper');

const ROOT_PATH = path.resolve(__dirname, '../..');

class CustomEnvironment extends TestEnvironment {
  constructor({ globalConfig, projectConfig }, context) {
    // Setup testURL so that window.location is setup properly
    super({ globalConfig, projectConfig: { ...projectConfig, testURL: TEST_HOST } }, context);

    // Fake the `Date` for `jsdom` which fixes things like document.cookie
    // https://gitlab.com/gitlab-org/gitlab/-/merge_requests/39496#note_503084332
    setGlobalDateToFakeDate();

    Object.assign(context.console, {
      error(...args) {
        throw new ErrorWithStack(
          `Unexpected call of console.error() with:\n\n${args.join(', ')}`,
          this.error,
        );
      },

      warn(...args) {
        if (args[0].includes('The updateQuery callback for fetchMore is deprecated')) {
          return;
        }
        throw new ErrorWithStack(
          `Unexpected call of console.warn() with:\n\n${args.join(', ')}`,
          this.warn,
        );
      },
    });

    const { IS_EE } = projectConfig.testEnvironmentOptions;

    this.global.IS_EE = IS_EE;

    // Set up global `gon` object
    this.global.gon = createGon(IS_EE);

    // Set up global `gl` object
    this.global.gl = {};

    this.rejectedPromises = [];

    this.global.promiseRejectionHandler = (error) => {
      this.rejectedPromises.push(error);
    };

    this.global.fixturesBasePath = `${ROOT_PATH}/tmp/tests/frontend/fixtures${IS_EE ? '-ee' : ''}`;
    this.global.staticFixturesBasePath = `${ROOT_PATH}/spec/frontend/fixtures`;

    /**
     * window.fetch() is required by the apollo-upload-client library otherwise
     * a ReferenceError is generated: https://github.com/jaydenseric/apollo-upload-client/issues/100
     */
    this.global.fetch = () => {};

    // Expose the jsdom (created in super class) to the global so that we can call reconfigure({ url: '' }) to properly set `window.location`
    this.global.jsdom = this.dom;

    //
    // Monaco-related environment variables
    //
    Object.defineProperty(this.global, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => null, // deprecated
        removeListener: () => null, // deprecated
        addEventListener: () => null,
        removeEventListener: () => null,
        dispatchEvent: () => null,
      }),
    });

    /**
     * JSDom doesn't have an own observer implementation, so this a Noop Observer.
     * If you are testing functionality, related to observers, have a look at __helpers__/mock_dom_observer.js
     *
     * JSDom actually implements a _proper_ MutationObserver, so no need to mock it!
     */
    class NoopObserver {
      /* eslint-disable no-useless-constructor, no-unused-vars, no-empty-function, class-methods-use-this */
      constructor(callback) {}
      disconnect() {}
      observe(element, initObject) {}
      unobserve(element) {}
      takeRecords() {
        return [];
      }
      /* eslint-enable no-useless-constructor, no-unused-vars, no-empty-function, class-methods-use-this */
    }

    ['IntersectionObserver', 'PerformanceObserver', 'ResizeObserver'].forEach((observer) => {
      if (this.global[observer]) {
        throw new Error(
          `We overwrite an existing Observer in jsdom (${observer}), are you sure you want to do that?`,
        );
      }
      this.global[observer] = NoopObserver;
    });
  }

  async teardown() {
    // Reset `Date` so that Jest can report timing accurately *roll eyes*...
    setGlobalDateToRealDate();

    // eslint-disable-next-line no-restricted-syntax
    await new Promise(setImmediate);

    if (this.rejectedPromises.length > 0) {
      throw new ErrorWithStack(
        `Unhandled Promise rejections: ${this.rejectedPromises.join(', ')}`,
        this.teardown,
      );
    }

    await super.teardown();
  }
}

module.exports = CustomEnvironment;
