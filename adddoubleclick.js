// Credit to Michael Jenkins for this one.
// https://github.com/jangins101/
function addDoubleClick(el, btn) {
    $("#" + el).dblclick(function() {  $("#" + btn).click(); });
}