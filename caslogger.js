(function CASLogger() {
    "use strict";

    // Paramètres
    var CLParams = {
        // url du serveur CASLogger
        CASLoggerUrl: "https://cas.iut-rodez.fr/caslogger/"
        // url login du serveur CAS
        , CASServer: "https://cas.iut-rodez.fr"
        , CASLoginPath: "/cas/login"
        // id de l'input HTML username (optionel, défaut = "username")
        // , usernameId: "username"
        // id du form HTML d'authentification (optionel,défaut = "fm1")
        // , formId: "fm1"
        // id de l'élément HTML (<p>,<div>, etc) du message d'erreur de saisie (optionel, défaut = "status")
        // , errorId: "status"
        // id de l'input HTML password (optionel, défaut = "password")
        // , passwordId: "password"
        // id de l'élément conteneur du formulaire dans le DOM
        // , formContainerId: "content" (optionel, défaut = "content")
        // force ou non le passage par le redirecteur de CASLogger pour tracer les connexions réussies (optionel, défaut = false)
        , mustRedirect: true
        // url du redirecteur (optionel, defaut = url_CASLogger + 'redirect.php')
         , redirectUrl: "https://cas.iut-rodez.fr/caslogger/redirect.php"
        // longueur du ticket (optionel, défaut = 10)
        // , ticketLength: 10
    };

    var defaults = {
        formId: "fm1",
        usernameId: "username",
        passwordId: "password",
        errorId: "status",
        formContainerId: "content",
        redirectScript: "redirect.php",
        ticketLength: 10,
        ticketName: "_cLt",
        serviceName: "_cLs"
    };

    // Classe CASLogger
    var CASLogger = function(params) {
        this.url = params.CASLoggerUrl;
        this.cas = params.CASServer + params.CASLoginPath;
        this.formId = params.formId || defaults.formId;
        this.usernameId = params.usernameId || defaults.usernameId;
        this.passwordId = params.passwordId || defaults.passwordId;
        this.errorId = params.errorId || defaults.errorId;
        this.formContainerId = params.formContainerId || defaults.formContainerId;
        this.mustRedirect = params.mustRedirect;
        this.redirectUrl = params.redirectUrl || this.url + defaults.redirectScript;
        this.stringRedirect = this.cas + "?service=" + encodeURIComponent(this.redirectUrl);
        this.ticketLength = params.ticketLength || defaults.ticketLength;
        this.ticketName = defaults.ticketName;
        this.serviceName = defaults.serviceName;
        this.username = "";
        this.service = "";
        this.formAction = "";
        this.clientError = "";
        this.ticket = "";
        this.mustLog = true;
        this.formSelector = '#' + this.formId;
        this.formJQ = $(this.formSelector);
    };

    // Démarrage du logger
    CASLogger.prototype.init = function() {

        // si aucun formulaire dans la page, on sort immédiatement
        if (this.formJQ.length == 0) {
            return;
        }

        // si mustRedirect, traitement du ticket et du reload de la page
        if (this.mustRedirect) {

            var newTicket = '';

            // si le redirecteur n'est pas dans l'URL, on l'y intègre, on recharge la page et on sort
            if ( (document.location.href).indexOf(this.stringRedirect) !== 0 ) {   
                newTicket = this.createTicket(this.ticketLength);
                this.reload('', newTicket);
                return;     // exit
            }

            // si le ticket de l'URL est égal à l'ancien ticket (cookie), on recharge la page avec un nouveau ticket et on sort
            // reload uniquement si aucun message d'erreur dans la page
            var urlTicket = this.getURLTicket();
            var storedTicket = this.readCookie(this.ticketName);
            var errorMatched = $('#' + this.errorId).html();
            if (urlTicket == storedTicket && !errorMatched) {
                newTicket = this.createTicket(this.ticketLength);
                this.reload(urlTicket, newTicket);
                return;     // exit
            }

            // sinon on stocke le ticketUrl en cookie et on continue
            this.createCookie(this.ticketName, urlTicket);
            this.ticket = urlTicket;
        }

        
        // Ajout du listener de l'évènement submit sur document
        this.formAction = this.formJQ.attr('action') || "";
        var serviceMatched = this.formAction.match(/service=([^&]+)/);
        this.service = (serviceMatched) ? decodeURIComponent(serviceMatched[1]) : "";
        this.clientError = (errorMatched) ? errorMatched: "";
        var containerSelector = ('#'+this.formContainerId);
        var containerJQ = $(containerSelector);
        if (containerJQ.length == 0) {
            containerJQ = $('body');    // si le container n'est pas trouvé, on le remplace par <body>
        }
        var that = this;                // that : dans la fonction de callback du on(), this pointe alors sur le form
        containerJQ.on('submit', this.formSelector, function(e) {
            that.username = $('#'+that.usernameId).val();
            var passwd = $('#'+that.passwordId).val();
            if (that.username && that.mustLog && passwd) { // on loggue uniquement si le username et le password sont saisis
                e.preventDefault();
                e.stopPropagation();
                that.log();
                return false;
            }
        });
    }

    // Envoi de la requête xhr au CASLogger, puis soumission du formulaire
    CASLogger.prototype.log = function() {
        var ref = (document.referrer) ? document.referrer : "";
        var data = { 
            username: this.username,
            service: this.service,
            err: this.clientError,
            ticket: this.ticket,
            ref: document.referrer,
         };
        
        var xhrSettings = {
            data: data,
            method: "POST",
            cache: false,
            url: this.url
        };

        var that = this;
        $.ajax(this.url, xhrSettings)
         .always(function() { 
            that.submitForm(); 
          });
        this.mustLog = false;
    }

    // Soumission du formulaire 
    CASLogger.prototype.submitForm = function() {
        var f = document.getElementById(this.formId);
        f.submit();
    }

    // Generateur de ticket
    CASLogger.prototype.createTicket = function(ticketLength) {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var rndStr = "";
        for (var i = 0; i < ticketLength; i++) {
            rndStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return rndStr;
    }

    // Récupération du ticket dans l'URL
    CASLogger.prototype.getURLTicket = function() {
        var urlTicket = '';
        var ticketPos = (document.location.href).indexOf(this.ticketName);
        if (ticketPos != -1) {      
            ticketPos = ticketPos + (this.ticketName).length + 1;
            urlTicket = (document.location.href).substr(ticketPos, this.ticketLength);
        }
        return urlTicket;
    }

    // Rechargement de la page avec le ticket en paramètre
    CASLogger.prototype.reload = function(ticketToReplace, ticket) {
        var target = document.location.href;
        var ticketStr = this.ticketName + "=" + ticket;
        // si ticketToReplace est passé, on ne change que sa valeur par ticket dans l'URL
        if (ticketToReplace != '') {
            var ticketToReplaceStr = this.ticketName + "=" + ticketToReplace;
            target = target.replace(ticketToReplaceStr, ticketStr);
        } else {  // sinon on ré-écrit l'URL en entier
            var serviceStr = this.serviceName + "=";
            var qs = encodeURIComponent((document.location.search).replace('?', '&').replace('service=', serviceStr));
            target = this.stringRedirect + "?" + ticketStr + qs;
        }
        document.location.href = target;
    }

    // Gestionnaire de cookies
    CASLogger.prototype.createCookie = function(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days * 24 * 60 * 60 * 1000));
            expires = "; expires="+date.toGMTString();
        }
        else {
            document.cookie = name + "=" + value + expires + "; path=/";
        } 
    }
    CASLogger.prototype.readCookie = function(name) {
        var ca = document.cookie.split(';');
        var nameEQ = name + "=";
        var val;
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {    // suppression des éventuels espaces en début de chaîne
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) == 0) {
                val = c.substring(nameEQ.length, c.length);
                return val;
            }
        }
        return val;
    }

    // fonction de démarrage du logger
    var startCASLogger = function() {
        var CASLOG = new CASLogger(CLParams);
        CASLOG.init();
    };


    // Ajout d'un gestionnaire sur onload, prise en charge d'un éventuel gestionnaire déjà enregistré
    function addLoadEvent(fn) {
        if (typeof window.addEventListener != 'undefined') { // Mozilla
            window.addEventListener('load', fn, false);
        }
        else if (typeof document.addEventListener != 'undefined') { // Opera
            document.addEventListener('load', fn, false);
        }
        else if (typeof window.attachEvent != 'undefined') { // vieux IE
            window.attachEvent('onload', fn);
        }
        else { // IE5Mac and others that don't support the above methods
            var oldfn = window.onload;
            if (typeof window.onload != 'function') {
                window.onload = fn;
            } else {
                window.onload = function() {
                    oldfn();
                    fn();
                };
            }
        }
    }

    addLoadEvent(startCASLogger);
})();