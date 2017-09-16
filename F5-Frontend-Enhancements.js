// ==UserScript==
// @name BigiIP UI Tweaks
// @description Tweaks the F5 UI
// @match https://*/tmui/Control/*
// @run-at    document-end
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/***************************************************************************************

    This script is meant to enhance the GUI of the LTM in a non intefering way
    Version history:
    Version     Change
    0.1     Original version
    0.2     Make sure that the script is not executed when not needed
    0.3     Adding noConflict to avoid problems with F5's javascripts
    0.4     Adding iRule links in the virtual server resources tab
    0.5     Adding default settings when creating pools and monitors
    0.6     Added parsing for data group lists in iRules and creates links to them
    0.7     Added parsing for data group content and added it as link hover information
    0.8     Fixed a problem in the script with the node by default setting
    0.9     Added automatically selecting the right certificate and key when viewing an SSL profile
    1.0     Added an option to make objects in the current partition bold to make it easier to
            distinguish them from objects in the common partition.
    1.1     Changed the balloon position to the left and set whitspace to nowrap in order to
            support long data group list values.
    1.2     Added default options when creating CSR
    1.2.1   Now generating monitor test links.
*/

/***************************************************************************************
                        Begin Config section
****************************************************************************************/

    /**************************************************************
    How many rows do you want the iRule definition textarea to show

    Default:
    iRuleDefinitionRows = 35;
    ***************************************************************/
    var iRuleDefinitionRows = 35;

    /**************************************************************
    How many rules you want to see in the rule assignment window

    Default:
    iRulesCount = 40;
    ***************************************************************/
    var iRulesCount = 40;

    /**************************************************************
    How many monitors you want to show in the monitor selection

    Default:
    MonitorCount = 30;
    ***************************************************************/
    var MonitorCount = 30;

    /**************************************************************
    How many data group list entries to show

    Default:
    DatagroupListCount = 30;
    ***************************************************************/
    var DatagroupListCount = 30;

    /**************************************************************
    Set this to 1 if you want to catch tabs when writing iRulesCount

    Default:
    CatchTab = 1;
    ***************************************************************/
    var CatchTab = 1;

    /**************************************************************
    Set http monitor name default suffix

    Default:
    HttpMonitorSuffix = "";
    ***************************************************************/
    var HttpMonitorSuffix = "-http_monitor";

    /**************************************************************
    Set the default pool name

    Default:
    DefaultPoolName = "";
    ***************************************************************/
    var DefaultPoolName = "-[port]_pool";

    /**************************************************************
    Set the default action on pool down when creating pools

    Default:
    DefaultActionOnPoolDown = 0;

    Options:
    0 = None
    1 = Reject
    2 = Drop
    ***************************************************************/
    var DefaultActionOnPoolDown = 1;

    /**************************************************************
    Set the default action on pool down when creating pools
    Default = 0;

    Options:
    0 = Round Robin
    1 = Ratio (member)
    2 = Least Connections (member)
    3 = Observed (member)
    4 = Predictive (member)
    5 = Ratio (node)
    6 = Least connections (node)
    7 = Fastest (node)
    8 = Observed (node)
    9 = Predictive (node)
    10 = Dynamic Ratio (node)
    11 = Fastest (application)
    12 = Least sessions
    13 = Dynamic ratio (member)
    14 = Weighted Least Connections (member)
    15 = Weighted Least Connections (node)
    16 = Ratio (session)
    17 = Ratio Least connections (member)
    18 = Ratio Least connections (node)
    **************************************************************/
    var DefaultLBMethod = 4;

    /**************************************************************
    Choose Node List as default when creating pools

    Default:
    ChooseNodeAsDefault = 0;

    Options:
    0 = No
    1 = Yes
    **************************************************************/
    var ChooseNodeAsDefault = 1;

    /**************************************************************
    Parse data group lists in iRules

    Default:
    ParseDataGroupLists = 1;

    Options:
    0 = No
    1 = Yes
    **************************************************************/
    var ParseDataGroupLists = 1;

    /**************************************************************
    Make objects in the current partition bold

    Bonus setting:
    Make them super bold by setting both to 1

    Default:
    MakePartitionObjectsBold = 1;

    Options:
    0 = No
    1 = Yes
    **************************************************************/

    var MakePartitionObjectsBold = 1;
    var MakeSuperBold = 0;

    /**************************************************************
    Add default certificate signing alternatives
    First one defined is always the default one

    This one is a bit tricky to format, look at the example carefully

    Default (disabled):
    EnableDefaultcsroptions = 0;

    Options:
    0 = No
    1 = Yes

    Example that creates two options:
    var csroptions = {
                Company1: {
                    OptionName: 'Company 1',
                    CommonName: '[Example *.domain.com]',
                    Division: 'Stockholm office',
                    Organization: 'My Office address',
                    Locality: 'Stockholm',
                    StateProvince: 'Stockholm',
                    Country: 'SE',
                    Email: 'office@company.se',
                    SubjectAlt: ''
                }
            ,
                Company2: {
                    OptionName: 'Another company',
                    CommonName: '[Example *.domain.com]',
                    Division: 'Oslo office',
                    Organization: 'My Oslo Office address',
                    Locality: 'Oslo',
                    StateProvince: 'Oslo',
                    Country: 'NO',
                    Email: 'office@company.no',
                    SubjectAlt: ''
                }
            }

    **************************************************************/

    var EnableDefaultcsroptions = 1;

    var csroptions = {
                Company1: {
                    OptionName: 'Company 1',
                    CommonName: '[Example *.domain.com]',
                    Division: 'Stockholm office',
                    Organization: 'My Office address',
                    Locality: 'Stockholm',
                    StateProvince: 'Stockholm',
                    Country: 'SE',
                    Email: 'office@company.se',
                    SubjectAlt: ''
                }
            ,
                Company2: {
                    OptionName: 'Another company',
                    CommonName: '[Example *.domain.com]',
                    Division: 'Oslo office',
                    Organization: 'My Oslo Office address',
                    Locality: 'Oslo',
                    StateProvince: 'Oslo',
                    Country: 'NO',
                    Email: 'office@company.no',
                    SubjectAlt: ''
                }
            }

     /**************************************************************
        Choose Node List as default when creating pools

        Default:
        defaultChain = "";

        defaultChain = "/Common/mychain.crt";
    **************************************************************/

    var defaultChain = "/Common/bchain.crt";

     /**************************************************************
        Choose Node List as default when creating pools

        Default:
        defaultClientSSLParentProfile = "";

        defaultClientSSLParentProfile = "/Common/myParentProfile";
    **************************************************************/
    
    var defaultClientSSLParentProfile = "/Common/pci-compliant-clientssl";
        
    /***************************************************************************************
                            End Config section
    ****************************************************************************************/

    //Make sure that the tampermonkey jQuery does not tamper with F5's scripts
    this.$ = this.jQuery = jQuery.noConflict(true);

    //Declare global ajax queue limit
    var currentqueue = 0;
    var totalrequests;
    var tamperDataGroupLists = new Array();
    var detectedarr = [];
    
    initiateBaloon();

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    
    if(ParseDataGroupLists && location.pathname.indexOf('/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp') >= 0){

        cacheDataGroupLists();

        //This part prepares the iRule definition table for the data group lists (adds a third column)
        $("#div_general_table").find('.tablehead').find('td').attr('colspan', 3);
        $("#div_general_table").find('tr').not('#definition_ace_row').each(function(){
            $(this).find('td').eq(1).attr('colspan', 2);
        });
         $("#div_general_table").find('tr#definition_ace_row').find('td').eq(1).after('<td id="dglist" class="settings"></td>');

        //Makes sure that the data group lists ends up in the top of the cell
        $("#div_general_table").find('tr#definition_ace_row').find('td').eq(2).css("vertical-align","top");
        $("#div_general_table tbody tr#definition_ace_row td.settings").css("width","80%");

        //This command generates the data group lists (if any)
        getDataGroupLists($('textarea#rule_definition').val())
        
        $(document).on('keyup', function(){
            
            var iRuleContent = codeEditor.gSettings.editor.container.env.document.doc.$lines.join("\n");
            
            getDataGroupLists(iRuleContent)
            
        });

    }

    function getDataGroupLists(str){

        var bracketcounter = 0;
        var tempstring = "";
        var idIterator = 0;
        var missingDataGroupList = false;
        
        //Go through the iRule and check for brackets. Save the string between the brackets.
        for(i=0;i<str.length;i++){

            if(str[i] == "[" && bracketcounter == 0){
                //A bracket has been found and if the bracketcounter is 0 this is the start of a command
                bracketcounter = 1;
            } else if(str[i] == "[") {
                //A bracket has been found and since the bracket counter is larger than 0 this is a nested command.
                bracketcounter +=1;
            }

            //The start of a command has been identified, save the character to a string
            if(bracketcounter > 0){
                tempstring += str[i];
            }

            if(str[i] == "]"){
                
                //if an end bracket comes along, decrease the bracket counter by one
                bracketcounter += -1

                //If the bracket counter is 0 after decreasing the bracket we have reached the end of a command
                if(bracketcounter == 0){
                    
                    //Separate the different words in the command with a regexp
                    //Regexp based on the allowed characters specified by F5 in this article:
                    //https://support.f5.com/kb/en-us/solutions/public/6000/800/sol6869.html
                    var commandarray = tempstring.match(/[a-zA-Z0-9-_./]+/g)

                    //The actual command is the first word in the array. Later we'll be looking for class.
                    var command = commandarray[0];

                    //The subcommand is the second word. If class has been identified this will be match.
                    var subcommand = commandarray[1];

                    //Save the current partition
                    currentpartition = getCookie("F5_CURRENT_PARTITION");

                    //If the command is class. I've chosen not to include matchclass for now since it is being deprecated
                    if(command == "class"){
                        switch(subcommand){
                            case "lookup":
                            case "match":
                            case "element":
                            case "type":
                            case "exists":
                            case "size":
                            case "startsearch":
                                //These types always has the data group list in the last element
                                var dg = commandarray[commandarray.length-1]

                                //Check if a full path to a data group list has been specified and if it's legit
                                if(dg.indexOf("/") >= 0){
                                    dgarr = dg.split("/")
                                    if(dgarr.length == 3){
                                        currentpartition = dgarr[1];
                                        dg = dgarr[2]
                                    } else {
                                        //An invalid data group list name, skip this one
                                        continue;
                                    }
                                }
                                break;
                            case "anymore":
                            case "donesearch":
                                //These types always has the data group list in the third element
                                var dg = commandarray[2]

                                //Check if a full path to a data group list has been specified and if it's legit
                                if(dg.indexOf("/") >= 0){
                                    dgarr = dg.split("/");
                                    if(dgarr.length == 3){
                                        currentpartition = dgarr[1];
                                    } else {
                                        //An invalid data group list name, skip this one
                                        continue;
                                    }
                                }
                                break;
                            case "search":
                            case "names":
                            case "get":
                            case "nextelement":
                                //Exclude options and find the data group list
                                for(x=2;x<commandarray.length;x++){
                                    if(commandarray[x][0] != "-"){
                                        dg=commandarray[x];
                                        break;
                                    }
                                }

                                //Check if a full path to a data group list has been specified and if it's legit
                                if(dg.indexOf("/") >= 0){
                                    dgarr = dg.split("/")
                                    if(dgarr.length == 3){
                                        currentpartition = dgarr[1];
                                    } else {
                                        //An invalid data group list name, skip this one
                                        continue;
                                    }
                                }
                                break;

                            default:
                                continue;
                        }

                        //Check if the data group list has been detected before
                        //If it hasn't, add it to the array of detected data group lists
                        if(detectedarr.indexOf(dg) >= 0){
                            continue;
                        } else {
                            detectedarr.push(dg);
                        }

                        //Check if the script has detected a previous data group list
                        if($("td#dglist").html() == ""){
                            $("td#dglist").html('<div id="dglabel"><span style="font-weight:bold">Detected Data group lists:</span><hr></div>')
                            $("div#dglabel").append('<div id="Commondg"></div>')
                        }

                        idIterator++;
                        
                        if(tamperDataGroupLists.indexOf("/Common/" + dg) >= 0){
                            if($('div#Commondg').text() == ""){
                                $('div#Commondg').html('<span style="font-weight:bold">/Common:</span><br>')
                            }

                            $('div#Commondg').append('<a href="https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=/Common/' + dg + '" id="' + "Common" + dg.replace('.','') + '">' + dg + '</a>' + '<br>');
                            $('#Common' + dg.replace('.','')).balloon({ position: "left", css: { whitespace: "nowrap" }, showDuration: 0, hideDuration: 0, contents: parseDataGroupValues("/Common/" + dg) });

                        } else if(tamperDataGroupLists.indexOf("/" + currentpartition + "/" + dg) >= 0){
                            
                            var divfriendlypartition = currentpartition.replace(".","");

                            if(!($('div#' + divfriendlypartition + 'dg').length)){
                                $('div#Commondg').before(('<div id="' + divfriendlypartition + 'dg" style="padding-bottom:5px;"><span style="font-weight:bold;">/' + currentpartition + ':</span><br></div>'))
                            }
                            
                            $('div#' + divfriendlypartition + 'dg').append('<a href="https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=/' + currentpartition + '/' + dg + '" id="' + divfriendlypartition + dg.replace('.','') + '">' + dg + '</a><br>');

                            $('#' + divfriendlypartition + dg.replace('.','')).balloon({ position: "left", css: { whitespace: "nowrap" }, showDuration: 0, hideDuration: 0, contents: parseDataGroupValues("/" + currentpartition + "/" + dg) });
                            
                        } else {
                            delete detectedarr[detectedarr.indexOf(dg)];
                            $("input#properties_update").css("background", "red");
                            $("input#properties_update").css("color", "white");
                            $("input#properties_update").attr("value", "Update (MISSING DATA GROUP LISTS");
                            missingDataGroupList = true;
                        }

                        tempstring = "";
                    }
                }
            }

            if(str[i] == "\n"){
                bracketcounter = 0;
                startindex = 0;
                tempstring = "";
            }
        }
        
        if(missingDataGroupList === false){
            $("input#properties_update").css("background", "rgb(221, 221, 221)");
            $("input#properties_update").css("color", "black")
            $("input#properties_update").attr("value", "Update");
        }
    }

    //Parses data group list html to get the key/value pairs for the hover information

    function parseDataGroupValues(dg){

        var dgLink = 'https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=' + dg;
        var dghtml;

        $.ajax({
            url: dgLink,
            type: "GET",
            success: function(htmlresponse) {
                dghtml = htmlresponse;       
            },
            async: false
        });

        matches = dghtml.match(/<option value="[^"]+(\\x0a)?.+?" >/g);
        
        //Set the header
        html = '<span style="color:blue">Key</span> = <span style="color:red">Value</span>'
        
        if(matches){
            for(i=0;i<matches.length;i++){
                match = matches[i].replace('<option value="', '').replace('" >', '')
                matcharr = match.split('\\x0a')

                if(matcharr.length == 2){
                    html += '<br><span style="color:blue">' + matcharr[0] + '</span> = <span style="color:red">' + matcharr[1] + '</span>'; 
                } else {
                    html += '<br><span style="color:blue">' + matcharr[0] + '</span> = <span style="color:red">""</span>'; 
                }
            }
        } else {
            html += "<br><span style=\"color:blue\">Empty data group list</span>";
        }
        
        return html;
    }

    if($("#assigned_rules").length && $("#rule_references").length){
        //Change the iRule selection choice
        assignedrules = $("#assigned_rules").attr('size', iRulesCount);
        rulereferences = $("#rule_references").attr('size', iRulesCount);
    }

    if($("#monitor_rule").length && $("#available_monitor_select").length){
        //Change the monitor count
        $("#monitor_rule").attr('size', MonitorCount);
        $("#available_monitor_select").attr('size', MonitorCount);
    }

    if($('select#class_string_item').length || $('select#class_ip_item').length){
        //Change the data grouplist count
        $('select#class_string_item').attr('size', DatagroupListCount);
        $('select#class_ip_item').attr('size', DatagroupListCount);
    }

    //Set the default suffix of the HTTP monitors
    if($('select[name=mon_type]').length){
        if($('select[name=mon_type]').find(":selected").text().trim() == "HTTP"){

            monitorname = $('input[name=monitor_name]').attr("value");

            if($('input[name=monitor_name]').length && monitorname == "") {
                $('input[name=monitor_name]').attr("value", HttpMonitorSuffix);
            } else if ($('input[name=monitor_name]').length && !(endsWith(monitorname, HttpMonitorSuffix))) {
                monitorname = monitorname + HttpMonitorSuffix;
                $('input[name=monitor_name]').attr("value", monitorname);
            }
        }
    }

    //This function checks if a data group list exists or not
    function checkDataGroupList(DGLName){

        var DataGroupListLink = "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=" + DGLName;
        var response = '';

        //Request the iRule page to see if the instance exists or not
        $.ajax({
            url: DataGroupListLink,
            type: "GET",
            success: function(htmlresponse) {
                response = htmlresponse;       
            },
            async: false
        });

        //Search for the string indicating if the instance exists or not
        if (response.indexOf("Instance not found") >= 0){
            return false;
        } else {
            return true;
        }  
    }

    function cacheDataGroupLists(){

        var DataGroupListLink = "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/datagroup/list.jsp";
        var response = '';

        //Request the iRule page to see if the instance exists or not
        $.ajax({
            url: DataGroupListLink,
            type: "GET",
            success: function(htmlresponse) {
                response = htmlresponse;       
            },
            async: false
        });

        var dataGroupLists = $(response).find('table.list tbody#list_body tr td:nth-child(3) a');

        for(i = 0; i < dataGroupLists.length; i++){
            var link = dataGroupLists[i].href;
            var name = link.split("name=")[1];
            
            tamperDataGroupLists.push(name);
        }
    }

    //Get a cookie value. Used to get the current partition
    //Shamelessly stolen from http://www.w3schools.com/js/js_cookies.asp

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    }

    function deleteCookie(cname){
	    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    }

	function setCookie(cname, cvalue) {

		exdays=30;
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	function replaceCookie(cname, cvalue){
		if(getCookie(cname)){
			deleteCookie(cname)
		}

		setCookie(cname,cvalue)

	}

	function getUrlVars(){

		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

		for(var i = 0; i < hashes.length; i++){
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}

		return vars;
	}

    //Check if an iRules list in exists in the DOM
    //This one is a bit ugly because of iframes, F5's strange DOM tree and me not being able to find an alternative

    if($('div').find("table#rule_list").find("tbody#list_body").children().length){

        //Get all iRule rows from the iRule table
        irulerows = $('div').find("table#rule_list").find("tbody#list_body").children();

        for(i=0;i<irulerows.length;i++){

            //Get each iRule name without the white spaces
            tdcontent = $(irulerows[i]).children()[0].innerHTML.trim();

            //Get the current partition
            currentpartition = getCookie("F5_CURRENT_PARTITION")

        var response = '';
        currentRule = $(irulerows[i]).children()[0]
        //Request the iRule page to see if the instance exists in Common or not
        $.ajax({
            url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/Common/" + tdcontent,
            type: "GET",
            currentRule: currentRule,
            currenttdcontent: tdcontent,
            success: function(response) {
                replaceContent(response, this.currentRule, this.currenttdcontent)
                function replaceContent(response, currentRule, currenttdcontent){
                    if (response.indexOf("Instance not found") == -1){
                        $(currentRule)[0].innerHTML = currenttdcontent.replace(currenttdcontent, "<a href='https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/Common/" + currenttdcontent + "'>" + currenttdcontent + "</a>");
                    }
                }
            },
            async: true
        });

        //Request the iRule page to see if the instance exists in the current partition or not
        $.ajax({
            url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + currentpartition + "/" + tdcontent,
            type: "GET",
            currentRule: currentRule,
            currenttdcontent: tdcontent,
            currentpartition: currentpartition,
            success: function(response) {
                replaceContent(response, this.currentRule, this.currenttdcontent, this.currentpartition)
                function replaceContent(response, currentRule, currenttdcontent, currentpartition){
                    if (response.indexOf("Instance not found") == -1){
                        $(currentRule)[0].innerHTML = currenttdcontent.replace(currenttdcontent, "<a href='https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=/" + currentpartition + "/" + currenttdcontent + "'>" + currenttdcontent + "</a>");
                    }
                }
            },
            async: true
        });

    }
     }

    //Check if a pool is being created
    if($('#pool_name').find('input[name=name]').length){
        //Set the default pool name suffix
        $('#pool_name').find('input[name=name]').attr("value", DefaultPoolName);
        //Set the default action on pool down value
        $('#action_on_service_down').find('option[value="' + DefaultActionOnPoolDown + '"]').attr("SELECTED", "")
        //Set the default LB Method
        $('#lb_mode').find('option[value="' + DefaultLBMethod + '"]').attr("SELECTED", "")
        //If configured, choose node as default when selecting pool members
        if(ChooseNodeAsDefault){
            $('#member_address_radio_address').attr("unchecked","");
            $('#member_address_radio_node').attr("checked","");
            $('#member_address_radio_node').click();
        }
    }
    
    if(MakePartitionObjectsBold && location.pathname.indexOf('list.jsp') >= 0){

        //Get the current partition
        currentpartition = getCookie("F5_CURRENT_PARTITION")

        //If the Make superbold setting has been activated, grant the users wish
        if(MakeSuperBold){
            boldness = 800;
        } else {
            boldness = 700;
        }

        //Get all links in a table body with the id list_body
        $('tbody#list_body tr td a').each(function(){
            //Check if the link has a href attribute
            if($(this).attr('href').length){
                //Check if the link contains a reference to the current partition
                if($(this).attr('href').indexOf('name=/' + currentpartition) > 0){
                    //Make the text bold
                    $(this).css('font-weight', boldness);
                }
            }
        });
    }
    
if(EnableDefaultcsroptions == 1 && location.pathname.indexOf('/tmui/Control/jspmap/tmui/locallb/ssl_certificate/create.jsp') >= 0){

        //A certificate is being created and the default certificate signing setting has been enabled
        var csrdropdown = '<select id="csrdropdownmenu">';

        for(var option in csroptions){
            csrdropdown += '<option value="' + option + '">' + csroptions[option]["OptionName"] + '</option>';
        }

        $('#configuration_table tbody').append('<tr><td class="label required">Certificate type</td><td class="settings">' + csrdropdown + '</td></tr>')

        $('#configuration_table tbody tr td #csrdropdownmenu').change(function() {

            //Change to Certificate authority
            $('#certificate_table tbody tr td select[name=issuer]').val("Certificate Authority");

            //Reflect the changes to the form using the in build function
            $('#certificate_table tbody tr td select[name=issuer]').trigger("onchange");

            //Get the options for the currently selected certificate and populate the table
            var selectedcsroption = csroptions[this.value];

            //Populate the common name
            $('#certificate_table tbody tr td input[name=common_name]').val(selectedcsroption["CommonName"])
            $('#certificate_table tbody tr td input[name=division]').val(selectedcsroption["Division"])
            $('#certificate_table tbody tr td input[name=organization]').val(selectedcsroption["Organization"])
            $('#certificate_table tbody tr td input[name=locality]').val(selectedcsroption["Locality"])
            $('#certificate_table tbody tr td input[name=state_or_province]').val(selectedcsroption["StateProvince"])
            $('#certificate_table tbody tr td select[name=country_select]').val(selectedcsroption["Country"])
            $('#certificate_table tbody tr td input[name=email_address]').val(selectedcsroption["Email"])
            $('#certificate_table tbody tr td input[name=subject_alternative_name]').val(selectedcsroption["SubjectAlt"])

            //Update the country variable using the in build script
            $('#certificate_table tbody tr td select[name=country_select]').trigger("onchange");
        });

        //Set the default value
        setTimeout(function(){
            $('#configuration_table tbody tr td #csrdropdownmenu').trigger("change");
        }, 500);
    
    }

    if(location.pathname.indexOf('/tmui/Control/jspmap/tmui/locallb/ssl_certificate/create.jsp') >= 0){

    	

		$("input[name='certificate_name']").on("keyup", function(){
			$("input[name='common_name']").val($(this).val().replace(/^star\./g, "*."));
		});

		setTimeout(function(){
			$("select[name='issuer']").val("Certificate Authority");
            $("select[name='issuer']").trigger("change");
        }, 500);

    }

    if( location.pathname.indexOf('/tmui/Control/jspmap/tmui/locallb/pool/member/properties.jsp') >= 0 ) {

        if($("#member_address td").next().length && $("#member_port td").next().length){
            //Add global style
            var css = 'a.monitortest {  position: relative;  display: inline;  color:#000000;} \
            a.monitortest p {  position: absolute;  color: #000;  top:-50px;  left:-55px;\
            background: #f7f6f5;  border: 1px solid #000;  padding-left:5px;  padding-right:5px;\
            padding-top:2px;  padding-bottom:0px;  height: 30px;  text-align: center;  \
            visibility: hidden;  border-radius: 2px;  font-size:12px;  font-weight:bold; }\
            a:hover.monitortest p {  visibility: visible;  bottom: 30px;  z-index: 999; }\
            .monitorcopybox { width:140px;font-weight:normal;font-size:10px;margin-bottom:1px;}\
            button.monitortestbutton { font-size:12px; }'
            addGlobalStyle(css);

            ip = $("#member_address td").next().text().trim();
            port = $("#member_port td").next().text().trim();

            $('#general_table thead tr td').first().attr('colspan',3);

            $('#general_table tbody tr').not('tr#member_health_monitors_status').find('td.settings').each(function(){
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
                        if($(response).find("#monitor_send_string").length){
                            sendstring = $(response).find("#monitor_send_string").text().trim();
                            type = $(response).find("#div_general_table tbody tr").find("td:contains('Type')").next().text().trim();
                            if(type == "HTTP" || type == "HTTPS"){
                                var url = getMonitorRequestParameters(sendstring, type, ip, port,"http");
                                var curlcommand = getMonitorRequestParameters(sendstring, type, ip, port,"curl");
                                var netcatcommand = getMonitorRequestParameters(sendstring, type, ip, port,"netcat");
                                var linkprefix = '<a href="javascript:void(0);" class="monitortest">';
                                var httplink = linkprefix + '<input type="button" class="monitortestbutton" value="HTTP"/><p>HTTP link (CRTL+C)<br><input id="httplink" class="monitorcopybox" type="text" value=\'' + url +'\'></p></a>';
                                var curllink = linkprefix + '<input type="button" class="monitortestbutton" value="Curl"/><p>Curl command (CRTL+C)<br><input id="curlcommand" class="monitorcopybox" type="text" value="' + curlcommand +'"></p></a>';
                                var netcatlink = linkprefix + '<input type="button" class="monitortestbutton" value="Netcat"/><p>Netcat command (CRTL+C)<br><input id="netcatcommand" class="monitorcopybox" type="text" value=\'' + netcatcommand +'\'></p></a>';
                                $(value).append('<td valign="middle">' + httplink + '     ' + curllink + ' ' + netcatlink + ' </td>');
                            } else {
                                $(value).append('<td valign="middle" class="monitortests">N/A</td>');
                            }
                        } else if ($(response).find("#div_configuration_table table tbody tr").find("td:contains('Send String')")) {
                            //Found a default monitor
                            sendstring = $(response).find("#div_configuration_table table tbody tr").find("td:contains('Send String')").next().text().trim();
                            type = $(response).find("#general_table tbody tr").find("td:contains('Type')").next().text().trim();

                            if(type == "HTTP" || type == "HTTPS"){
                                var url = getMonitorRequestParameters(sendstring, type, ip, port,"http");
                                var curlcommand = getMonitorRequestParameters(sendstring, type, ip, port,"curl");
                                var netcatcommand = getMonitorRequestParameters(sendstring, type, ip, port,"netcat");
                                var linkprefix = '<a href="javascript:void(0);" class="monitortest">';
                                var httplink = linkprefix + '<input type="button" class="monitortestbutton" value="HTTP"></input><p>HTTP link (CRTL+C)<br><input id="httplink" class="monitorcopybox" type="text" value=\'' + url + '\'></p></a>';
                                var curllink = linkprefix + '<input type="button" class="monitortestbutton" value="Curl"></input></button><p>Curl command (CRTL+C)<br><input id="curlcommand" class="monitorcopybox" type="text" value=\"' + curlcommand +'\"></p></a>';
                                var netcatlink = linkprefix + '<input type="button" class="monitortestbutton" value="Netcat"></input><p>Netcat command (CRTL+C)<br><input id="netcatcommand" class="monitorcopybox" type="text" value=\'' + netcatcommand +'\'></p></a>';
                                $(value).append('<td valign="middle" class="monitortests">' + httplink + '      ' + curllink + ' ' + netcatlink + ' </td>');
                            } else {
                                $(value).append('<td valign="middle" class="monitortests">N/A</td>');
                            }

                        } else {
                            $(value).append('<td valign="middle" class="monitortests">N/A</td>');
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

    //Taken from sourceforge
    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }
    
    function getMonitorRequestParameters(sendstring, type, ip, port, command){
        var verb = "";
        var uri = "";
        var headers = [];
        var sendstringarr = sendstring.split(" ");

        verb = sendstringarr[0];
        uri = sendstringarr[1].replace("\\r\\n", "");

        if(type.indexOf("HTTPS") >=0){
            protocol = 'https';
        } else if(type.indexOf("HTTP") >=0){
            protocol = 'http';
        } else {
            return "Invalid protocol"
        }
        //So far we only support HTTP GET request
        if( verb === "GET" || verb === "HEAD"){

            //Parse for headers
            var headersarr = sendstring.split('\\r\\n');

            if(headersarr.length > 2){

                for(var i in headersarr){

                    var header = headersarr[i];

                    if(header.indexOf(":") >= 0){
                        if(header.split(":").length == 2){
                            headers.push(header);
                        }
                    }
                }
            }

            if (command == "curl"){

                var commandstring = 'curl -vvv';

                if (verb === "HEAD"){
                    commandstring += " -I"
                }

                if(headers.length > 0){
                    for(var i in headers){
                       var headerarr = headers[i].split(":");
                       var headername = headerarr[0].trim();
                       var headervalue = headerarr[1].trim();

                       /*Account for header values not enclosed in quotes
               This is only needed in curl for Windows
                       */
                       /*
                       if(!(headervalue.startsWith('\"') && headervalue.endsWith('\"'))){
                          headervalue = '\"' + headervalue + '\"';
                       }
                       */

                        headervalue = headervalue.replace(/\"/g,'\\&quot;');
            commandstring += ' --header &quot;' + headername + ':' + headervalue + '&quot;';
                    }
                }

                commandstring += ' ' + protocol + '://' + ip + ':' + port + uri

            } else if ( command == "netcat"){
                var commandstring = "echo -ne \"" + sendstring + "\" | nc " + ip + " " + port;
            } else if ( command == "http"){
                var commandstring = protocol + '://' + ip + ':' + port + uri;

            } else {
                var commandstring = "Invalid command"
            }

            return commandstring
        } else {
            return "Only GET requests are supported"
        }
    }

    if(location.pathname.indexOf('/tmui/Control/jspmap/tmui/locallb/virtual_server/resources.jsp') >= 0){

        var selecteddefaultpool = $('input[name=default_pool_before]').val();
        if(selecteddefaultpool != 'NO_SELECTION'){
            $('input[name=default_pool_before]').after('<a href="https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=' + selecteddefaultpool + '"><input type="button" value="Show default pool"/></a>')
        }

    }

    if(document.location.pathname === "/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp"){
        

        $("input[name=string_input], input[name=string_pair_value], input#string_add_button").on("keyup change input focus click", function(){
            
            var key = $("input[name=string_input]").val();
            var value = $("input[name=string_pair_value]").val();
            
            var currentList = [];
            
            $('select#class_string_item option').each(function(){
                currentList.push($(this).val());
            })
            
            if(key.length){
                
                var listItem = "";
                
                if(value === ""){
                    listItem = key;
                } else {
                    listItem = key + "\\x0a" + value;
                }
                
                if(currentList.indexOf(listItem) === -1){
                    $("input#update").prop("disabled", true);
                } else {
                    $("input#update").prop("disabled", false);
                }
                
            } else {
                
                $("input#update").prop("disabled", false);
                
            }

        })

        $("input#edit_string").on("click", function(){
            $("input#update").prop("disabled", true);
        })

    }


    setInterval(function(){
         $.ajax({
            url: "/tmui/Control/jspmap/tmui/locallb/profile/xml/list.jsp",
            type: "GET",
            success: function() {
                console.log("Refresh triggered");       
            },
            async: true
        })
    }, 30000);
    
    
    if(document.location.pathname.indexOf("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/create.jsp") >= 0){
        
        if(defaultClientSSLParentProfile !== ""){
            setTimeout(function(){
                $('select#parent_profile_name').val(defaultClientSSLParentProfile);
                $('select#parent_profile_name').trigger("change");
                
            }, 1000);
            
        }
    
    }
    
    function matchCertAndKey(){

    	$('select#chain').val(defaultChain)

        $('select#cert').on("change", function(){
                   
            certName = $(this).val();
            probableKeyName = certName.replace(/\.crt$/, ".key");

            $('select#key').val(probableKeyName);
        
            if(defaultChain !== ""){
                $('select#chain').val(defaultChain)
            }
        
        });    
    }
    
    if(document.location.pathname.indexOf("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp") >= 0 || document.location.pathname.indexOf("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/create.jsp") >= 0){
    	matchCertAndKey();
    }

        
    if($('input[name="cert_key_chain_override"]').length){
        $('input[name="cert_key_chain_override"]').on("click", matchCertAndKey)

		    $('input[name="add_modal_button"]').on("mouseup", function(){
				setTimeout(function(){

					var currentPartition = getCookie("F5_CURRENT_PARTITION");
			    	var profileName = $("input[name='profile_name']").val();

			    	console.log("select#cert option[value='/" + currentPartition + "/" + profileName + ".crt']")

			    	if($("select#cert option[value='/" + currentPartition + "/" + profileName + ".crt']").length > 0){
			    		$('select#cert').val("/" + currentPartition + "/" + profileName + ".crt");
			    		$('select#key').val("/" + currentPartition + "/" + profileName + ".key");
			    	} else if ($("select#cert option[value='/Common/" + profileName + ".crt']").length > 0){
			    		$('select#cert').val("/Common/" + profileName + ".crt");
			    		$('select#key').val("/Common/" + profileName + ".key");
			    	}

			    	$('select#chain').val(defaultChain)

				}, 500);
			});
    }
        
        
    
        
        

/**
 * Hover balloon on elements without css and images.
 *
 * Copyright (c) 2011 Hayato Takenaka
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * @author: Hayato Takenaka (http://urin.github.com)
 * @version: 0.6.2 - 2015/04/30
**/

function initiateBaloon(){
    (function($) {
      "use strict";
      //-----------------------------------------------------------------------------
      // Private
      //-----------------------------------------------------------------------------
      // Helper for meta programming
      var Meta = {};
      Meta.pos  = $.extend(["top", "bottom", "left", "right"], {camel: ["Top", "Bottom", "Left", "Right"]});
      Meta.size = $.extend(["height", "width"], {camel: ["Height", "Width"]});
      Meta.getRelativeNames = function(position) {
        var idx = {
          pos: {
            o: position,                                           // origin
            f: (position % 2 === 0) ? position + 1 : position - 1, // faced
            p1: (position % 2 === 0) ? position : position - 1,
            p2: (position % 2 === 0) ? position + 1 : position,
            c1: (position < 2) ? 2 : 0,
            c2: (position < 2) ? 3 : 1
          },
          size: {
            p: (position < 2) ? 0 : 1, // parallel
            c: (position < 2) ? 1 : 0  // cross
          }
        };
        var names = {};
        for(var m1 in idx) {
          if(!names[m1]) names[m1] = {};
          for(var m2 in idx[m1]) {
            names[m1][m2] = Meta[m1][idx[m1][m2]];
            if(!names.camel) names.camel = {};
            if(!names.camel[m1]) names.camel[m1] = {};
            names.camel[m1][m2] = Meta[m1].camel[idx[m1][m2]];
          }
        }
        names.isTopLeft = (names.pos.o === names.pos.p1);
        return names;
      };
      // Helper class to handle position and size as numerical pixels.
      function NumericalBoxElement() { this.initialize.apply(this, arguments); }
      (function() {
        // Method factories
        var Methods = {
          setBorder: function(pos, isVertical) {
            return function(value) {
              this.$.css("border-" + pos.toLowerCase() + "-width", value + "px");
              this["border" + pos] = value;
              return (this.isActive) ? digitalize(this, isVertical) : this;
            }
          },
          setPosition: function(pos, isVertical) {
            return function(value) {
              this.$.css(pos.toLowerCase(), value + "px");
              this[pos.toLowerCase()] = value;
              return (this.isActive) ? digitalize(this, isVertical) : this;
            }
          }
        };
        NumericalBoxElement.prototype = {
          initialize: function($element) {
            this.$ = $element;
            $.extend(true, this, this.$.offset(), {center: {}, inner: {center: {}}});
            for(var i = 0; i < Meta.pos.length; i++) {
              this["border" + Meta.pos.camel[i]] = parseInt(this.$.css("border-" + Meta.pos[i] + "-width")) || 0;
            }
            this.active();
          },
          active: function() { this.isActive = true; digitalize(this); return this; },
          inactive: function() { this.isActive = false; return this; }
        };
        for(var i = 0; i < Meta.pos.length; i++) {
          NumericalBoxElement.prototype["setBorder" + Meta.pos.camel[i]] = Methods.setBorder(Meta.pos.camel[i], (i < 2));
          if(i % 2 === 0)
            NumericalBoxElement.prototype["set" + Meta.pos.camel[i]] = Methods.setPosition(Meta.pos.camel[i], (i < 2));
        }
        function digitalize(box, isVertical) {
          if(isVertical == null) { digitalize(box, true); return digitalize(box, false); }
          var m = Meta.getRelativeNames((isVertical) ? 0 : 2);
          box[m.size.p] = box.$["outer" + m.camel.size.p]();
          box[m.pos.f] = box[m.pos.o] + box[m.size.p];
          box.center[m.pos.o] = box[m.pos.o] + box[m.size.p] / 2;
          box.inner[m.pos.o] = box[m.pos.o] + box["border" + m.camel.pos.o];
          box.inner[m.size.p] = box.$["inner" + m.camel.size.p]();
          box.inner[m.pos.f] = box.inner[m.pos.o] + box.inner[m.size.p];
          box.inner.center[m.pos.o] = box.inner[m.pos.f] + box.inner[m.size.p] / 2;
          return box;
        }
      })();
      // Adjust position of balloon body
      function makeupBalloon($target, $balloon, options) {
        $balloon.stop(true, true);
        var outerTip, innerTip,
          initTipStyle = {position: "absolute", height: "0", width: "0", border: "solid 0 transparent"},
          target = new NumericalBoxElement($target),
          balloon = new NumericalBoxElement($balloon);
        balloon.setTop(-options.offsetY
          + ((options.position && options.position.indexOf("top") >= 0) ? target.top - balloon.height
          : ((options.position && options.position.indexOf("bottom") >= 0) ? target.bottom
          : target.center.top - balloon.height / 2)));
        balloon.setLeft(options.offsetX
          + ((options.position && options.position.indexOf("left") >= 0) ? target.left - balloon.width
          : ((options.position && options.position.indexOf("right") >= 0) ? target.right
          : target.center.left - balloon.width / 2)));
        if(options.tipSize > 0) {
          // Add hidden balloon tips into balloon body.
          if($balloon.data("outerTip")) { $balloon.data("outerTip").remove(); $balloon.removeData("outerTip"); }
          if($balloon.data("innerTip")) { $balloon.data("innerTip").remove(); $balloon.removeData("innerTip"); }
          outerTip = new NumericalBoxElement($("<div>").css(initTipStyle).appendTo($balloon));
          innerTip = new NumericalBoxElement($("<div>").css(initTipStyle).appendTo($balloon));
          // Make tip triangle, adjust position of tips.
          var m;
          for(var i = 0; i < Meta.pos.length; i++) {
            m = Meta.getRelativeNames(i);
            if(balloon.center[m.pos.c1] >= target[m.pos.c1] &&
              balloon.center[m.pos.c1] <= target[m.pos.c2]) {
              if(i % 2 === 0) {
                if(balloon[m.pos.o] >= target[m.pos.o] && balloon[m.pos.f] >= target[m.pos.f]) break;
              } else {
                if(balloon[m.pos.o] <= target[m.pos.o] && balloon[m.pos.f] <= target[m.pos.f]) break;
              }
            }
            m = null;
          }
          if(m) {
            balloon["set" + m.camel.pos.p1]
              (balloon[m.pos.p1] + ((m.isTopLeft) ? 1 : -1) * (options.tipSize - balloon["border" + m.camel.pos.o]));
            makeTip(balloon, outerTip, m, options.tipSize, $balloon.css("border-" + m.pos.o + "-color"));
            makeTip(balloon, innerTip, m, options.tipSize - 2 * balloon["border" + m.camel.pos.o], $balloon.css("background-color"));
            $balloon.data("outerTip", outerTip.$).data("innerTip", innerTip.$);
          } else {
            $.each([outerTip.$, innerTip.$], function() { this.remove(); });
          }
        }
        // Make up balloon tip.
        function makeTip(balloon, tip, m, tipSize, color) {
          var len = Math.round(tipSize / 1.7320508);
          tip.inactive()
            ["setBorder" + m.camel.pos.f](tipSize)
            ["setBorder" + m.camel.pos.c1](len)
            ["setBorder" + m.camel.pos.c2](len)
            ["set" + m.camel.pos.p1]((m.isTopLeft) ? -tipSize : balloon.inner[m.size.p])
            ["set" + m.camel.pos.c1](balloon.inner[m.size.c] / 2 - len)
            .active()
            .$.css("border-" + m.pos.f + "-color", color);
        }
      }
      // True if the event comes from the target or balloon.
      function isValidTargetEvent($target, e) {
        var b = $target.data("balloon") && $target.data("balloon").get(0);
        return !(b && (b === e.relatedTarget || $.contains(b, e.relatedTarget)));
      }
      //-----------------------------------------------------------------------------
      // Public
      //-----------------------------------------------------------------------------
      $.fn.balloon = function(options) {
        return this.one("mouseenter", function first(e) {
          var $target = $(this), t = this;
          var $balloon = $target.off("mouseenter", first)
            .showBalloon(options).on("mouseenter", function(e) {
              isValidTargetEvent($target, e) && $target.showBalloon();
            }).data("balloon");
          if($balloon) {
            $balloon.on("mouseleave", function(e) {
              if(t === e.relatedTarget || $.contains(t, e.relatedTarget)) return;
              $target.hideBalloon();
            }).on("mouseenter", function(e) {
              if(t === e.relatedTarget || $.contains(t, e.relatedTarget)) return;
              $balloon.stop(true, true);
              $target.showBalloon();
            });
          }
        }).on("mouseleave", function(e) {
          var $target = $(this);
          isValidTargetEvent($target, e) && $target.hideBalloon();
        });
      };
      $.fn.showBalloon = function(options) {
        var $target, $balloon;
        if(options || !this.data("options")) {
          if($.balloon.defaults.css === null) $.balloon.defaults.css = {};
          this.data("options", $.extend(true, {}, $.balloon.defaults, options || {}));
        }
        options = this.data("options");
        return this.each(function() {
          var isNew, contents;
          $target = $(this);
          isNew = !$target.data("balloon");
          $balloon = $target.data("balloon") || $("<div>");
          if(!isNew && $balloon.data("active")) { return; }
          $balloon.data("active", true);
          clearTimeout($target.data("minLifetime"));
          contents = $.isFunction(options.contents)
            ? options.contents.apply(this)
            : (options.contents || (options.contents = $target.attr("title") || $target.attr("alt")));
          $balloon.append(contents);
          if(!options.url && $balloon.html() === "") { return; }
          if(!isNew && contents !== $balloon.html()) $balloon.empty().append(contents);
          $target.removeAttr("title");
          if(options.url) {
            $balloon.load($.isFunction(options.url) ? options.url(this) : options.url, function(res, sts, xhr) {
              if(options.ajaxComplete) options.ajaxComplete(res, sts, xhr);
              makeupBalloon($target, $balloon, options);
            });
          }
          if(isNew) {
            $balloon
              .addClass(options.classname)
              .css(options.css || {})
              .css({visibility: "hidden", position: "absolute"})
              .appendTo("body");
            $target.data("balloon", $balloon);
            makeupBalloon($target, $balloon, options);
            $balloon.hide().css("visibility", "visible");
          } else {
            makeupBalloon($target, $balloon, options);
          }
          $target.data("delay", setTimeout(function() {
            if(options.showAnimation) {
              options.showAnimation.apply(
                $balloon.stop(true, true), [
                  options.showDuration, function() {
                    options.showComplete && options.showComplete.apply($balloon);
                  }
                ]
              );
            } else {
              $balloon.show(options.showDuration, function() {
                if(this.style.removeAttribute) { this.style.removeAttribute("filter"); }
                options.showComplete && options.showComplete.apply($balloon);
              });
            }
            if(options.maxLifetime) {
              clearTimeout($target.data("maxLifetime"));
              $target.data("maxLifetime",
                setTimeout(function() { $target.hideBalloon(); }, options.maxLifetime)
              );
            }
          }, options.delay));
        });
      };
      $.fn.hideBalloon = function() {
        var options = this.data("options");
        if(!this.data("balloon")) return this;
        return this.each(function() {
          var $target = $(this);
          clearTimeout($target.data("delay"));
          clearTimeout($target.data("minLifetime"));
          $target.data("minLifetime", setTimeout(function() {
            var $balloon = $target.data("balloon");
            if(options.hideAnimation) {
              options.hideAnimation.apply(
                $balloon.stop(true, true),
                [
                  options.hideDuration,
                  function(d) {
                    $(this).data("active", false);
                    options.hideComplete && options.hideComplete(d);
                  }
                ]
              );
            } else {
              $balloon.stop(true, true).hide(
                options.hideDuration,
                function(d) {
                  $(this).data("active", false);
                  options.hideComplete && options.hideComplete(d);
                }
              );
            }
          },
          options.minLifetime));
        });
      };
      $.balloon = {
        defaults: {
          contents: null, url: null, ajaxComplete: null, classname: null,
          position: "top", offsetX: 0, offsetY: 0, tipSize: 12,
          delay: 0, minLifetime: 200, maxLifetime: 0,
          showDuration: 100, showAnimation: null,
          hideDuration:  80, hideAnimation: function(d, c) { this.fadeOut(d, c); },
          showComplete: null, hideComplete: null,
          css: {
            minWidth       : "20px",
            padding     : "5px",
            borderRadius   : "6px",
            border       : "solid 1px #777",
            boxShadow     : "4px 4px 4px #555",
            color         : "#666",
            backgroundColor: "#efefef",
            opacity     : "0.85",
            zIndex       : "32767",
            textAlign     : "left"
          }
        }
      };
    })(jQuery);
}