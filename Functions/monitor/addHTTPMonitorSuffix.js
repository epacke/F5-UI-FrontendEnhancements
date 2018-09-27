function addHTTPMonitorSuffix(){
    if($("select[name=mon_type]").find(":selected").text().trim() == "HTTP"){

        var monitorname = $("input[name=monitor_name]").attr("value");

        if($("input[name=monitor_name]").length && monitorname == "") {
            $("input[name=monitor_name]").attr("value", HttpMonitorSuffix);
        } else if ($("input[name=monitor_name]").length && !(endsWith(monitorname, HttpMonitorSuffix))) {
            monitorname = monitorname + HttpMonitorSuffix;
            $("input[name=monitor_name]").attr("value", monitorname);
        }
    }
}