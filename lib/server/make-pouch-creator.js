'use strict';

var PouchDB = require('pouchdb');
var Promise = require('bluebird');

function createLocalPouch(args) {

  console.log('createLocalPouch');
  if (typeof args[0] === 'string') {
    args = [{ name: args[0] }];
  }

  // TODO: there is probably a smarter way to be safe about filepaths
  args[0].name = args[0].name.replace('.', '').replace('/', '');
  return Promise.resolve({
    pouch: new PouchDB(args[0])
  });
}

function createHttpPouch(options) {
  var remoteUrl = options.remoteUrl;
  console.log('initial remoteUrl: ', remoteUrl);
  // chop off last '/'
  if (remoteUrl.length > 0) {
    if (remoteUrl[remoteUrl.length - 1] === '/') {
      remoteUrl = remoteUrl.substring(0, remoteUrl.length - 1);
    }
  }

  return function (args) {
    if (typeof args[0] === 'string') {
      args = [{ name: args[0] }];
    }
    if (args[0].authorization) {
      console.log('args contains authorization');
      var token = args[0].authorization.token;
      var password = args[0].authorization.password;
      
      var atIdx = remoteUrl.indexOf('@');
      if (atIdx !== -1)
        remoteUrl = remoteUrl.substring(atIdx + 1)
  
      var doubleSlashIdx = remoteUrl.indexOf('//');
      if (doubleSlashIdx !== -1)
        remoteUrl = remoteUrl.substring(doubleSlashIdx + 2)

      // insert Authorisation to url
      remoteUrl = 'http://' + token + ':' + password + '@' + remoteUrl;
      console.log(remoteUrl);
    } else {
      console.log('no authorization provided.');
    }
   
    var fullUrl = (remoteUrl === '/') ?
      args[0].name : remoteUrl + '/' + args[0].name;

    console.log('fullUrl: ',fullUrl);
    return Promise.resolve({
      pouch: new PouchDB(fullUrl)
    });
  };
}

function makePouchCreator(options) {
  if (options.remoteUrl) {
    return createHttpPouch(options);
  }
  if (!options.pouchCreator) {
    return createLocalPouch;
  }
  return function (args) {
    var name = typeof args[0] === 'string' ? args[0] : args[0].name;
    var res = options.pouchCreator(name);
    if (res instanceof PouchDB) {
      return { pouch: res };
    } else {
      return res;
    }
  };
}

module.exports = makePouchCreator;