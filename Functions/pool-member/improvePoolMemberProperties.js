// Adds monitor test strings to the pool member details
function improvePoolMemberProperties(){

    if($("#member_address td").next().length && $("#member_port td").next().length){

        // Add double click feature
        addDoubleClick("monitor_rule", "available_monitor_select_button");
        addDoubleClick("available_monitor_select", "monitor_rule_button");

        //Add global style
        var css =   `a.monitortest {  position: relative;  display: inline;  color:#000000;}
                    a.monitortest p {  position: absolute;  color: #000;  top:-50px;  left:-55px;
                    background: #f7f6f5;  border: 1px solid #000;  padding-left:5px;  padding-right:5px;
                    padding-top:2px;  padding-bottom:0px;  height: 30px;  text-align: center;
                    visibility: hidden;  border-radius: 2px;  font-size:12px;  font-weight:bold; }
                    a:hover.monitortest p {  visibility: visible;  bottom: 30px;  z-index: 999; }
                    .monitorcopybox { width:140px;font-weight:normal;font-size:10px;margin-bottom:1px;}
                    button.monitortestbutton { font-size:12px; }`;

        addGlobalStyle(css);

        ip = $("#member_address td.settings").text().trim();
        port = $("#member_port td.settings").text().trim();

        $('#general_table tbody tr td.settings').not('tr#member_health_monitors_status').each(function(){
            $(this).attr("colspan", 2);
        });

        $('#health_monitor_table tbody tr').not(".monitorheaderrow").each(function(key,value){

            var monitorurl = $(value).find('td a').attr("href");

            $.ajax({
                url: "https://" + window.location.host + monitorurl,
                type: "GET",
                ip: ip,
                port: port,
                success: function(response) {

                    "use strict";

                    var type = "";

                    if($(response).find("#monitor_send_string").length){

                        sendstring = $(response).find("#monitor_send_string").text().trim();
                        type = $(response).find("#div_general_table tbody tr td:contains('Type')").next().text().trim();

                    } else if ($(response).find("#div_configuration_table table tbody tr td:contains('Send String')")) {

                        // Default monitors does not have the same page structure as the normal ones. Needs special treatment.
                        var sendstring = $(response).find("#div_configuration_table table tbody tr").find("td:contains('Send String')").next().text().trim();
                        var type = $(response).find("#general_table tbody tr").find("td:contains('Type')").next().text().trim();

                    }

                    if(type == "HTTP" || type == "HTTPS"){

                        var commands = getMonitorRequestParameters(sendstring, type, ip, port);
                        
                        var html = "";                             
                        
                        for(var c in commands.commands){
                            
                            html += `<a href="javascript:void(0);" class="monitortest">
                                        <input type="button" class="monitortestbutton" value="` + c + `"/>
                                        <p>` + commands.commands[c].title + `(CRTL+C)
                                        <br>
                                        <input id="` + c.toLowerCase() + `link" class="monitorcopybox" type="text" value='` + commands.commands[c].string + `'>
                                        </p>
                                    </a>`;
                        }

                        $(value).append("<td valign=\"middle\">" + html + " </td>");

                    } else {
                        $(value).append("<td valign=\"middle\" class=\"monitortests\">N/A</td>");
                    }


                },
                async: false
            });
        });

        //Attach an onmouseover function which focuses and selects the text
        if($('.monitortest').length){
            $('.monitortest').mouseover(function(){
                $(this).find("p input").focus();
                $(this).find("p input").select();
                var inputstring = $(this).find('p input').attr('value');
                $(this).attr("href", "javascript:prompt('The command','" + inputstring.replace(/\'/g,"\\'") + "')");
            });
        }

        //Remove the parent padding first
        $('#health_monitor_table').parent().css('padding','0px');
        //Add a row with headers
        $('#health_monitor_table tbody tr:first').before('<tr class="monitorheaderrow"><td class="monitorheadercell">Monitors</td><td class="monitorheadercell">Monitor tests</td></tr>');
        //Make the headers bold
        $('#health_monitor_table tbody tr.monitorheaderrow td').css({
            'font-weight' : 'bold',
            'border-right' : '1px solid #dddddd'
        });
        //Add padding
        $('#health_monitor_table tr td').css({
            'padding' : '5px'
        });
        $('#health_monitor_table tr td').not('.monitorheadercell').css({
            'border-right' : '1px solid #dddddd',
            'border-top' : '1px solid #dddddd',
        });

        $('#health_monitor_table tr td.monitortests').css('text-align','center');

    }

}