const request = require('request');
const jwt = require('jsonwebtoken')

const getAccessTokenForMngmt = (cb) => {
  var options = {
    method: 'POST',
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    form: {
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    let access_token = JSON.parse(body).access_token
    cb(null, access_token)
  });
}

const linkAccounts = (primaryUserId, primaryIdToken, primaryAccessToken, secondaryIdToken) => {
  return new Promise((resolve, reject) => {
    getAccessTokenForMngmt((err, accessToken) => {
      console.log(accessToken)
      const decodedSecondaryIdToken = jwt.decode(secondaryIdToken)
      let splitedSub = decodedSecondaryIdToken.sub.split('|')

      // do account linking
      var encodedprimaryUserId = encodeURIComponent(primaryUserId);
      var path = `/api/v2/users/${encodedprimaryUserId}/identities`;
      var linkUri = `https://${process.env.AUTH0_DOMAIN}${path}`;

      var options = {
        method: 'POST',
        url: linkUri,
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer ' + accessToken,
          'cache-control': 'no-cache'
        },
        body: JSON.stringify({"provider": splitedSub[0], "user_id": splitedSub[1]})
      };
      console.log(options)

      request(options, function (err, response, body) {
        console.log(body)
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
  });
};

module.exports = linkAccounts;
