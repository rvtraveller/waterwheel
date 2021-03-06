const Base = require('./base');
const methods = require('./methods');

module.exports = class Request extends Base {
  constructor(base, credentials) {
    super();
    // Every instance of Waterwheel has a base path and base credentials.
    this.base = base;
    this.credentials = credentials;
    this.csrfToken = null;
    this.axios = require('axios');
  }

  /**
   * Issue a generic XMLHttpRequest.
   * @param {string} method
   *  The HTTP method to be used in the request.
   * @param {string} url
   *  The URL against which to issue the request.
   * @param {string} XCSRFToken
   *  An X-CSRF-Token from Drupals REST API.
   * @param {object} additionalHeaders
   *  An object containing additional request header key-value pairs.
   * @param {object} body
   *  An object containing the request body to be sent.
   * @param {string} baseOverride
   *   Override the base URL in special scenarios.
   * @returns {Promise}
   *  A Promise that when fulfilled returns a response from the request.
   */
  issueRequest(method, url, XCSRFToken, additionalHeaders, body, baseOverride) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        url: `${baseOverride || this.base}/${url.charAt(0) === '/' ? url.slice(1) : url}`,
        auth: this.credentials,
        headers: {
          'X-CSRF-Token': XCSRFToken
        }
      };

      // If this is a GET request, drop the CSRF Token header.
      if (method === methods.get) {
        delete options.headers['X-CSRF-Token'];
      }

      // If we have additionalHeaders, set them.
      // @TODO: This is NOT the safest way, so be careful.
      if (additionalHeaders && Object.keys(additionalHeaders).length !== 0) {
        Object.keys(additionalHeaders).forEach(key => {
          options.headers[key] = additionalHeaders[key];
        });
      }

      if (body) {
        options.data = body;
      }

      this.axios(options)
        .then(res => resolve(res.data))
        .catch(err => {
          const error = new Error(err.data.message);
          error.status = err.status;
          return reject(error);
        });
    });
  }
  /**
   * Get an X-CSRF-Token from Drupal's REST module.
   * @return {Promise}
   *  A Promise that when fulfilled returns a response containing the X-CSRF-Token.
   */
  getXCSRFToken() {
    if (this.csrfToken) {
      return Promise.resolve(this.csrfToken);
    }
    return new Promise((resolve, reject) => {
      this.axios({method: 'get', url: `${this.base}/rest/session/token`})
        .then(res => {
          this.csrfToken = res.data;
          return resolve(res.data);
        })
        .catch(err => reject(err));
    });
  }
};
