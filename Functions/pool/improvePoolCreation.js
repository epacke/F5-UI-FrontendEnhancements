function improvePoolCreation(){

    // Increase the select box sizes            
    $("#monitor_rule").attr("size", MonitorCount);
    $("#available_monitor_select").attr("size", MonitorCount);

    // Add double click feature
    addDoubleClick("monitor_rule", "available_monitor_select_button");
    addDoubleClick("available_monitor_select", "monitor_rule_button");

    // Set the default pool name suffix
    $("#pool_name").find("input[name=name]").attr("value", DefaultPoolName);

    // Set the default action on pool down value
    $("#action_on_service_down").find("option[value=\"" + DefaultActionOnPoolDown + "\"]").attr("SELECTED", "");

    // Set the default LB Method
    $("#lb_mode").find("option[value=\"" + DefaultLBMethod + "\"]").attr("SELECTED", "");

    // If configured, choose node as default when selecting pool members
    if(ChooseNodeAsDefault){
        if(majorVersion === "11"){
            $("#member_address_radio_address").attr("unchecked","");
            $("#member_address_radio_node").attr("checked","");
            $("#member_address_radio_node").click();
        } else if(["12", "13", "14"].indexOf(majorVersion) != -1){
            $("tr#member_address_selection td input").eq(0).attr("unchecked", "");
            $("tr#member_address_selection td input").eq(4).attr("checked", "");
            $("tr#member_address_selection td input").eq(4).click();
        }
    }

}

