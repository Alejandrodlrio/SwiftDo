
/**
 * Module dependencies.
 */

const db = require('../bd/pool.js');
const crypto = require('crypto')

//TODO LIMPIEZA DE CODIGO Y REVOKE ACCESS TOKEN

/*
 * Get access token.
 */

module.exports.getAccessToken = async function (accessToken) {
  console.log("GET ACCESS TOKEN", accessToken)

  const result = await db.query('SELECT access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, client_id, user_id FROM oauth_tokens WHERE access_token = $1', [accessToken])
  if(result.rowCount === 1){
    const token = result.rows[0];
    console.log("GET ACCESS TOKEN TOKEN", token)

    return {
      accessToken: token.access_token,
      client: { id: token.client_id },
      accessTokenExpiresAt  : token.access_token_expires_at,
      user: { id: token.user_id }, // could be any object
    };
  }
  
  return false;
};

/**
 * Get client.
 */

module.exports.getClient = function* (clientId, clientSecret) {
  console.log("GET CLIENT")

  return db.query('SELECT client_id, client_secret, redirect_uri, grants FROM oauth_clients WHERE client_id = $1', [clientId])
    .then(function (result) {
      var oAuthClient = result.rows[0];

      if (!oAuthClient) {
        return;
      }

      return {
        id: oAuthClient.client_id,
        clientSecret: oAuthClient.client_secret,
        redirectUris: [oAuthClient.redirect_uri],
        grants: [oAuthClient.grants], // the list of OAuth2 grant types that should be allowed
      };
    });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function* (bearerToken) {
  return db.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = $1', [bearerToken])
    .then(function (result) {
      return result.rowCount ? result.rows[0] : false;
    });
};

/*
 * Get user.
 */

module.exports.getUser = function* (username, password) {
  return db.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username, password])
    .then(function (result) {
      return result.rowCount ? result.rows[0] : false;
    });
};

/**
 * Save token.
 */

module.exports.saveToken = async function (token, client, user) {
  console.log("SAVE ACCESS TOKEN", token, client, user)
  //TODO MIRAR SI PONEMOS refresh_token, refresh_token_expires_on
  const result = await db.query('INSERT INTO oauth_tokens(access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, client_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [
    token.accessToken,
    token.accessTokenExpiresAt,
    token.refreshToken,
    token.accessTokenExpiresAt,
    client.id,
    user.id
  ])
  console.log("SAVE ACCESS TOKEN", result.rowCount)

  if(result.rowCount){
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: undefined,
      client: {id: client.id},
      user: {id: user.id}
    }
  }

  return false; // TODO return object with client: {id: clientId} and user: {id: userId} defined
};


/**
 * Save Auth code.
 */

module.exports.saveAuthorizationCode = async function (code, client, user) {
  console.log("SAVE AUTH CODE", code, client, user);

  const result = await db.query('INSERT INTO public.oauth_authcode(authorization_code, expires_at, redirect_uri, client_id, user_id) VALUES ($1, $2, $3, $4, $5)', [
    code.authorizationCode,
    code.expiresAt,
    code.redirectUri,
    client.id,
    user.user
  ])
  
  if(result.rowCount === 1){
    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      client: {id: client.clientId},
      user: {id: user.user}
    }
  }
  return false; // TODO return object with client: {id: clientId} and user: {id: userId} defined
}


module.exports.generateAuthorizationCode = async function (client, user, scope) {
  console.log("GENERANDO el AUTH CODE", client, user, scope)

  const seed = crypto.randomBytes(256)
  const code = crypto
    .createHash('sha1')
    .update(seed)
    .digest('hex')

  return code
}


module.exports.getAuthorizationCode = async function (authorizationCode) {
  const result = await db.query('SELECT * FROM oauth_authcode WHERE authorization_code = $1', [authorizationCode])
  const authcode = result.rows[0]
  console.log("AUTH CODE RECUPERADO", authcode);
  console.log("EXPIRATION DATE", authcode.expires_at)

  return {
    authorizationCode: authcode.authorization_code,
    expiresAt: authcode.expires_at,
    redirectUri: authcode.redirect_uri,
    scope: undefined,
    client: {id: authcode.client_id}, // with 'id' property
    user: {id: authcode.user_id}
  }
}

module.exports.revokeAuthorizationCode = async function(code) {
  console.log("REVOKE AUTH CODE", code)
  const result = await db.query('DELETE FROM oauth_authcode WHERE authorization_code = $1', [code.authorizationCode]);

  return result.rowCount === 1;
}

module.exports.verifyScope= function(token, scope){
  /* This is where we check to make sure the client has access to this scope */
  log({
    title: 'Verify Scope',
    parameters: [
      { name: 'token', value: token },
      { name: 'scope', value: scope },
    ],
  })
  const userHasAccess = true  // return true if this user / client combo has access to this resource
  return new Promise(resolve => resolve(userHasAccess))
}


