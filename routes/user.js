const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const router = express.Router();
const tokenUtils = require('../utils/tokenUtils');
const link = require('../utils/link');

/* GET user profile. */
router.get('/', ensureLoggedIn('/auth'), function (req, res, next) {
  const env = {
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL,
    LOGOUT_URL: process.env.LOGOUT_URL
  };
  // extract custom claims info from id token indicating what "state" this profile is in
  const mobileRequired = tokenUtils.getClaim(req.session.id_token, 'https://app1.demonstration.site/mobile_required');
  const linkRequired = tokenUtils.getClaim(req.session.id_token, 'https://app1.demonstration.site/link_required');
  if (!mobileRequired && !linkRequired) {
    // all good, just show page, no need for SMS
    return res.render('user', { env: env, user: req.user, showSms: false });
  } else {
    if (linkRequired && req.session.primaryUserId && req.session.primaryIdToken && req.session.primaryAccessToken) {
      if (req.session.ignoreLink) {
        // ok, so must be stale token info only, no need for SMS
        res.render('user', { env: env, user: req.user, showSms: false });
      }
      // account linking required
      const secondaryIdToken = req.session.id_token;
      // use stored information to achieve account linking
      link(req.session.primaryUserId, req.session.primaryIdToken, req.session.primaryAccessToken, secondaryIdToken)
        .then(function (updatedProfile) {
          // clean up session
          req.session.primaryUserId = null;
          req.session.primaryIdToken = null;
          req.session.primaryAccessToken = null;
          // replace profile and user with primary
          req.session.profile = req.session.primaryProfile;
          req.user = req.session.primaryUser;
          // setup flag to ignore custom claim links for this session
          // since tokens still contain stale flag information
          req.session.ignoreLink = true;
          res.render('user', { env: env, user: req.user, showSms: false });
        }).catch(function (err) {
          // just redirect to failure page
          console.log(err);
          req.flash('error', 'Account Link Failure');
          req.flash('error_description', 'Account linking failed with error: ' + err);
          res.redirect('/failure');
        });
    } else {
      if (mobileRequired) {
        // store this information away for later
        req.session.primaryProfile = req.session.profile;
        req.session.primaryUser = req.user;
        req.session.primaryUserId = req.session.profile._json.sub;
        req.session.primaryIdToken = req.session.id_token;
        req.session.primaryAccessToken = req.session.access_token;
      }
      // show the SMS form
      res.render('user', { env: env, user: req.user, showSms: true });
    }
  }
});

module.exports = router;
