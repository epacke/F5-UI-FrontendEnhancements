//Tests if browser uri contains string
function uriContains(s) {
    "use strict";
    var uri = (document.location.pathname + document.location.search);
    return uri.indexOf(s) >= 0;
}