function Authenticator() {
};

Authenticator.getInstance = function() {
  if (!Authenticator.instance_) {
    Authenticator.instance_ = new Authenticator();
  }
  return Authenticator.instance_;
}

Authenticator.prototype = {
  email_: null,
  password_: null,
  attemptToken_: null,

  // Input params from extension initialization URL.
  inputLang_ : undefined,
  intputEmail_ : undefined,

  GAIA_PAGE_ORIGIN: 'https://accounts.google.com',
  GAIA_PAGE_PATH: '/ServiceLogin?service=chromeoslogin' +
      '&skipvpage=true&sarp=1&rm=hide' +
      '&continue=chrome-extension://mfffpogegjflfpflabcdkioaeobkgjik/' +
      'success.html',
  THIS_EXTENSION_ORIGIN: 'chrome-extension://mfffpogegjflfpflabcdkioaeobkgjik',
  PARENT_PAGE: 'chrome://oobe/',

  initialize: function() {
    console.log('### Authenticator.initialize');

    var params = getUrlSearchParams(location.search);
    this.gaiaOrigin_ = params['gaiaOrigin'] || this.GAIA_PAGE_ORIGIN;
    this.inputLang_ = params['hl'];
    this.inputEmail_ = params['email'];
    this.testEmail_ = params['test_email'];
    this.testPassword_ = params['test_password'];

    document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this));
  },

  isGaiaMessage_: function(msg) {
    return msg.origin == this.gaiaOrigin_ ||
           msg.origin == this.GAIA_PAGE_ORIGIN;
  },

  isInternalMessage_: function(msg) {
    return msg.origin == this.THIS_EXTENSION_ORIGIN;
  },

  getFrameUrl_: function() {
    var url = this.gaiaOrigin_ + this.GAIA_PAGE_PATH;

    // TODO(xiyuan): Remove this when gaia_urls.cc is updated.
    if (this.gaiaOrigin_ == 'https://www.google.com')
      url = this.gaiaOrigin_ + '/accounts' + this.GAIA_PAGE_PATH;

    if (this.inputLang_)
      url += '&hl=' + encodeURIComponent(this.inputLang_);
    if (this.inputEmail_)
      url += '&Email=' + encodeURIComponent(this.inputEmail_);
    if (this.testEmail_)
      url += '&test_email=' + encodeURIComponent(this.testEmail_);
    if (this.testPassword_)
      url += '&test_pwd=' + encodeURIComponent(this.testPassword_);
    return url;
  },

  loadFrame_: function() {
    console.log('Authenticator loading GAIA frame');
    $('gaia-frame').src = this.getFrameUrl_();
  },

  onPageLoad: function(e) {
    window.addEventListener('message', this.onMessage.bind(this), false);
    this.loadFrame_();
  },

  onLoginUILoaded: function() {
    var msg = {
      'method': 'loginUILoaded'
    };
    window.parent.postMessage(msg, this.PARENT_PAGE);
    console.log('### Authenticator.onLoginUILoaded.');
  },

  onMessage: function(e) {
    var msg = e.data;
    console.log('#### Authenticator.onMessage: method=' + msg.method);
    if (msg.method == 'attemptLogin' && this.isGaiaMessage_(e)) {
      this.email_ = msg.email;
      this.password_ = msg.password;
      this.attemptToken_ = msg.attemptToken;
    } else if (msg.method == 'clearOldAttempts' && this.isGaiaMessage_(e)) {
      this.email_ = null;
      this.password_ = null;
      this.attemptToken_ = null;
      this.onLoginUILoaded();
    } else if (msg.method == 'confirmLogin' && this.isInternalMessage_(e)) {
      if (this.attemptToken_ == msg.attemptToken) {
        var msg = {
          'method': 'completeLogin',
          'email': this.email_,
          'password': this.password_
        };
        window.parent.postMessage(msg, this.PARENT_PAGE);
      } else {
        console.log('#### Authenticator.onMessage: unexpected attemptToken!?');
      }
    } else {
      console.log('#### Authenticator.onMessage: unknown message + origin!?');
    }
  }
};

console.log('#### main.html start');
Authenticator.getInstance().initialize();

