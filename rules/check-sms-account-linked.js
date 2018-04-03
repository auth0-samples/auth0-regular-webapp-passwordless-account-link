function checkSmsAccountLinked (user, context, callback) {
  if (context.clientID !== '{{YOUR CLIENT ID}}') {
    return callback(null, user, context);
  }
  var getStatus = function (profile) {
    var containsSms = function (identities) {
      if (!identities) {
        return false;
      }
      var check = false;
      identities.forEach(function (identity) {
        if (identity.provider === 'sms') {
          check = true;
        }
      });
      return check;
    };
    var linkedAccount = profile.identities && profile.identities.length > 1;
    var hasSms = profile.identities && containsSms(profile.identities);
    return {
      linkedAccount: linkedAccount,
      hasSms: hasSms
    };
  };
  var status = getStatus(user);
  var namespace = 'https://app1.demonstration.site/';
  context.idToken[namespace + 'mobile_required'] = !(status.linkedAccount && status.hasSms);
  context.idToken[namespace + 'link_required'] = (!status.linkedAccount && status.hasSms);
  callback(null, user, context);
}
