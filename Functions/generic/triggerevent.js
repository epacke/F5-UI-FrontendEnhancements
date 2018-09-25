// Used to in cases where jQuery caches the selector at the begining of the script.
function triggerEvent(ev, el){
    "use strict";

    var event = document.createEvent('HTMLEvents');
    event.initEvent(ev, true, true);
    el.dispatchEvent(event);

}