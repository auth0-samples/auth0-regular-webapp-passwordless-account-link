
const request = require('request');

var getAuth0ManagementAPIToken = function () {
  return new Promise(function (resolve, reject) {
    var body = {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    };

    var uri = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;

    var options = {
      method: 'POST',
      url: uri,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    request(options, function (err, response, body) {
      if (err) {
        return reject(new Error(err));
      }
      var token = JSON.parse(body).access_token;
      return resolve(token);
    });
  });
};

module.exports = getAuth0ManagementAPIToken;
