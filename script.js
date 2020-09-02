(function() {

    /**
     * Utility function to get form field data
     */
    function getFormData(el, fields, formObj) {
        const result = formObj || {};
        fields.forEach((field) => {
            result[field.name] = el.querySelector(field.path).value;
        });
        return result;
    }

    function findParentByTagName(el, tagName) {
        let parentEl = el.parentElement;
        while (null != parentEl && tagName != parentEl.tagName) {
            parentEl = parentEl.parentElement;
        }
        return parentEl;
    }

    function getRebaseFieldData(parentForm) {
        const data = {};
        parentForm
            .querySelectorAll("[data-rebase-field]")
            .forEach((field) => {
                data[field.dataset.rebaseField] = field.value;
            });
        return data;
    }

    function attachClickListener(el, path, callback) {
        if (path == "") {
            return el.addEventListener("click", callback);
        } else {
            return el.querySelector(path).addEventListener("click", callback);
        }
    }

    /**
     * Basically steal the code from https://www.w3schools.com/js/js_cookies.asp and make it look good
     */
    function _CookieMonster() {

        /**
         * Gets a cookie value
         */
        this.getCookie = function getCookie(cname) {
            const name = cname + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(";");
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        this.setCookie = function setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        }

        this.deleteCookie = function deleteCookie(cname) {
            document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

    }

    /**
     * Rebase authentication class
     */
    function _RebaseAuth() {
        this.token = '';
        this.clientId = '';
        const self = this;
        this.baseUrl = (window.location.href.startsWith('http://localhost')) ? 'http://localhost:8080' : 'https://guidmine.design';

        this.isAuthenticated = function isAuthenticated() {
            return (this.token != '');
        }

        this.hasClientId = function hasClientId() {
            return (this.clientId != '');
        }

        this.logoff = function logoff() {
            this.token = '';
        }

        this.invokeRebaseAsync = async function invokeRebaseAsync(url, method, data) {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            if (this.token != '') {
                headers['Authorization'] = `Bearer ${this.token}`;
                data['token'] = this.token;
            }
            if (this.clientId != '') {
                headers['client_id'] = this.clientId;
                data['client_id'] = this.clientId;
            }
            if (data != null) {
                return await window.fetch(this.baseUrl + url, {
                    method,
                    cache: "no-cache",
                    headers,
                    body: JSON.stringify(data)
                });
            } else {
                return await window.fetch(this.baseUrl + url, {
                    method,
                    cache: 'no-cache',
                    headers
                });
            }
        }

        this.registerForm = function registerForm(cb) {
            const registerDiv = document.querySelector(
                '[data-rebase-form="register"]'
            );
            if (!registerDiv) return;
            attachClickListener(registerDiv, '[data-rebase-action="register"]', (ev) => {
                const url = "/registerUser";
                const data = getFormData(
                    registerDiv,
                    [{
                            name: "email",
                            path: '[data-rebase-field="email"]'
                        },
                        {
                            name: 'firstName',
                            path: '[data-rebase-field="firstName"]'
                        },
                        {
                            name: 'lastName',
                            path: '[data-rebase-field="lastName"]'
                        },
                        {
                            name: "password",
                            path: '[data-rebase-field="password"]'
                        }
                    ], {
                        action: "registerUser"
                    }
                );
                self.invokeRebaseAsync(url, "POST", data)
                    .then(
                        (response) => response.json(),
                        (err) => console.log(error)
                    )
                    .then((data) => {
                        cb('registerUser', data);
                    });
            });
        }

        this.registerClient = function registerClient(cb) {
            const registerClientDiv = document.querySelector(
                '[data-rebase-form="registerClient"]'
            );
            if (!registerClientDiv) return;
            attachClickListener(
                registerClientDiv,
                '[data-rebase-action="registerClient"]',
                (ev) => {
                    const url = "/registerClient";
                    const data = getFormData(
                        registerClientDiv,
                        [{
                            name: "clientName",
                            path: '[data-rebase-field="clientName"]'
                        }], {
                            action: "registerClient"
                        }
                    );
                    self.invokeRebaseAsync(url, "POST", data)
                        .then(
                            (response) => response.json(),
                            (err) => console.log(err)
                        )
                        .then((data) => {
                            cb('registerClient', data);
                        });
                }
            );


        }

        this.loginForm = function loginForm(cb) {
            const loginDiv = document.querySelector('[data-rebase-form="login"]');
            if (!loginDiv) return;
            attachClickListener(loginDiv, '[data-rebase-action="login"]', (ev) => {
                const url = "/authorize";
                const data = getFormData(loginDiv, [{
                        name: "email",
                        path: '[data-rebase-field="email"]'
                    },
                    {
                        name: "password",
                        path: '[data-rebase-field="password"]'
                    }
                ]);
                self.invokeRebaseAsync(url, "POST", data)
                    .then(
                        (response) => response.json(),
                        (err) => console.log(error)
                    )
                    .then((data) => {
                        cb('login', data);
                    });
            });
        }

        this.getMeAsync = async function getMeAsync() {
          const url = "/me";
          return self.invokeRebaseAsync(url, "POST", {});
        }

        this.getMe = function getMe(cb) {
            const url = "/me";
            self.invokeRebaseAsync(url, "POST", {})
                .then(
                    (response) => response.json(),
                    (err) => console.log(error)
                )
                .then((data) => {
                    cb('me', data);
                });

        }

        this.renderLoop = function renderLoop(cb) {
            this.loginForm(cb);
            this.registerForm(cb);
            this.registerClient(cb);
        }
    }

    function renderTemplate(id) {
        const template = document.querySelector('#' + id);
        const appEl = document.querySelector('#app');
        appEl.innerHTML = '';

        appEl.appendChild(template.content.cloneNode(true));
    }

    /**
     * Controls the actions of the page
     */
    function pageController(nextPage) {
        RebaseAuth.token = CookieMonster.getCookie('rebaseToken');
        RebaseAuth.clientId = CookieMonster.getCookie('rebaseClientId');
        if (RebaseAuth.isAuthenticated() && !RebaseAuth.hasClientId() && nextPage == '') {
          RebaseAuth.getMe((action, data) => {
              if (action == "me") {
                if (data.data.user.clients.length == 0) {
                  setTimeout(() => pageController('registerClient'), 300);
                } else {
                  const clientId = data.data.user.clients[0].client_id;
                  CookieMonster.setCookie('rebaseClientId', clientId, 1);
                  setTimeout(() => pageController(''), 300);
                }
              }
          });
        } else if (RebaseAuth.isAuthenticated() && RebaseAuth.hasClientId()) {
          window.MyRebaseClient = new RebaseClient(RebaseAuth.token, RebaseAuth.clientId);
          renderTemplate('homeTemplate');

          setTimeout(() => {
            $('[data-rebase-action="add"]').click(($ev) => $('#createModal').modal('toggle'));
            $('[data-rebase-action="edit-hidden"]').click(($ev) => $('#editModal').modal('toggle'));
            $('[data-rebase-action="cancel-edit"]').click(($ev) => $('#editModal').modal('toggle'));
            MyRebaseClient.dataTable();
          }, 300);
        } else if (nextPage == 'register') {
          renderTemplate('registerTemplate');
          setTimeout(() => {
            $('[data-rebase-action="goto-login"]').click(($ev) => {
              pageController('login');
            })
          }, 300);
        } else if (nextPage == 'registerClient') {
          renderTemplate('registerClientTemplate');
          setTimeout(() => {
            $('[data-rebase-action="goto-login"]').click(($ev) => {
              pageController('login');
            })
          }, 300);
        } else {
            renderTemplate('loginTemplate');
            setTimeout(() => {
              $('[data-rebase-action="goto-register"]').click(($ev) => pageController('register'));
            }, 300);
        }

        RebaseAuth.renderLoop((action, data) => {

            if (action === 'login') {
              CookieMonster.setCookie('rebaseToken', data.data.JWT, 1);
            } else if (action === 'registerUser') {
              pageController('login');
            }

            setTimeout(() => pageController(''), 300);
        });
    }

    window.logoff = function logoff() {
        RebaseAuth.logoff();
        CookieMonster.deleteCookie('rebaseToken');
        CookieMonster.deleteCookie('rebaseClientId');
        setTimeout(() => pageController(''), 300);
    }

    window.RebaseAuth = new _RebaseAuth();
    window.CookieMonster = new _CookieMonster();
    window.MyRebaseClient = null;

    document.addEventListener('DOMContentLoaded', ($ev) => pageController(''));

})()