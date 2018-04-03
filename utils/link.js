const request = require('request');

const linkAccounts = (primaryUserId, primaryIdToken, primaryAccessToken, secondaryIdToken) => {
  return new Promise((resolve, reject) => {
    // do account linking
    var encodedprimaryUserId = encodeURIComponent(primaryUserId);
    var path = `/api/v2/users/${encodedprimaryUserId}/identities`;
    var linkUri = `https://${process.env.AUTH0_DOMAIN}${path}`;

    var options = {
      method: 'POST',
      url: linkUri,
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + primaryIdToken,
        'cache-control': 'no-cache'
      },
      body: JSON.stringify({link_with: secondaryIdToken})
    };

    request(options, function (err, response, body) {
      if (err) {
        return reject(new Error(err));
      }

      if (!response.statusCode === 201) {
        return reject(new Error('Unexpected response code from server: ' + response.statusCode));
      }

      const profileArray = JSON.parse(body);
      const firstProfileEntry = profileArray[0];
      const primaryConnection = firstProfileEntry.connection;
      const expectedPrimaryConnection = process.env.AUTH0_CONNECTION;

      if (!expectedPrimaryConnection === primaryConnection) {
        return reject(new Error('Error linking accounts - wrong primary connection detected: ' + primaryConnection));
      }
      // Just fetch updated (linked) profile using previously obtained profile access token
      var options = {
        method: 'GET',
        url: `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer ' + primaryAccessToken,
          'cache-control': 'no-cache'
        }
      };
      request(options, function (err, response, body) {
        if (err) {
          return reject(new Error(err));
        }
        if (!response.statusCode === 200) {
          return reject(new Error('Unexpected response code from server: ' + response.statusCode));
        }
        var newUser = JSON.parse(body);
        return resolve(newUser);
      });
    });
  });
};

module.exports = linkAccounts;
