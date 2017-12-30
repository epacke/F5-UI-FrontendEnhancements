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
    0.1     Original version.
    0.2     Make sure that the script is not executed when not needed.
    0.3     Adding noConflict to avoid problems with F5's javascripts.
    0.4     Adding iRule links in the virtual server resources tab.
    0.5     Adding default settings when creating pools and monitors.
    0.6     Added parsing for data group lists in iRules and creates links to them.
    0.7     Added parsing for data group content and added it as link hover information.
    0.8     Fixed a problem in the script with the node by default setting.
    0.9     Added automatically selecting the right certificate and key when viewing an SSL profile.
    1.0     Added an option to make objects in the current partition bold to make it easier to.
            distinguish them from objects in the common partition.
    1.1     Changed the balloon position to the left and set whitspace to nowrap in order to.
            support long data group list values.
    1.2     Added default options when creating CSR.
    1.3	    Now generating monitor test links.
	2.0		Generating pool status icons.
			Preventing edited data group list entries from being saved.
			Making data-group list parsing more performant.
			Script will automatically match client ssl profile name with certificates and keys using the same name.
    2.0.1   Fixing a bug where the data group list type select box is expanded.
    2.0.2   Adding double clicking on selects.
    2.0.3   Improving data group list scanning.
	
*/

/***************************************************************************************
                        Begin Config section
****************************************************************************************/

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
    ParseDataGroupLists = true;

    Options:
    0 = No
    1 = Yes
    **************************************************************/
    var ParseDataGroupLists = true;

    /**************************************************************
    Make objects in the current partition bold

    Default:
    MakePartitionObjectsBold = true;

    **************************************************************/

    var MakePartitionObjectsBold = true;

    /**************************************************************
    Add default certificate signing alternatives
    First one defined is always the default one

    This one is a bit tricky to format, look at the example carefully

    Default (disabled):
    EnableDefaultcsroptions = false;

    Options:
    false = No
    true = Yes

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

    var EnableDefaultcsroptions = true;

    var csroptions = {
                "Company1": {
                    "OptionName": "Company 1",
                    "CommonName": "[Example *.domain.com]",
                    "Division": "Stockholm office",
                    "Organization": "My Office address",
                    "Locality": "Stockholm",
                    "StateProvince": "Stockholm",
                    "Country": "SE",
                    "Email": "office@company.se",
                    "SubjectAlt": ""
                }
            ,
                "Company2": {
                    "OptionName": "Another company",
                    "CommonName": "[Example *.domain.com]",
                    "Division": "Oslo office",
                    "Organization": "My Oslo Office address",
                    "Locality": "Oslo",
                    "StateProvince": "Oslo",
                    "Country": "NO",
                    "Email": "office@company.no",
                    "SubjectAlt": ""
                }
            }

     /*****************************************************************************
        Select this default chain certificate when creating client SSL profiles

        Default:
        defaultChain = "";

        defaultChain = "/Common/mychain.crt";
    *******************************************************************************/

    var defaultChain = "/Common/ca-bundle.crt";

     /*************************************************************************
        Chooses a default parent profile when creating client SSL profiles

        Default:
        defaultClientSSLParentProfile = "";

        defaultClientSSLParentProfile = "/Common/myParentProfile";
    ***************************************************************************/

    var defaultClientSSLParentProfile = "";

/***************************************************************************************
						End Config section
****************************************************************************************/

//Make sure that the tampermonkey jQuery does not tamper with F5's scripts
this.$ = this.jQuery = jQuery.noConflict(true);

//Declare global ajax queue limit
var tamperDataGroupLists = new Array();
var detectedarr = [];

var poolStatuses;

var versionInfo = $(parent.top.document).find("div#deviceid div span").attr("title");
var version = versionInfo.split(" ")[1];

if(version.split(".")[0] === "12"){
	(function() {

		//This is the popup text divs that pops up when hovering data group lists
		initiateBaloon();

        initiateContextMenu();

		if(ParseDataGroupLists && uriContains("/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp")){
			improveiRuleProperties();
		}

		if(uriContains("/tmui/Control/form?__handler=/tmui/locallb/virtual_server/resources&__source=Manage")){
            improveiRuleSelection();
		}

		if($("select[name=mon_type]").length){
            addMonitorPrefix();
        }

		if(MakePartitionObjectsBold && uriContains('/list.jsp')){
            makeCurrentPartitionObjectsBold();
		}

		if(uriContains("/tmui/Control/jspmap/tmui/locallb/ssl_certificate/create.jsp")){
            improveCertificateCreation();
		}

        if(uriContains("/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name")){
            improvePoolProperties();
        }

        if(uriContains("/tmui/Control/jspmap/tmui/locallb/pool/create.jsp")){
            improvePoolCreation();
            improvePoolProperties();
        }

		if(uriContains("/tmui/Control/jspmap/tmui/locallb/pool/member/properties.jsp")) {
            improvePoolMemberProperties();
		}

		if($('input[name="cert_key_chain_override"]').length){
            improveCertKeyChainSelection();
		}

		if(uriContains("/tmui/Control/jspmap/tmui/locallb/virtual_server/resources.jsp")){
            improveVirtualServerResources();
		}

        if(uriContains("/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp")){
            improveVirtualServerProperties();
        }

		if(uriContains("/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp")){
            improveDataGroupListProperties();
            improveDataGroupListEditing();
		}

		if(uriContains("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/create.jsp")){
            improveClientSSLProfileCreation();
		}


		if(uriContains("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp") || uriContains("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/create.jsp")){
			matchCertAndKey();
		}
		
		if(uriContains("/tmui/Control/jspmap/tmui/locallb/pool/list.jsp")){
            improvePoolList();
		}
		
		if(uriContains("/tmui/Control/jspmap/tmui/locallb/datagroup/create.jsp")){
		    improveDataGroupListEditing();    
        }
		
		
	})();
}

/**************************************************************************
 *      
 *                              iRule improvements
 *
 **************************************************************************/

function improveiRuleProperties(){

    // Show the data group lists used in an iRule
    cacheDataGroupLists(function(dataGroupLists){

        //This part prepares the iRule definition table for the data group lists (adds a third column)
        $("table#general_table thead tr.tablehead td").attr("colspan", 3);
        $("table#general_table tr").not("#definition_ace_row").each(function(){
            $(this).find("td").eq(1).attr("colspan", 2);
        });

        $("tr#definition_ace_row").append("<td id=\"dglist\" class=\"settings\"></td>").css({
            "vertical-align": "top"
        });

        $("tr#definition_ace_row td.settings").css("width","80%");

        //This command generates the data group lists (if any)
        getDataGroupListsFromRule($("textarea#rule_definition").val());
        //getDataGroupListsFromRuleOld($("textarea#rule_definition").val());
        //Update the list on every key stroke
        $(document).on("keyup", function(){

            var iRuleContent = codeEditor.gSettings.editor.container.env.document.doc.$lines.join("\n");
            getDataGroupListsFromRule(iRuleContent);
            //getDataGroupListsFromRuleOld($("textarea#rule_definition").val());

        });

    });

}

// Caches a list of all the data group lists available in Common and the current partition (if any)
function cacheDataGroupLists(updateDGPage){

    var DataGroupListLink = "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/datagroup/list.jsp";

    // We want to get all data group lists in case there is a direct reference
    var currentPartition = getCookie("F5_CURRENT_PARTITION");
    replaceCookie("F5_CURRENT_PARTITION", "\"[All]\"");

    //Request the iRule page to see if the instance exists or not
    $.ajax({
        url: DataGroupListLink,
        type: "GET",
        success: function(response) {
            
            var dataGroupListLinks = $(response).find('table.list tbody#list_body tr td:nth-child(3) a');

            for(i = 0; i < dataGroupListLinks.length; i++){

                var link = dataGroupListLinks[i].href;
                var name = link.split("name=")[1];

                tamperDataGroupLists.push(name);

            }

            replaceCookie("F5_CURRENT_PARTITION", currentPartition);

            updateDGPage();
        }
    });

}

//Parses data group list html to get the key/value pairs for the hover information

function parseDataGroupValues(dg, showBalloon){

    var dgLink = 'https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=' + dg;
    var dghtml;

    $.ajax({
        url: dgLink,
        type: "GET",
        success: function(htmlresponse) {
            matches = htmlresponse.match(/<option value="[^"]+(\\x0a)?.+?" >/g);

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

            //Show the balloon using the callback function
            showBalloon(html);
        }
    });
}

function getDataGroupListsFromRule(str){

    "use strict"

    console.log("executing new rule");
    console.time('DataGroupLists');

    let lines = str.split("\n");
    let partitionPrefix = "/" + getCookie("F5_CURRENT_PARTITION") + "/";

    let foundDataGroupLists = {};

    let updateDGObject = function(dg){
        let partition = dg.split("/")[1];
        let name = dg.split("/")[2];
        if(!(partition in foundDataGroupLists)){
            foundDataGroupLists[partition] = new Array();
        }
        foundDataGroupLists[partition].push(name);
    };

    for(var i = 0; i < lines.length; i++){
        
        // Skip lines that start with a comment
        if((lines[i].match(/^\s*#/))){
            continue;
        }

        if(lines[i].indexOf("class ") > -1){

            let words = lines[i].split(/[\s\[\]]/);
            let classIndex = words.indexOf("class");

            words.map(function(word, index){

                if(index < classIndex){
                    return;
                }
                
                if(word !== ""){
                    if(tamperDataGroupLists.indexOf(word) > -1){
                        updateDGObject(word);
                    } else if(tamperDataGroupLists.indexOf(partitionPrefix + word) > -1){
                        updateDGObject(partitionPrefix + word);
                    } else if(tamperDataGroupLists.indexOf("/Common/" + word) > -1){
                        updateDGObject("/Common/" + word);
                    }
                }

            });
        }

    }

    let html = "<div id=\"dglabel\"><span style=\"font-weight:bold\">Detected Data group lists:</span><hr>";

    if (Object.keys(foundDataGroupLists).length === 0 && foundDataGroupLists.constructor === Object){
        html += "None";
    } else {
        for(var partition in foundDataGroupLists){

            let list = foundDataGroupLists[partition];

            html += `
                <div style="padding-bottom:5px;">
                    <span style="font-weight:bold;">/` + partition + `:</span>`

            for(let i = 0; i < list.length; i++){

                let fullPath = "/" + partition + "/" + list[i];

                html += `
                    <br>
                    <a href="https://f5yp01.j.local/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=` + fullPath + `" data-name="` + fullPath + `">` + list[i] + `</a>`;
            }

            html += `
                <br>
                </div>`
        }
    }

    html += "</div>";

    $("td#dglist").html(html);

    $("td#dglist a").each(function(){

        let name = this.getAttribute("data-name");
        
        $(this).on("mouseover", function(){
            if(this.getAttribute("data-done") === null){
                this.setAttribute("data-done", "true");
                parseDataGroupValues(name, (balloonContent) => $(this).showBalloon({ position: "left", css: { whitespace: "nowrap" }, showDuration: 0, hideDuration: 0, contents: balloonContent }));
            }
        });

        $(this).on("mouseleave", function(){
            $(this).hideBalloon();
        });
    })

    console.timeEnd("DataGroupLists");
}

/**************************************************************************
 *      
 *                       Data group list improvements
 *
 **************************************************************************/

function improveDataGroupListEditing(){
    //Increase the size of the lists
    $("select").not("#datagroup_type_select").attr("size", DatagroupListCount);
    
    //Add extra cell and buttons for bulk import
    $("table#records thead tr.tablehead td").after(`<td>
                                                        <div class="title">Bulk import text</div>
                                                    </td>
                                                    `);
    $("table#records tbody tr td.settings").after(`<td class="settings" id="dgbulkimport">
                                                    <textarea cols="60" rows="` + (DatagroupListCount + 8) + `" class="bulkcontent"/>
                                                    <br>
                                                    <input type="button" value="Merge the lists" id="bulkMerge"/>
                                                    <input type="button" value="Replace current list" id="bulkReplace"/>
                                                    <input type="button" value="Edit active list" id="bulkEdit"/>
                                                    <input type="button" value="Help" id="bulkHelp"/>
                                                    </td>
                                                    `
                                            )
                                                    

    //Attach the functions to the buttons
    
    $("input#bulkMerge").on("click", function(){

        "use strict";
        
        //First get the data
        var importListArr = $("textarea.bulkcontent:visible").val().split("\n");
        var currentListArr = [];
        $("select:visible").last().find("option").each(function(){
            currentListArr.push($(this).text().trim()) 
        })
        
        //Create objects from the arrays
        var importObj = createDGListObject(importListArr);
        var currentObj = createDGListObject(currentListArr);

        for(var key in importObj){
            if(!(key in currentObj)){
                
                var value = importObj[key];
                var optionValue = value === "" ? key : (key + "\\x0a" + value);
                var optionText = value === "" ? key : (key + " := " + value);
                
                $("select:visible").last().append("<option value=\"" + optionValue + "\" selected=\"\">" + optionText + "</option></select>");
            }
        }
        
    })
    
    $("input#bulkReplace").on("click", function(){

        "use strict";
        
        //First get the data
        var importListArr = $("textarea.bulkcontent:visible").val().split("\n");

        //Create an object from the array
        var importObj = createDGListObject(importListArr);
        
        //Remove current options
        $("select:visible").last().find("option").remove();
        
        for(var key in importObj){
            
            var value = importObj[key];
            var optionValue = value === "" ? key : (key + "\\x0a" + value);
            var optionText = value === "" ? key : (key + " := " + value);
                
            $("select:visible").last().append("<option value=\"" + optionValue + "\" selected=\"\">" + optionText + "</option></select>");
            
        }
        
    })

    $("input#bulkEdit").on("click", function(){
        
        var keyVals = []
        
        $("select:visible").last().find("option").each(function(){
            keyVals.push($(this).text().trim())
            $(this).remove();
        })
        
        $("textarea.bulkcontent:visible").val(keyVals.join("\n"));
        
    })
    
    $("input#bulkHelp").on("click", function(){
        alert(`Bulk import help:

Merge the lists: 
Takes all the records in the import text area, compares them to the active list and imports the records that does not have duplicate keys.
This means that if "apple" := "banana" exists in the active list and the import list has "apple" := "banana", then "apple" := "banana" won't be imported.

Replace the current list:
Takes all the records in the import text area and replaces the active list. Duplicate records are ignored like with "Merge the lists".

Edit active list:
Moves all the records from the active list to the import list.
`);
    })

}

function improveDataGroupListProperties(){

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

function validateDGObject(lines){
    //Validate that all records has one or no delimiter
    return  !(lines.some(function(line){
        return (line.split(/\s*:=\s*/i).length > 2)
    }));
}


function createDGListObject(lines){
    
    var bulkImportObj = {}
    
    if(validateDGObject(lines)){
                
        //Creating object and ignoring duplicates
        lines.map(function(line){
            
            var lineArr = line.split(/\s*:=\s*/i)
            var key = lineArr[0];
            var value = lineArr[1] || "";
            
            if(!(key in bulkImportObj)){
                bulkImportObj[key] = value;
            }
            
        });
    }
    
    return bulkImportObj
}


/**************************************************************************
 *      
 *                        Virtual server improvements
 *
 **************************************************************************/

function improveVirtualServerProperties(){

        //  SSL Profile (client)
        addDoubleClick("selectedclientsslprofiles", "availableclientsslprofiles_button");
        addDoubleClick("availableclientsslprofiles", "selectedclientsslprofiles_button");
        addContextMenu("selectedclientsslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp?name=");
        addContextMenu("availableclientsslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/clientssl/properties.jsp?name=");

        //  SSL Profile (server)
        addDoubleClick("selectedserversslprofiles", "availableserversslprofiles_button");
        addDoubleClick("availableserversslprofiles", "selectedserversslprofiles_button");
        addContextMenu("selectedserversslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/serverssl/properties.jsp?name=");
        addContextMenu("availableserversslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/serverssl/properties.jsp?name=");

        //  VLANs and Tunnels
        addDoubleClick("selected_vlans", "available_vlans_button");
        addDoubleClick("available_vlans", "selected_vlans_button");
}

function improveiRuleSelection(){

    assignedrules = $("#assigned_rules").attr("size", iRulesCount);
    rulereferences = $("#rule_references").attr("size", iRulesCount);

    // Add double click feature
    addDoubleClick("rule_references", "assigned_rules_button");
    addDoubleClick("assigned_rules", "rule_references_button");
    
}

function improveVirtualServerResources(){
    var selecteddefaultpool = $('input[name=default_pool_before]').val();
    if(selecteddefaultpool != 'NO_SELECTION'){
        $('input[name=default_pool_before]').after('<a href="https://' + window.location.host + '/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=' + selecteddefaultpool + '"><input type="button" value="Show default pool"/></a>')
    }
}

/**************************************************************************
 *      
 *                        Pool improvements
 *
 **************************************************************************/

function improvePoolList(){
    
    addGlobalStyle('div.tamperpoolstatus{position:relative;}div.tamperpoolstatus table.list{position:relative;width:100%;border:1px solid #999 }div.tamperpoolstatus table.list tbody tr.color0{background:#deddd9}div.tamperpoolstatus table.list tbody tr.color0 td{border-bottom:1px solid #c4c2be}div.tamperpoolstatus table.list tbody tr.inner td,div.tamperpoolstatus table.list tbody tr.innerbold td{padding:3px 5px;border-bottom:none;white-space:nowrap}div.tamperpoolstatus table.list tbody tr.color1{background:#fff}div.tamperpoolstatus table.list tbody tr.color2{background:#f7f6f5}div.tamperpoolstatus table.list tbody tr.innerbold td{font-weight:700}div.tamperpoolstatus table.list tbody td{vertical-align:top;padding:6px 5px 4px;border-bottom:1px solid #ddd;white-space:nowrap}div.tamperpoolstatus table.list tbody td input{margin-top:0}div.tamperpoolstatus table.list tbody td img{padding-top:1px}div.tamperpoolstatus table.list div.customtooltip div,div.tamperpoolstatus table.list div.filter div{padding:3px 5px}div.tamperpoolstatus table.list tbody td.first{border-left:1px solid #999}div.tamperpoolstatus table.list tbody td.last{border-right:1px solid #999}div.tamperpoolstatus table.list tbody td.column1,div.tamperpoolstatus table.list tbody td.column2{border-left:1px solid #ddd}div.tamperpoolstatus table.list div.customtooltip,div.tamperpoolstatus table.list div.filter{position:absolute;z-index:1;margin-top:2px;border:1px solid #666;background:#deddd9}div.tamperpoolstatus table.list div.customtooltip div a.close{color:red;font-weight:700}div.tamperpoolstatus table.list div.filter div.current{margin:1px;padding:3px;border:1px solid #999;background:#eee}div.tamperpoolstatus table.list tbody tr.expanded td,div.tamperpoolstatus table.list tbody tr.notlast td{border-bottom:none!important}div.tamperpoolstatus table.list .expired{padding-left:17px;background:url(../images/status_certificate_expired.gif) left center no-repeat}div.tamperpoolstatus table.list .warning{padding-left:17px;background:url(../images/status_certificate_warning.gif) left center no-repeat}div.tamperpoolstatus table.list tbody tr.collapsible-parent td a{vertical-align:top}div.tamperpoolstatus table.list thead tr td div.collapsible-toggle.expanded{background:url(/xui/common/images/icon_toggle_all_minus.gif) no-repeat;width:15px;height:15px;display:inline-block;cursor:pointer;zoom:1}div.tamperpoolstatus table.list tbody tr.expanded td div.collapsible-toggle{background:url(/xui/common/images/icon_toggle_minus.gif) no-repeat;width:12px;height:12px;margin:0 auto;zoom:1}div.tamperpoolstatus table.list thead tr td div.collapsible-toggle.collapsed{background:url(/xui/common/images/icon_toggle_all_plus.gif) no-repeat;width:15px;height:15px;display:inline-block;cursor:pointer;zoom:1}div.tamperpoolstatus table.list tbody tr.collapsed td div.collapsible-toggle{background:url(/xui/common/images/icon_toggle_plus.gif) no-repeat;width:12px;height:12px;margin:0 auto;zoom:1}div.tamperpoolstatus table.list tbody tr.set-whitespace-normal td{white-space:normal}div.tamperpoolstatus table.list tbody.group_move_placeholder{display:table-row}div.tamperpoolstatus table.list tbody tr.handle td.first{width:15px;background:url(/tmui/tmui/skins/Default/images/icon_gripper.png) 50% no-repeat!important;cursor:url(/xui/common/images/openhand.cur),default}div.tamperpoolstatus thead tr.columnhead td div.reorder{width:16px;height:16px;background:url(/xui/common/images/cursor-openhand.png) center no-repeat}div.tamperpoolstatus table.list .highlight{background:#dbefff!important;cursor:url(/xui/common/images/openhand.cur),default}div.tamperpoolstatus table.list .highlight a{cursor:url(/xui/common/images/openhand.cur),default}div.tamperpoolstatus div.section{margin:10px 0}div.tamperpoolstatus thead tr.tablehead td{border-bottom:1px solid #999;vertical-align:bottom}div.tamperpoolstatus thead tr.tablehead div{padding-bottom:3px;white-space:nowrap}div.tamperpoolstatus thead tr.tablehead div.title{float:left;margin-top:.5em;color:#000;font-weight:700}div.tamperpoolstatus thead tr.tablehead div.advancedtoggle{float:left;margin:0 0 0 5px;color:#000}div.tamperpoolstatus thead tr.tablehead div.search{float:left}div.tamperpoolstatus thead tr.tablehead div.searchnofloat{clear:both;float:left}div.tamperpoolstatus thead tr.tablehead div.search input.search,div.tamperpoolstatus thead tr.tablehead div.searchnofloat input.search{width:240px}div.tamperpoolstatus thead tr.tablehead div.buttons{float:right}div.buttons input[type=button],div.tamperpoolstatus thead tr.tablehead div.buttons input[type=button],div.tamperpoolstatus thead tr.tablehead div.buttons input[type=submit]{padding:0 5px}div.tamperpoolstatus thead tr.tablehead div.buttons input.checkall{margin-right:9px}div.tamperpoolstatus thead tr.tablehead div.grouptitle{margin:0 3px 0 2px;padding:1px 10px;border:1px solid #999;border-bottom:none;background:#deddd9;text-align:center;font-weight:700}div.tamperpoolstatus thead tr.columnhead td{padding:5px;border-bottom:1px solid #999;border-top:1px solid #999;border-left:1px solid #999;background:url(../images/background_list_head.gif) #deddd9;white-space:nowrap}div.tamperpoolstatus thead tr.columnhead td.last{border-right:1px solid #999}div.tamperpoolstatus thead tr.columnhead td a{display:block;width:expression("1%");padding-top:1px;margin-top:-1px;color:#000}div.tamperpoolstatus thead tr.columnhead td a.filteroff{margin-top:0;padding-left:20px;background:url(../images/button_filter_off.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.filteron{margin-top:0;padding-left:20px;background:url(../images/button_filter_on.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.selectall{margin-top:0;width:15px;background:url(../images/button_select_all.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.selectall:hover{text-decoration:none}div.tamperpoolstatus thead tr.columnhead td a.sortoff{margin-top:0;padding-left:12px;background:url(../images/button_sort_off.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.sorton{margin-top:0;padding-left:12px;background:url(../images/button_sort_on.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.sortup{margin-top:0;padding-left:12px;background:url(../images/button_sort_up.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td a.sortdown{margin-top:0;padding-left:12px;background:url(../images/button_sort_down.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .greenflag,div.tamperpoolstatus thead tr.columnhead td .redflag,div.tamperpoolstatus thead tr.columnhead td .yellowflag{display:block;width:expression("1%");padding-top:1px;padding-left:20px}div.tamperpoolstatus thead tr.columnhead td .greenflag{background:url(../images/status_flag_green.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .yellowflag{background:url(../images/status_flag_yellow.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .redflag{background:url(../images/status_flag_red.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .activedevice,div.tamperpoolstatus thead tr.columnhead td .failsafefaultdevice,div.tamperpoolstatus thead tr.columnhead td .impaireddevice,div.tamperpoolstatus thead tr.columnhead td .maintenancedevice,div.tamperpoolstatus thead tr.columnhead td .offlinedevice,div.tamperpoolstatus thead tr.columnhead td .replacementdevice,div.tamperpoolstatus thead tr.columnhead td .standbydevice,div.tamperpoolstatus thead tr.columnhead td .unknowndevice,div.tamperpoolstatus thead tr.columnhead td .unreachabledevice{display:block;width:expression("1%");padding:2px 0 2px 27px}div.tamperpoolstatus thead tr.columnhead td .activedevice{background:url(../images/status_filter_device_active.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .standbydevice{background:url(../images/status_filter_device_standby.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .failsafefaultdevice{background:url(../images/status_filter_device_failsafe_fault.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .offlinedevice{background:url(../images/status_filter_device_offline.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .forcedofflinedevice{display:block;width:expression("1%");padding:2px 0 2px 27px;background:url(../images/status_filter_device_forcedoffline.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .unknowndevice{background:url(../images/status_filter_device_present_unknown.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .impaireddevice{background:url(../images/status_filter_device_impaired.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .maintenancedevice{background:url(../images/status_filter_device_maint.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .replacementdevice{background:url(../images/status_filter_device_replacement.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .unreachabledevice{background:url(../images/status_filter_device_unreachable.gif) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .available,div.tamperpoolstatus thead tr.columnhead td .offline,div.tamperpoolstatus thead tr.columnhead td .unavailable,div.tamperpoolstatus thead tr.columnhead td .unknown{display:block;width:expression("1%");padding-top:1px;padding-left:20px}div.tamperpoolstatus thead tr.columnhead td .available{background:url(../images/status_circle_green.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .unavailable{background:url(../images/status_triangle_yellow.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .offline{background:url(../images/status_diamond_red.png) left center no-repeat}div.tamperpoolstatus thead tr.columnhead td .unknown{background:url(../images/status_square_blue.png) left center no-repeat}div.tamperpoolstatus table.head td.wizardtext{padding-top:10px}div.tamperpoolstatus table.tablefoot{width:100%}div.tamperpoolstatus table.tablefoot td{vertical-align:top}div.tamperpoolstatus table.tablefoot div{padding:3px 0 20px}div.tamperpoolstatus table.tablefoot div.buttons{float:left}div.tamperpoolstatus table.tablefoot div.buttons input[type=button],div.tamperpoolstatus table.tablefoot div.buttons input[type=submit]{padding:0 5px}div.tamperpoolstatus table.tablefoot div.pagecontrols{float:right}');
    
    var poolStatuses = {}
    var oldMessage = $(parent.top.document).find("div#message div#messagetype div#messagetext").text();
    
    // Check when the loading screen for pools has disappears and then show a member statuses.
    var statusInterval = setInterval(function(){
        if(!$(parent.top.document).find("div#message").is(":visible")){
            $(parent.top.document).find("div#message div#messagetype div#messagetext").text("Loading member statuses...");
            $(parent.top.document).find("div#message").show();
            clearInterval(statusInterval);
        }       
    } , 100);

    $.ajax({
        url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/locallb/pool/stats.jsp?SearchString=*&",
        type: "GET",
        success: function(response) {
            
            $(response).find("tbody#list_body tr")
            .filter(function() {
                return this.id.match(/\/.+\//);
            })
            .each(function(){
                
                var poolName = this.id.replace(/_member_row_[0-9]+$/i, "");
                
                if(!(poolName in poolStatuses)){
                    poolStatuses[poolName] = {};
                }
                
                var memberName = $(this).find("td").eq(3).text().trim();
                var statusIcon = $(this).find("td").eq(1).find("img").attr("src");
                var title  = $(this).find("td").eq(1).find("img").attr("title");

                poolStatuses[poolName][memberName] = { "icon": statusIcon, "title": title };
            
            });

            $("tbody#list_body tr").each(function(){
            
                var poolName = $(this).find("td").eq(2).find("a").attr("href").replace(/.+name=/i, "");
                var existingIcons = [];
                
                if(poolName in poolStatuses){
                    
                    memberStatuses = poolStatuses[poolName];
                    
                    for(memberStatus in memberStatuses){
                        if(existingIcons.indexOf(memberStatuses[memberStatus]["icon"]) === -1){
                            existingIcons.push(memberStatuses[memberStatus]["icon"]);
                        }
                    }

                    if(existingIcons.length > 1){
                        
                        var html = "<div data-poolname=\"" + poolName + "\" class=\"tamperpoolstatus\" style=\"margin-left:21px;margin-bottom:15px;\">";
                        
                        for(i = 0; i < existingIcons.length;i++){
                            
                            iconURL = existingIcons[i].replace(/\/.*_/i, "/tmui/tmui/skins/Default/images/status_circle_");
                            
                            switch (i){
                                case 0:
                                    html += "<div style=\"z-index:1;position:absolute;max-width:6.7px;overflow:hidden;\"><img src=\"" + iconURL + "\"/></div>"
                                    break;
                                case 1:
                                    html += "<div style=\"z-index:1;position:absolute;left:6.7px;max-width:6.5px;overflow:hidden;direction:rtl;\"><img src=\"" + iconURL + "\"/></div>"
                                    break;
                                case 2:
                                    html += "<div style=\"z-index:2;position:absolute;max-height:7.5px;left:0.2px;overflow:hidden;\"><img src=\"" + iconURL + "\"/></div>"
                                    break;
                                case 3:
                                    html += "<div style=\"z-index:4;position:absolute;max-width:6.5px;max-height:7.5px;overflow:hidden;\"><img src=\"/tmui/tmui/skins/Default/images/status_circle_blue.png\"/></div>"
                                    break;
                            }
                        }
                        
                        html += "</div>";

                        $(this).find("td").eq(1).html(html);
                        
                    } else {
                        var html = "<div data-poolname=\"" + poolName + "\" style=\"position:relative;padding-top:1px\"><img src=\"" + existingIcons + "\"/></div>"
                        $(this).find("td").eq(1).html(html);
                    }
                    
                    $(this).find("td").eq(1).find("div").on("mouseover", function(){
                        poolName = $(this).attr("data-poolname");
                        
                        if(poolName in poolStatuses){
                            
                            var table = "<div class=\"tamperpoolstatus\"><table class=\"list\" style=\"opacity:1\"><thead id=\"list_header\"><tr class=\"columnhead\"><td></td><td>Member</td><td>Status</td></tr></thead><tbody>";
                            memberStatuses = poolStatuses[poolName];
                            
                            var i = 0;
                            
                            for(member in memberStatuses){
                                table += "<tr class=\"color" + ((i%2)+1) + "\"><td align=\"center\"><img src=\"" + memberStatuses[member].icon + "\"/></td><td>" + member + "</td><td>" + memberStatuses[member].title + "</td></tr>";
                                i++;
                            }
                            
                            table += "</tbody></table></div>";
                            
                            $(this).balloon({ position: "right", css: { whitespace: "nowrap", boxShadow: null, opacity: "1", padding: "0px", border: "0px", background: "rgba(0, 0, 255,1)" }, minLifetime: 0, tipSize:0, showDuration: 0, hideDuration: 0, contents: table });
                        }
                    });
                    
                    //For some reason I need to trigger this at least one ahead of time in order to get the popup to show on the first attempt
                    $(this).find("td").eq(1).find("div").trigger("mouseover");
                    $(this).find("td").eq(1).find("div").trigger("mouseout");
                    
                }
            })
            
            $(parent.top.document).find("div#message").fadeOut(function(){
                $(parent.top.document).find("div#message div#messagetype div#messagetext").text(oldMessage);
            });
            
        }
    })

}


function improvePoolProperties(){

    // Increase the select box sizes            
    $("#monitor_rule").attr("size", MonitorCount);
    $("#available_monitor_select").attr("size", MonitorCount);

    // Add double click feature
    addDoubleClick("monitor_rule", "available_monitor_select_button");
    addDoubleClick("available_monitor_select", "monitor_rule_button");

}

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
        $("#member_address_radio_address").attr("unchecked","");
        $("#member_address_radio_node").attr("checked","");
        $("#member_address_radio_node").click();
    }
    
}

function addMonitorPrefix(){
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

function getMonitorRequestParameters(sendstring, type, ip, port){

    "use strict";
    var headers = [];
    var protocol = "";

    var commandObj = {
        "commands": {
            "HTTP": {
                "title": "",
                "command": ""
            },
            "Curl": {
                "title": "",
                "command": ""
            },
            "Netcat": {
                "title": "",
                "command": ""
            }
        },
        "success": true
    }

    var sendstringarr = sendstring.split(" ");
    var verb = sendstringarr[0];
    var uri = sendstringarr[1].replace("\\r\\n", "");
    
    if (/^HTTP[S]?$/.test(type)){
        protocol = type.toLowerCase();
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

        var commandstring = 'curl -vvv';

        if (verb === "HEAD"){
            commandstring += " -I"
        }

        if(headers.length > 0){
            for(var i in headers){
               var headerarr = headers[i].split(":");
               var headername = headerarr[0].trim();
               var headervalue = headerarr[1].trim();

               headervalue = headervalue.replace(/\"/g,'\\&quot;');
               commandstring += ' --header &quot;' + headername + ':' + headervalue + '&quot;';
            }
        }

        commandstring += ' ' + protocol + '://' + ip + ':' + port + uri

        commandObj.commands.Curl.title = "Curl Command";
        commandObj.commands.Curl.string = commandstring;

        commandObj.commands.Netcat.title = "Netcat Command";
        commandObj.commands.Netcat.string = "echo -ne \"" + sendstring + "\" | nc " + ip + " " + port;
        
        commandObj.commands.HTTP.title = "HTTP Link";
        commandObj.commands.HTTP.string = protocol + '://' + ip + ':' + port + uri;

    } else {
        commandObj.success = false;
    }

    return commandObj;
}


/**************************************************************************
 *      
 *                       Client SSL Profile Improvements
 *
 **************************************************************************/

function improveClientSSLProfileCreation(){

    if(defaultClientSSLParentProfile !== ""){
        setTimeout(function(){
            $('select#parent_profile_name').val(defaultClientSSLParentProfile);
            $('select#parent_profile_name').trigger("change");

        }, 1000);

    }

    $("input[name='certificate_name']").on("keyup", function(){
        $("input[name='common_name']").val($(this).val().replace(/^star\./g, "*."));
    });

    setTimeout(function(){
        $("select[name='issuer']").val("Certificate Authority");
        $("select[name='issuer']").trigger("change");
    }, 500);

}


function improveCertKeyChainSelection(){

    if(EnableDefaultcsroptions){
        $('input[name="cert_key_chain_override"]').on("click", matchCertAndKey);

        $('input[name="add_modal_button"]').on("mouseup", function(){
            setTimeout(function(){

                var currentPartition = getCookie("F5_CURRENT_PARTITION");
                var profileName = $("input[name='profile_name']").val();

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

/**************************************************************************
 *      
 *              SSL certificate creation improvements
 *
 **************************************************************************/
function improveCertificateCreation(){

}

function addCSRDropDownMenu(){
            
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


/**************************************************************************
 *      
 *                       Generic functions
 *
 **************************************************************************/

function makeCurrentPartitionObjectsBold(){
    //Get the current partition
    currentpartition = getCookie("F5_CURRENT_PARTITION")

    $("tbody#list_body tr td a").filter(function(){
        return $(this).attr("href").indexOf("/" + currentpartition + "") >= 0
    }).each(function(){
        $(this).css('font-weight', 700);
    });
}

/**************************************************************************
 *      
 *                       Helper functions
 *
 **************************************************************************/

function log(s, c = "black"){
    console.log("%c " + s, "color: " + c);
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// Credit to Michael Jenkins for this one.
// https://github.com/jangins101/
function addDoubleClick(el, btn) {
    $("#" + el).dblclick(function() {  $("#" + btn).click(); });
}

// Credit to Michael Jenkins for this one.
// https://github.com/jangins101/

function addContextMenu(el, title, uri) {

//addContextMenu("availableserversslprofiles", "SSL Profile Config", "/tmui/Control/jspmap/tmui/locallb/profile/serverssl/properties.jsp?name=");

//var m = "clicked: " + key + " on " + $(this).text();
//            window.console && console.log(m) || alert(m); 

    $("#" + el).contextMenu({
        selector: 'option', 
        callback: function(key, options) {
            window.location = "https://" + window.location.host + uri + $(this).text().trim();
            console.log("https://" + window.location.host + uri + $(this).text())
        },
        items: {
            "Open": {name: "Open"},
            "OpenNew": {name: "Open (New window)"}
        }
    });
    
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

//Get a cookie value. Used to get the current partition
//Shamelessly stolen from https://gist.github.com/thoov/984751

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
function setCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie(name) {
    setCookie(name,"",-1);
}

function replaceCookie(name, value, days){
    deleteCookie(name);
    setCookie(name, value, days);
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

//Tests if browser uri contains string
function uriContains(s) {
    "use strict";
    var uri = (document.location.pathname + document.location.search);
    return uri.indexOf(s) >= 0;
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

function initiateBaloon(){!function(t){"use strict";function e(){this.initialize.apply(this,arguments)}function o(o,i,s){function a(t,e,o,i,n){var s=Math.round(i/1.7320508);e.inactive()["setBorder"+o.camel.pos.f](i)["setBorder"+o.camel.pos.c1](s)["setBorder"+o.camel.pos.c2](s)["set"+o.camel.pos.p1](o.isTopLeft?-i:t.inner[o.size.p])["set"+o.camel.pos.c1](t.inner[o.size.c]/2-s).active().$.css("border-"+o.pos.f+"-color",n)}i.stop(!0,!0);var r,l,p={position:"absolute",height:"0",width:"0",border:"solid 0 transparent"},c=new e(o),d=new e(i);if(d.setTop(-s.offsetY+(s.position&&s.position.indexOf("top")>=0?c.top-d.height:s.position&&s.position.indexOf("bottom")>=0?c.bottom:c.center.top-d.height/2)),d.setLeft(s.offsetX+(s.position&&s.position.indexOf("left")>=0?c.left-d.width:s.position&&s.position.indexOf("right")>=0?c.right:c.center.left-d.width/2)),s.tipSize>0){i.data("outerTip")&&(i.data("outerTip").remove(),i.removeData("outerTip")),i.data("innerTip")&&(i.data("innerTip").remove(),i.removeData("innerTip")),r=new e(t("<div>").css(p).appendTo(i)),l=new e(t("<div>").css(p).appendTo(i));for(var h,u=0;u<n.pos.length;u++){if(h=n.getRelativeNames(u),d.center[h.pos.c1]>=c[h.pos.c1]&&d.center[h.pos.c1]<=c[h.pos.c2])if(u%2==0){if(d[h.pos.o]>=c[h.pos.o]&&d[h.pos.f]>=c[h.pos.f])break}else if(d[h.pos.o]<=c[h.pos.o]&&d[h.pos.f]<=c[h.pos.f])break;h=null}h?(d["set"+h.camel.pos.p1](d[h.pos.p1]+(h.isTopLeft?1:-1)*(s.tipSize-d["border"+h.camel.pos.o])),a(d,r,h,s.tipSize,i.css("border-"+h.pos.o+"-color")),a(d,l,h,s.tipSize-2*d["border"+h.camel.pos.o],i.css("background-color")),i.data("outerTip",r.$).data("innerTip",l.$)):t.each([r.$,l.$],function(){this.remove()})}}function i(e,o){var i=e.data("balloon")&&e.data("balloon").get(0);return!(i&&(i===o.relatedTarget||t.contains(i,o.relatedTarget)))}var n={};n.pos=t.extend(["top","bottom","left","right"],{camel:["Top","Bottom","Left","Right"]}),n.size=t.extend(["height","width"],{camel:["Height","Width"]}),n.getRelativeNames=function(t){var e={pos:{o:t,f:t%2==0?t+1:t-1,p1:t%2==0?t:t-1,p2:t%2==0?t+1:t,c1:t<2?2:0,c2:t<2?3:1},size:{p:t<2?0:1,c:t<2?1:0}},o={};for(var i in e){o[i]||(o[i]={});for(var s in e[i])o[i][s]=n[i][e[i][s]],o.camel||(o.camel={}),o.camel[i]||(o.camel[i]={}),o.camel[i][s]=n[i].camel[e[i][s]]}return o.isTopLeft=o.pos.o===o.pos.p1,o},function(){function o(t,e){if(null==e)return o(t,!0),o(t,!1);var i=n.getRelativeNames(e?0:2);return t[i.size.p]=t.$["outer"+i.camel.size.p](),t[i.pos.f]=t[i.pos.o]+t[i.size.p],t.center[i.pos.o]=t[i.pos.o]+t[i.size.p]/2,t.inner[i.pos.o]=t[i.pos.o]+t["border"+i.camel.pos.o],t.inner[i.size.p]=t.$["inner"+i.camel.size.p](),t.inner[i.pos.f]=t.inner[i.pos.o]+t.inner[i.size.p],t.inner.center[i.pos.o]=t.inner[i.pos.f]+t.inner[i.size.p]/2,t}var i={setBorder:function(t,e){return function(i){return this.$.css("border-"+t.toLowerCase()+"-width",i+"px"),this["border"+t]=i,this.isActive?o(this,e):this}},setPosition:function(t,e){return function(i){return this.$.css(t.toLowerCase(),i+"px"),this[t.toLowerCase()]=i,this.isActive?o(this,e):this}}};e.prototype={initialize:function(e){this.$=e,t.extend(!0,this,this.$.offset(),{center:{},inner:{center:{}}});for(var o=0;o<n.pos.length;o++)this["border"+n.pos.camel[o]]=parseInt(this.$.css("border-"+n.pos[o]+"-width"))||0;this.active()},active:function(){return this.isActive=!0,o(this),this},inactive:function(){return this.isActive=!1,this}};for(var s=0;s<n.pos.length;s++)e.prototype["setBorder"+n.pos.camel[s]]=i.setBorder(n.pos.camel[s],s<2),s%2==0&&(e.prototype["set"+n.pos.camel[s]]=i.setPosition(n.pos.camel[s],s<2))}(),t.fn.balloon=function(e){return this.one("mouseenter",function o(n){var s=t(this),a=this,r=s.off("mouseenter",o).showBalloon(e).on("mouseenter",function(t){i(s,t)&&s.showBalloon()}).data("balloon");r&&r.on("mouseleave",function(e){a===e.relatedTarget||t.contains(a,e.relatedTarget)||s.hideBalloon()}).on("mouseenter",function(e){a===e.relatedTarget||t.contains(a,e.relatedTarget)||(r.stop(!0,!0),s.showBalloon())})}).on("mouseleave",function(e){var o=t(this);i(o,e)&&o.hideBalloon()})},t.fn.showBalloon=function(e){var i,n;return!e&&this.data("options")||(null===t.balloon.defaults.css&&(t.balloon.defaults.css={}),this.data("options",t.extend(!0,{},t.balloon.defaults,e||{}))),e=this.data("options"),this.each(function(){var s,a;s=!(i=t(this)).data("balloon"),n=i.data("balloon")||t("<div>"),!s&&n.data("active")||(n.data("active",!0),clearTimeout(i.data("minLifetime")),a=t.isFunction(e.contents)?e.contents.apply(this):e.contents||(e.contents=i.attr("title")||i.attr("alt")),n.append(a),(e.url||""!==n.html())&&(s||a===n.html()||n.empty().append(a),i.removeAttr("title"),e.url&&n.load(t.isFunction(e.url)?e.url(this):e.url,function(t,s,a){e.ajaxComplete&&e.ajaxComplete(t,s,a),o(i,n,e)}),s?(n.addClass(e.classname).css(e.css||{}).css({visibility:"hidden",position:"absolute"}).appendTo("body"),i.data("balloon",n),o(i,n,e),n.hide().css("visibility","visible")):o(i,n,e),i.data("delay",setTimeout(function(){e.showAnimation?e.showAnimation.apply(n.stop(!0,!0),[e.showDuration,function(){e.showComplete&&e.showComplete.apply(n)}]):n.show(e.showDuration,function(){this.style.removeAttribute&&this.style.removeAttribute("filter"),e.showComplete&&e.showComplete.apply(n)}),e.maxLifetime&&(clearTimeout(i.data("maxLifetime")),i.data("maxLifetime",setTimeout(function(){i.hideBalloon()},e.maxLifetime)))},e.delay))))})},t.fn.hideBalloon=function(){var e=this.data("options");return this.data("balloon")?this.each(function(){var o=t(this);clearTimeout(o.data("delay")),clearTimeout(o.data("minLifetime")),o.data("minLifetime",setTimeout(function(){var i=o.data("balloon");e.hideAnimation?e.hideAnimation.apply(i.stop(!0,!0),[e.hideDuration,function(o){t(this).data("active",!1),e.hideComplete&&e.hideComplete(o)}]):i.stop(!0,!0).hide(e.hideDuration,function(o){t(this).data("active",!1),e.hideComplete&&e.hideComplete(o)})},e.minLifetime))}):this},t.balloon={defaults:{contents:null,url:null,ajaxComplete:null,classname:null,position:"top",offsetX:0,offsetY:0,tipSize:12,delay:0,minLifetime:200,maxLifetime:0,showDuration:100,showAnimation:null,hideDuration:80,hideAnimation:function(t,e){this.fadeOut(t,e)},showComplete:null,hideComplete:null,css:{minWidth:"20px",padding:"5px",borderRadius:"6px",border:"solid 1px #777",boxShadow:"4px 4px 4px #555",color:"#666",backgroundColor:"#efefef",opacity:"0.85",zIndex:"32767",textAlign:"left"}}}}(jQuery)}

/**
 * jQuery contextMenu v@VERSION - Plugin for simple contextMenu handling
 *
 * Version: v@VERSION
 *
 * Authors: Björn Brala (SWIS.nl), Rodney Rehm, Addy Osmani (patches for FF)
 * Web: http://swisnl.github.io/jQuery-contextMenu/
 *
 * Copyright (c) 2011-@YEAR SWIS BV and contributors
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 * Date: @DATE
 */

function initiateContextMenu(){

contextCss = `/*!
 * jQuery contextMenu - Plugin for simple contextMenu handling
 *
 * Version: v@VERSION
 *
 * Authors: Björn Brala (SWIS.nl), Rodney Rehm, Addy Osmani (patches for FF)
 * Web: http://swisnl.github.io/jQuery-contextMenu/
 *
 * Copyright (c) 2011-@YEAR SWIS BV and contributors
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 * Date: @DATE
 */
@import "variables";
@import "icons/mixins";
@import "icons";

.context-menu-icon {
  @include base-context-menu-icon;

  &.context-menu-hover:before {
    color: $context-menu-icon-color-hover;
  }
  &.context-menu-disabled::before {
    color: $context-menu-text-color-disabled;
  }

  &.context-menu-icon-loading:before {
    animation: cm-spin 2s infinite;
  }

  &.context-menu-icon--fa {
    display: list-item;
    font-family: inherit;

    @include base-context-menu-icon(FontAwesome);

    &.context-menu-hover:before {
      color: $context-menu-icon-color-hover;
    }
    &.context-menu-disabled::before {
      color: $context-menu-text-color-disabled;
    }
  }
}

.context-menu-list {
  background: $context-menu-background-color;
  border: $context-menu-border-width $context-menu-border-style $context-menu-border-color;
  border-radius: $context-menu-border-radius;
  box-shadow: $context-menu-box-shadow;
  display: inline-block;
  font-family: $context-menu-font-family;
  font-size: $context-menu-font-size;
  list-style-type: none;
  margin: $context-menu-container-margin;
  max-width: $context-menu-max-width;
  min-width: $context-menu-min-width;
  padding: $context-menu-container-padding;
  position: absolute;
}

.context-menu-item {
  background-color: $context-menu-background-color;
  color: $context-menu-text-color;
  padding: $context-menu-item-padding;
  position: relative;
  user-select: none;
}

.context-menu-separator {
  border-bottom: $context-menu-separator-height $context-menu-separator-style $context-menu-separator-color;
  margin: $context-menu-separator-margin;
  padding: 0;
}

.context-menu-item > label > input,
.context-menu-item > label > textarea {
  user-select: text;
}

.context-menu-item.context-menu-hover {
  background-color: $context-menu-item-color-hover;
  color: $context-menu-text-color-hover;
  cursor: pointer;
}

.context-menu-item.context-menu-disabled {
  background-color: $context-menu-item-color-disabled;
  color: $context-menu-text-color-disabled;
  cursor: default;
}

.context-menu-input.context-menu-hover {
  cursor: default;
  color: $context-menu-text-color;
}

.context-menu-submenu:after {
  content: '';
  border-style: solid;
  border-width: .25em 0 .25em .25em;
  border-color: transparent transparent transparent $context-menu-submenu-arrow-color;
  height: 0;
  position: absolute;
  right: .5em;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  z-index: 1;
}

/**
 * Inputs
 */
.context-menu-item.context-menu-input {
  padding: .3em .6em;
}

/* vertically align inside labels */
.context-menu-input > label > * {
  vertical-align: top;
}

/* position checkboxes and radios as icons */
.context-menu-input > label > input[type="checkbox"],
.context-menu-input > label > input[type="radio"] {
  margin-right: .4em;
  position: relative;
  top: .12em;
}

.context-menu-input > label {
  margin: 0;
}

.context-menu-input > label,
.context-menu-input > label > input[type="text"],
.context-menu-input > label > textarea,
.context-menu-input > label > select {
  box-sizing: border-box;
  display: block;
  width: 100%;
}

.context-menu-input > label > textarea {
  height: 7em;
}

.context-menu-item > .context-menu-list {
  display: none;
  /* re-positioned by js */
  right: -.3em;
  top: .3em;
}

.context-menu-item.context-menu-visible > .context-menu-list {
  display: block;
}

.context-menu-accesskey {
  text-decoration: underline;
}`

addGlobalStyle(contextCss);

    // jscs:disable
    /* jshint ignore:start */
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD. Register as anonymous module.
            define(['jquery'], factory);
        } else if (typeof exports === 'object') {
            // Node / CommonJS
            factory(require('jquery'));
        } else {
            // Browser globals.
            factory(jQuery);
        }
    })(function ($) {

        'use strict';

        // TODO: -
        // ARIA stuff: menuitem, menuitemcheckbox und menuitemradio
        // create <menu> structure if $.support[htmlCommand || htmlMenuitem] and !opt.disableNative

        // determine html5 compatibility
        $.support.htmlMenuitem = ('HTMLMenuItemElement' in window);
        $.support.htmlCommand = ('HTMLCommandElement' in window);
        $.support.eventSelectstart = ('onselectstart' in document.documentElement);
        /* // should the need arise, test for css user-select
         $.support.cssUserSelect = (function(){
         var t = false,
         e = document.createElement('div');

         $.each('Moz|Webkit|Khtml|O|ms|Icab|'.split('|'), function(i, prefix) {
         var propCC = prefix + (prefix ? 'U' : 'u') + 'serSelect',
         prop = (prefix ? ('-' + prefix.toLowerCase() + '-') : '') + 'user-select';

         e.style.cssText = prop + ': text;';
         if (e.style[propCC] == 'text') {
         t = true;
         return false;
         }

         return true;
         });

         return t;
         })();
         */


        if (!$.ui || !$.widget) {
            // duck punch $.cleanData like jQueryUI does to get that remove event
            $.cleanData = (function (orig) {
                return function (elems) {
                    var events, elem, i;
                    for (i = 0; elems[i] != null; i++) {
                        elem = elems[i];
                        try {
                            // Only trigger remove when necessary to save time
                            events = $._data(elem, 'events');
                            if (events && events.remove) {
                                $(elem).triggerHandler('remove');
                            }

                            // Http://bugs.jquery.com/ticket/8235
                        } catch (e) {
                        }
                    }
                    orig(elems);
                };
            })($.cleanData);
        }
        /* jshint ignore:end */
        // jscs:enable

        var // currently active contextMenu trigger
            $currentTrigger = null,
            // is contextMenu initialized with at least one menu?
            initialized = false,
            // window handle
            $win = $(window),
            // number of registered menus
            counter = 0,
            // mapping selector to namespace
            namespaces = {},
            // mapping namespace to options
            menus = {},
            // custom command type handlers
            types = {},
            // default values
            defaults = {
                // selector of contextMenu trigger
                selector: null,
                // where to append the menu to
                appendTo: null,
                // method to trigger context menu ["right", "left", "hover"]
                trigger: 'right',
                // hide menu when mouse leaves trigger / menu elements
                autoHide: false,
                // ms to wait before showing a hover-triggered context menu
                delay: 200,
                // flag denoting if a second trigger should simply move (true) or rebuild (false) an open menu
                // as long as the trigger happened on one of the trigger-element's child nodes
                reposition: true,
                // Flag denoting if a second trigger should close the menu, as long as 
                // the trigger happened on one of the trigger-element's child nodes.
                // This overrides the reposition option.
                hideOnSecondTrigger: false,

                //ability to select submenu
                selectableSubMenu: false,

                // Default classname configuration to be able avoid conflicts in frameworks
                classNames: {
                    hover: 'context-menu-hover', // Item hover
                    disabled: 'context-menu-disabled', // Item disabled
                    visible: 'context-menu-visible', // Item visible
                    notSelectable: 'context-menu-not-selectable', // Item not selectable

                    icon: 'context-menu-icon',
                    iconEdit: 'context-menu-icon-edit',
                    iconCut: 'context-menu-icon-cut',
                    iconCopy: 'context-menu-icon-copy',
                    iconPaste: 'context-menu-icon-paste',
                    iconDelete: 'context-menu-icon-delete',
                    iconAdd: 'context-menu-icon-add',
                    iconQuit: 'context-menu-icon-quit',
                    iconLoadingClass: 'context-menu-icon-loading'
                },

                // determine position to show menu at
                determinePosition: function ($menu) {
                    // position to the lower middle of the trigger element
                    if ($.ui && $.ui.position) {
                        // .position() is provided as a jQuery UI utility
                        // (...and it won't work on hidden elements)
                        $menu.css('display', 'block').position({
                            my: 'center top',
                            at: 'center bottom',
                            of: this,
                            offset: '0 5',
                            collision: 'fit'
                        }).css('display', 'none');
                    } else {
                        // determine contextMenu position
                        var offset = this.offset();
                        offset.top += this.outerHeight();
                        offset.left += this.outerWidth() / 2 - $menu.outerWidth() / 2;
                        $menu.css(offset);
                    }
                },
                // position menu
                position: function (opt, x, y) {
                    var offset;
                    // determine contextMenu position
                    if (!x && !y) {
                        opt.determinePosition.call(this, opt.$menu);
                        return;
                    } else if (x === 'maintain' && y === 'maintain') {
                        // x and y must not be changed (after re-show on command click)
                        offset = opt.$menu.position();
                    } else {
                        // x and y are given (by mouse event)
                        var offsetParentOffset = opt.$menu.offsetParent().offset();
                        offset = {top: y - offsetParentOffset.top, left: x -offsetParentOffset.left};
                    }

                    // correct offset if viewport demands it
                    var bottom = $win.scrollTop() + $win.height(),
                        right = $win.scrollLeft() + $win.width(),
                        height = opt.$menu.outerHeight(),
                        width = opt.$menu.outerWidth();

                    if (offset.top + height > bottom) {
                        offset.top -= height;
                    }

                    if (offset.top < 0) {
                        offset.top = 0;
                    }

                    if (offset.left + width > right) {
                        offset.left -= width;
                    }

                    if (offset.left < 0) {
                        offset.left = 0;
                    }

                    opt.$menu.css(offset);
                },
                // position the sub-menu
                positionSubmenu: function ($menu) {
                    if (typeof $menu === 'undefined') {
                        // When user hovers over item (which has sub items) handle.focusItem will call this.
                        // but the submenu does not exist yet if opt.items is a promise. just return, will
                        // call positionSubmenu after promise is completed.
                        return;
                    }
                    if ($.ui && $.ui.position) {
                        // .position() is provided as a jQuery UI utility
                        // (...and it won't work on hidden elements)
                        $menu.css('display', 'block').position({
                            my: 'left top-5',
                            at: 'right top',
                            of: this,
                            collision: 'flipfit fit'
                        }).css('display', '');
                    } else {
                        // determine contextMenu position
                        var offset = {
                            top: -9,
                            left: this.outerWidth() - 5
                        };
                        $menu.css(offset);
                    }
                },
                // offset to add to zIndex
                zIndex: 1,
                // show hide animation settings
                animation: {
                    duration: 50,
                    show: 'slideDown',
                    hide: 'slideUp'
                },
                // events
                events: {
                    show: $.noop,
                    hide: $.noop,
                    activated: $.noop
                },
                // default callback
                callback: null,
                // list of contextMenu items
                items: {}
            },
            // mouse position for hover activation
            hoveract = {
                timer: null,
                pageX: null,
                pageY: null
            },
            // determine zIndex
            zindex = function ($t) {
                var zin = 0,
                    $tt = $t;

                while (true) {
                    zin = Math.max(zin, parseInt($tt.css('z-index'), 10) || 0);
                    $tt = $tt.parent();
                    if (!$tt || !$tt.length || 'html body'.indexOf($tt.prop('nodeName').toLowerCase()) > -1) {
                        break;
                    }
                }
                return zin;
            },
            // event handlers
            handle = {
                // abort anything
                abortevent: function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                },
                // contextmenu show dispatcher
                contextmenu: function (e) {
                    var $this = $(this);

                    // disable actual context-menu if we are using the right mouse button as the trigger
                    if (e.data.trigger === 'right') {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }

                    // abort native-triggered events unless we're triggering on right click
                    if ((e.data.trigger !== 'right' && e.data.trigger !== 'demand') && e.originalEvent) {
                        return;
                    }

                    // Let the current contextmenu decide if it should show or not based on its own trigger settings
                    if (typeof e.mouseButton !== 'undefined' && e.data) {
                        if (!(e.data.trigger === 'left' && e.mouseButton === 0) && !(e.data.trigger === 'right' && e.mouseButton === 2)) {
                            // Mouse click is not valid.
                            return;
                        }
                    }

                    // abort event if menu is visible for this trigger
                    if ($this.hasClass('context-menu-active')) {
                        return;
                    }

                    if (!$this.hasClass('context-menu-disabled')) {
                        // theoretically need to fire a show event at <menu>
                        // http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#context-menus
                        // var evt = jQuery.Event("show", { data: data, pageX: e.pageX, pageY: e.pageY, relatedTarget: this });
                        // e.data.$menu.trigger(evt);

                        $currentTrigger = $this;
                        if (e.data.build) {
                            var built = e.data.build($currentTrigger, e);
                            // abort if build() returned false
                            if (built === false) {
                                return;
                            }

                            // dynamically build menu on invocation
                            e.data = $.extend(true, {}, defaults, e.data, built || {});

                            // abort if there are no items to display
                            if (!e.data.items || $.isEmptyObject(e.data.items)) {
                                // Note: jQuery captures and ignores errors from event handlers
                                if (window.console) {
                                    (console.error || console.log).call(console, 'No items specified to show in contextMenu');
                                }

                                throw new Error('No Items specified');
                            }

                            // backreference for custom command type creation
                            e.data.$trigger = $currentTrigger;

                            op.create(e.data);
                        }
                        var showMenu = false;
                        for (var item in e.data.items) {
                            if (e.data.items.hasOwnProperty(item)) {
                                var visible;
                                if ($.isFunction(e.data.items[item].visible)) {
                                    visible = e.data.items[item].visible.call($(e.currentTarget), item, e.data);
                                } else if (typeof e.data.items[item] !== 'undefined' && e.data.items[item].visible) {
                                    visible = e.data.items[item].visible === true;
                                } else {
                                    visible = true;
                                }
                                if (visible) {
                                    showMenu = true;
                                }
                            }
                        }
                        if (showMenu) {
                            // show menu
                            op.show.call($this, e.data, e.pageX, e.pageY);
                        }
                    }
                },
                // contextMenu left-click trigger
                click: function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    $(this).trigger($.Event('contextmenu', {data: e.data, pageX: e.pageX, pageY: e.pageY}));
                },
                // contextMenu right-click trigger
                mousedown: function (e) {
                    // register mouse down
                    var $this = $(this);

                    // hide any previous menus
                    if ($currentTrigger && $currentTrigger.length && !$currentTrigger.is($this)) {
                        $currentTrigger.data('contextMenu').$menu.trigger('contextmenu:hide');
                    }

                    // activate on right click
                    if (e.button === 2) {
                        $currentTrigger = $this.data('contextMenuActive', true);
                    }
                },
                // contextMenu right-click trigger
                mouseup: function (e) {
                    // show menu
                    var $this = $(this);
                    if ($this.data('contextMenuActive') && $currentTrigger && $currentTrigger.length && $currentTrigger.is($this) && !$this.hasClass('context-menu-disabled')) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        $currentTrigger = $this;
                        $this.trigger($.Event('contextmenu', {data: e.data, pageX: e.pageX, pageY: e.pageY}));
                    }

                    $this.removeData('contextMenuActive');
                },
                // contextMenu hover trigger
                mouseenter: function (e) {
                    var $this = $(this),
                        $related = $(e.relatedTarget),
                        $document = $(document);

                    // abort if we're coming from a menu
                    if ($related.is('.context-menu-list') || $related.closest('.context-menu-list').length) {
                        return;
                    }

                    // abort if a menu is shown
                    if ($currentTrigger && $currentTrigger.length) {
                        return;
                    }

                    hoveract.pageX = e.pageX;
                    hoveract.pageY = e.pageY;
                    hoveract.data = e.data;
                    $document.on('mousemove.contextMenuShow', handle.mousemove);
                    hoveract.timer = setTimeout(function () {
                        hoveract.timer = null;
                        $document.off('mousemove.contextMenuShow');
                        $currentTrigger = $this;
                        $this.trigger($.Event('contextmenu', {
                            data: hoveract.data,
                            pageX: hoveract.pageX,
                            pageY: hoveract.pageY
                        }));
                    }, e.data.delay);
                },
                // contextMenu hover trigger
                mousemove: function (e) {
                    hoveract.pageX = e.pageX;
                    hoveract.pageY = e.pageY;
                },
                // contextMenu hover trigger
                mouseleave: function (e) {
                    // abort if we're leaving for a menu
                    var $related = $(e.relatedTarget);
                    if ($related.is('.context-menu-list') || $related.closest('.context-menu-list').length) {
                        return;
                    }

                    try {
                        clearTimeout(hoveract.timer);
                    } catch (e) {
                    }

                    hoveract.timer = null;
                },
                // click on layer to hide contextMenu
                layerClick: function (e) {
                    var $this = $(this),
                        root = $this.data('contextMenuRoot'),
                        button = e.button,
                        x = e.pageX,
                        y = e.pageY,
                        target,
                        offset;

                    e.preventDefault();

                    setTimeout(function () {
                        var $window;
                        var triggerAction = ((root.trigger === 'left' && button === 0) || (root.trigger === 'right' && button === 2));

                        // find the element that would've been clicked, wasn't the layer in the way
                        if (document.elementFromPoint && root.$layer) {
                            root.$layer.hide();
                            target = document.elementFromPoint(x - $win.scrollLeft(), y - $win.scrollTop());

                            // also need to try and focus this element if we're in a contenteditable area,
                            // as the layer will prevent the browser mouse action we want
                            if (target.isContentEditable) {
                                var range = document.createRange(),
                                    sel = window.getSelection();
                                range.selectNode(target);
                                range.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                            $(target).trigger(e);
                            root.$layer.show();
                        }
                        
                        if (root.hideOnSecondTrigger && triggerAction && root.$menu !== null && typeof root.$menu !== 'undefined') {
                          root.$menu.trigger('contextmenu:hide');
                          return;
                        }
                        
                        if (root.reposition && triggerAction) {
                            if (document.elementFromPoint) {
                                if (root.$trigger.is(target)) {
                                    root.position.call(root.$trigger, root, x, y);
                                    return;
                                }
                            } else {
                                offset = root.$trigger.offset();
                                $window = $(window);
                                // while this looks kinda awful, it's the best way to avoid
                                // unnecessarily calculating any positions
                                offset.top += $window.scrollTop();
                                if (offset.top <= e.pageY) {
                                    offset.left += $window.scrollLeft();
                                    if (offset.left <= e.pageX) {
                                        offset.bottom = offset.top + root.$trigger.outerHeight();
                                        if (offset.bottom >= e.pageY) {
                                            offset.right = offset.left + root.$trigger.outerWidth();
                                            if (offset.right >= e.pageX) {
                                                // reposition
                                                root.position.call(root.$trigger, root, x, y);
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (target && triggerAction) {
                            root.$trigger.one('contextmenu:hidden', function () {
                                $(target).contextMenu({x: x, y: y, button: button});
                            });
                        }

                        if (root !== null && typeof root !== 'undefined' && root.$menu !== null  && typeof root.$menu !== 'undefined') {
                            root.$menu.trigger('contextmenu:hide');
                        }
                    }, 50);
                },
                // key handled :hover
                keyStop: function (e, opt) {
                    if (!opt.isInput) {
                        e.preventDefault();
                    }

                    e.stopPropagation();
                },
                key: function (e) {

                    var opt = {};

                    // Only get the data from $currentTrigger if it exists
                    if ($currentTrigger) {
                        opt = $currentTrigger.data('contextMenu') || {};
                    }
                    // If the trigger happen on a element that are above the contextmenu do this
                    if (typeof opt.zIndex === 'undefined') {
                        opt.zIndex = 0;
                    }
                    var targetZIndex = 0;
                    var getZIndexOfTriggerTarget = function (target) {
                        if (target.style.zIndex !== '') {
                            targetZIndex = target.style.zIndex;
                        } else {
                            if (target.offsetParent !== null && typeof target.offsetParent !== 'undefined') {
                                getZIndexOfTriggerTarget(target.offsetParent);
                            }
                            else if (target.parentElement !== null && typeof target.parentElement !== 'undefined') {
                                getZIndexOfTriggerTarget(target.parentElement);
                            }
                        }
                    };
                    getZIndexOfTriggerTarget(e.target);
                    // If targetZIndex is heigher then opt.zIndex dont progress any futher.
                    // This is used to make sure that if you are using a dialog with a input / textarea / contenteditable div
                    // and its above the contextmenu it wont steal keys events
                    if (opt.$menu && parseInt(targetZIndex,10) > parseInt(opt.$menu.css("zIndex"),10)) {
                        return;
                    }
                    switch (e.keyCode) {
                        case 9:
                        case 38: // up
                            handle.keyStop(e, opt);
                            // if keyCode is [38 (up)] or [9 (tab) with shift]
                            if (opt.isInput) {
                                if (e.keyCode === 9 && e.shiftKey) {
                                    e.preventDefault();
                                    if (opt.$selected) {
                                        opt.$selected.find('input, textarea, select').blur();
                                    }
                                    if (opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                        opt.$menu.trigger('prevcommand');
                                    }
                                    return;
                                } else if (e.keyCode === 38 && opt.$selected.find('input, textarea, select').prop('type') === 'checkbox') {
                                    // checkboxes don't capture this key
                                    e.preventDefault();
                                    return;
                                }
                            } else if (e.keyCode !== 9 || e.shiftKey) {
                                if (opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                    opt.$menu.trigger('prevcommand');
                                }
                                return;
                            }
                            break;
                        // omitting break;
                        // case 9: // tab - reached through omitted break;
                        case 40: // down
                            handle.keyStop(e, opt);
                            if (opt.isInput) {
                                if (e.keyCode === 9) {
                                    e.preventDefault();
                                    if (opt.$selected) {
                                        opt.$selected.find('input, textarea, select').blur();
                                    }
                                    if (opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                        opt.$menu.trigger('nextcommand');
                                    }
                                    return;
                                } else if (e.keyCode === 40 && opt.$selected.find('input, textarea, select').prop('type') === 'checkbox') {
                                    // checkboxes don't capture this key
                                    e.preventDefault();
                                    return;
                                }
                            } else {
                                if (opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                    opt.$menu.trigger('nextcommand');
                                }
                                return;
                            }
                            break;

                        case 37: // left
                            handle.keyStop(e, opt);
                            if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                                break;
                            }

                            if (!opt.$selected.parent().hasClass('context-menu-root')) {
                                var $parent = opt.$selected.parent().parent();
                                opt.$selected.trigger('contextmenu:blur');
                                opt.$selected = $parent;
                                return;
                            }
                            break;

                        case 39: // right
                            handle.keyStop(e, opt);
                            if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                                break;
                            }

                            var itemdata = opt.$selected.data('contextMenu') || {};
                            if (itemdata.$menu && opt.$selected.hasClass('context-menu-submenu')) {
                                opt.$selected = null;
                                itemdata.$selected = null;
                                itemdata.$menu.trigger('nextcommand');
                                return;
                            }
                            break;

                        case 35: // end
                        case 36: // home
                            if (opt.$selected && opt.$selected.find('input, textarea, select').length) {
                                return;
                            } else {
                                (opt.$selected && opt.$selected.parent() || opt.$menu)
                                    .children(':not(.' + opt.classNames.disabled + ', .' + opt.classNames.notSelectable + ')')[e.keyCode === 36 ? 'first' : 'last']()
                                    .trigger('contextmenu:focus');
                                e.preventDefault();
                                return;
                            }
                            break;

                        case 13: // enter
                            handle.keyStop(e, opt);
                            if (opt.isInput) {
                                if (opt.$selected && !opt.$selected.is('textarea, select')) {
                                    e.preventDefault();
                                    return;
                                }
                                break;
                            }
                            if (typeof opt.$selected !== 'undefined' && opt.$selected !== null) {
                                opt.$selected.trigger('mouseup');
                            }
                            return;

                        case 32: // space
                        case 33: // page up
                        case 34: // page down
                            // prevent browser from scrolling down while menu is visible
                            handle.keyStop(e, opt);
                            return;

                        case 27: // esc
                            handle.keyStop(e, opt);
                            if (opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                opt.$menu.trigger('contextmenu:hide');
                            }
                            return;

                        default: // 0-9, a-z
                            var k = (String.fromCharCode(e.keyCode)).toUpperCase();
                            if (opt.accesskeys && opt.accesskeys[k]) {
                                // according to the specs accesskeys must be invoked immediately
                                opt.accesskeys[k].$node.trigger(opt.accesskeys[k].$menu ? 'contextmenu:focus' : 'mouseup');
                                return;
                            }
                            break;
                    }
                    // pass event to selected item,
                    // stop propagation to avoid endless recursion
                    e.stopPropagation();
                    if (typeof opt.$selected !== 'undefined' && opt.$selected !== null) {
                        opt.$selected.trigger(e);
                    }
                },
                // select previous possible command in menu
                prevItem: function (e) {
                    e.stopPropagation();
                    var opt = $(this).data('contextMenu') || {};
                    var root = $(this).data('contextMenuRoot') || {};

                    // obtain currently selected menu
                    if (opt.$selected) {
                        var $s = opt.$selected;
                        opt = opt.$selected.parent().data('contextMenu') || {};
                        opt.$selected = $s;
                    }

                    var $children = opt.$menu.children(),
                        $prev = !opt.$selected || !opt.$selected.prev().length ? $children.last() : opt.$selected.prev(),
                        $round = $prev;

                    // skip disabled or hidden elements
                    while ($prev.hasClass(root.classNames.disabled) || $prev.hasClass(root.classNames.notSelectable) || $prev.is(':hidden')) {
                        if ($prev.prev().length) {
                            $prev = $prev.prev();
                        } else {
                            $prev = $children.last();
                        }
                        if ($prev.is($round)) {
                            // break endless loop
                            return;
                        }
                    }

                    // leave current
                    if (opt.$selected) {
                        handle.itemMouseleave.call(opt.$selected.get(0), e);
                    }

                    // activate next
                    handle.itemMouseenter.call($prev.get(0), e);

                    // focus input
                    var $input = $prev.find('input, textarea, select');
                    if ($input.length) {
                        $input.focus();
                    }
                },
                // select next possible command in menu
                nextItem: function (e) {
                    e.stopPropagation();
                    var opt = $(this).data('contextMenu') || {};
                    var root = $(this).data('contextMenuRoot') || {};

                    // obtain currently selected menu
                    if (opt.$selected) {
                        var $s = opt.$selected;
                        opt = opt.$selected.parent().data('contextMenu') || {};
                        opt.$selected = $s;
                    }

                    var $children = opt.$menu.children(),
                        $next = !opt.$selected || !opt.$selected.next().length ? $children.first() : opt.$selected.next(),
                        $round = $next;

                    // skip disabled
                    while ($next.hasClass(root.classNames.disabled) || $next.hasClass(root.classNames.notSelectable) || $next.is(':hidden')) {
                        if ($next.next().length) {
                            $next = $next.next();
                        } else {
                            $next = $children.first();
                        }
                        if ($next.is($round)) {
                            // break endless loop
                            return;
                        }
                    }

                    // leave current
                    if (opt.$selected) {
                        handle.itemMouseleave.call(opt.$selected.get(0), e);
                    }

                    // activate next
                    handle.itemMouseenter.call($next.get(0), e);

                    // focus input
                    var $input = $next.find('input, textarea, select');
                    if ($input.length) {
                        $input.focus();
                    }
                },
                // flag that we're inside an input so the key handler can act accordingly
                focusInput: function () {
                    var $this = $(this).closest('.context-menu-item'),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    root.$selected = opt.$selected = $this;
                    root.isInput = opt.isInput = true;
                },
                // flag that we're inside an input so the key handler can act accordingly
                blurInput: function () {
                    var $this = $(this).closest('.context-menu-item'),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    root.isInput = opt.isInput = false;
                },
                // :hover on menu
                menuMouseenter: function () {
                    var root = $(this).data().contextMenuRoot;
                    root.hovering = true;
                },
                // :hover on menu
                menuMouseleave: function (e) {
                    var root = $(this).data().contextMenuRoot;
                    if (root.$layer && root.$layer.is(e.relatedTarget)) {
                        root.hovering = false;
                    }
                },
                // :hover done manually so key handling is possible
                itemMouseenter: function (e) {
                    var $this = $(this),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    root.hovering = true;

                    // abort if we're re-entering
                    if (e && root.$layer && root.$layer.is(e.relatedTarget)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }

                    // make sure only one item is selected
                    (opt.$menu ? opt : root).$menu
                        .children('.' + root.classNames.hover).trigger('contextmenu:blur')
                        .children('.hover').trigger('contextmenu:blur');

                    if ($this.hasClass(root.classNames.disabled) || $this.hasClass(root.classNames.notSelectable)) {
                        opt.$selected = null;
                        return;
                    }


                    $this.trigger('contextmenu:focus');
                },
                // :hover done manually so key handling is possible
                itemMouseleave: function (e) {
                    var $this = $(this),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    if (root !== opt && root.$layer && root.$layer.is(e.relatedTarget)) {
                        if (typeof root.$selected !== 'undefined' && root.$selected !== null) {
                            root.$selected.trigger('contextmenu:blur');
                        }
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        root.$selected = opt.$selected = opt.$node;
                        return;
                    }

                    if(opt && opt.$menu && opt.$menu.hasClass('context-menu-visible')){
                        return;
                    }

                    $this.trigger('contextmenu:blur');
                },
                // contextMenu item click
                itemClick: function (e) {
                    var $this = $(this),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot,
                        key = data.contextMenuKey,
                        callback;

                    // abort if the key is unknown or disabled or is a menu
                    if (!opt.items[key] || $this.is('.' + root.classNames.disabled + ', .context-menu-separator, .' + root.classNames.notSelectable) || ($this.is('.context-menu-submenu') && root.selectableSubMenu === false )) {
                        return;
                    }

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    if ($.isFunction(opt.callbacks[key]) && Object.prototype.hasOwnProperty.call(opt.callbacks, key)) {
                        // item-specific callback
                        callback = opt.callbacks[key];
                    } else if ($.isFunction(root.callback)) {
                        // default callback
                        callback = root.callback;
                    } else {
                        // no callback, no action
                        return;
                    }

                    // hide menu if callback doesn't stop that
                    if (callback.call(root.$trigger, key, root, e) !== false) {
                        root.$menu.trigger('contextmenu:hide');
                    } else if (root.$menu.parent().length) {
                        op.update.call(root.$trigger, root);
                    }
                },
                // ignore click events on input elements
                inputClick: function (e) {
                    e.stopImmediatePropagation();
                },
                // hide <menu>
                hideMenu: function (e, data) {
                    var root = $(this).data('contextMenuRoot');
                    op.hide.call(root.$trigger, root, data && data.force);
                },
                // focus <command>
                focusItem: function (e) {
                    e.stopPropagation();
                    var $this = $(this),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    if ($this.hasClass(root.classNames.disabled) || $this.hasClass(root.classNames.notSelectable)) {
                        return;
                    }

                    $this
                        .addClass([root.classNames.hover, root.classNames.visible].join(' '))
                        // select other items and included items
                        .parent().find('.context-menu-item').not($this)
                        .removeClass(root.classNames.visible)
                        .filter('.' + root.classNames.hover)
                        .trigger('contextmenu:blur');

                    // remember selected
                    opt.$selected = root.$selected = $this;


                    if(opt && opt.$node && opt.$node.hasClass('context-menu-submenu')){
                        opt.$node.addClass(root.classNames.hover);
                    }

                    // position sub-menu - do after show so dumb $.ui.position can keep up
                    if (opt.$node) {
                        root.positionSubmenu.call(opt.$node, opt.$menu);
                    }
                },
                // blur <command>
                blurItem: function (e) {
                    e.stopPropagation();
                    var $this = $(this),
                        data = $this.data(),
                        opt = data.contextMenu,
                        root = data.contextMenuRoot;

                    if (opt.autoHide) { // for tablets and touch screens this needs to remain
                        $this.removeClass(root.classNames.visible);
                    }
                    $this.removeClass(root.classNames.hover);
                    opt.$selected = null;
                }
            },
            // operations
            op = {
                show: function (opt, x, y) {
                    var $trigger = $(this),
                        css = {};

                    // hide any open menus
                    $('#context-menu-layer').trigger('mousedown');

                    // backreference for callbacks
                    opt.$trigger = $trigger;

                    // show event
                    if (opt.events.show.call($trigger, opt) === false) {
                        $currentTrigger = null;
                        return;
                    }

                    // create or update context menu
                    op.update.call($trigger, opt);

                    // position menu
                    opt.position.call($trigger, opt, x, y);

                    // make sure we're in front
                    if (opt.zIndex) {
                        var additionalZValue = opt.zIndex;
                        // If opt.zIndex is a function, call the function to get the right zIndex.
                        if (typeof opt.zIndex === 'function') {
                            additionalZValue = opt.zIndex.call($trigger, opt);
                        }
                        css.zIndex = zindex($trigger) + additionalZValue;
                    }

                    // add layer
                    op.layer.call(opt.$menu, opt, css.zIndex);

                    // adjust sub-menu zIndexes
                    opt.$menu.find('ul').css('zIndex', css.zIndex + 1);

                    // position and show context menu
                    opt.$menu.css(css)[opt.animation.show](opt.animation.duration, function () {
                        $trigger.trigger('contextmenu:visible');
                        
                        op.activated(opt);
                        opt.events.activated();
                    });
                    // make options available and set state
                    $trigger
                        .data('contextMenu', opt)
                        .addClass('context-menu-active');

                    // register key handler
                    $(document).off('keydown.contextMenu').on('keydown.contextMenu', handle.key);
                    // register autoHide handler
                    if (opt.autoHide) {
                        // mouse position handler
                        $(document).on('mousemove.contextMenuAutoHide', function (e) {
                            // need to capture the offset on mousemove,
                            // since the page might've been scrolled since activation
                            var pos = $trigger.offset();
                            pos.right = pos.left + $trigger.outerWidth();
                            pos.bottom = pos.top + $trigger.outerHeight();

                            if (opt.$layer && !opt.hovering && (!(e.pageX >= pos.left && e.pageX <= pos.right) || !(e.pageY >= pos.top && e.pageY <= pos.bottom))) {
                                /* Additional hover check after short time, you might just miss the edge of the menu */
                                setTimeout(function () {
                                    if (!opt.hovering && opt.$menu !== null && typeof opt.$menu !== 'undefined') {
                                        opt.$menu.trigger('contextmenu:hide');
                                    }
                                }, 50);
                            }
                        });
                    }
                },
                hide: function (opt, force) {
                    var $trigger = $(this);
                    if (!opt) {
                        opt = $trigger.data('contextMenu') || {};
                    }

                    // hide event
                    if (!force && opt.events && opt.events.hide.call($trigger, opt) === false) {
                        return;
                    }

                    // remove options and revert state
                    $trigger
                        .removeData('contextMenu')
                        .removeClass('context-menu-active');

                    if (opt.$layer) {
                        // keep layer for a bit so the contextmenu event can be aborted properly by opera
                        setTimeout((function ($layer) {
                            return function () {
                                $layer.remove();
                            };
                        })(opt.$layer), 10);

                        try {
                            delete opt.$layer;
                        } catch (e) {
                            opt.$layer = null;
                        }
                    }

                    // remove handle
                    $currentTrigger = null;
                    // remove selected
                    opt.$menu.find('.' + opt.classNames.hover).trigger('contextmenu:blur');
                    opt.$selected = null;
                    // collapse all submenus
                    opt.$menu.find('.' + opt.classNames.visible).removeClass(opt.classNames.visible);
                    // unregister key and mouse handlers
                    // $(document).off('.contextMenuAutoHide keydown.contextMenu'); // http://bugs.jquery.com/ticket/10705
                    $(document).off('.contextMenuAutoHide').off('keydown.contextMenu');
                    // hide menu
                    if (opt.$menu) {
                        opt.$menu[opt.animation.hide](opt.animation.duration, function () {
                            // tear down dynamically built menu after animation is completed.
                            if (opt.build) {
                                opt.$menu.remove();
                                $.each(opt, function (key) {
                                    switch (key) {
                                        case 'ns':
                                        case 'selector':
                                        case 'build':
                                        case 'trigger':
                                            return true;

                                        default:
                                            opt[key] = undefined;
                                            try {
                                                delete opt[key];
                                            } catch (e) {
                                            }
                                            return true;
                                    }
                                });
                            }

                            setTimeout(function () {
                                $trigger.trigger('contextmenu:hidden');
                            }, 10);
                        });
                    }
                },
                create: function (opt, root) {
                    if (typeof root === 'undefined') {
                        root = opt;
                    }

                    // create contextMenu
                    opt.$menu = $('<ul class="context-menu-list"></ul>').addClass(opt.className || '').data({
                        'contextMenu': opt,
                        'contextMenuRoot': root
                    });

                    $.each(['callbacks', 'commands', 'inputs'], function (i, k) {
                        opt[k] = {};
                        if (!root[k]) {
                            root[k] = {};
                        }
                    });

                    if (!root.accesskeys) {
                        root.accesskeys = {};
                    }

                    function createNameNode(item) {
                        var $name = $('<span></span>');
                        if (item._accesskey) {
                            if (item._beforeAccesskey) {
                                $name.append(document.createTextNode(item._beforeAccesskey));
                            }
                            $('<span></span>')
                                .addClass('context-menu-accesskey')
                                .text(item._accesskey)
                                .appendTo($name);
                            if (item._afterAccesskey) {
                                $name.append(document.createTextNode(item._afterAccesskey));
                            }
                        } else {
                            if (item.isHtmlName) {
                                // restrict use with access keys
                                if (typeof item.accesskey !== 'undefined') {
                                    throw new Error('accesskeys are not compatible with HTML names and cannot be used together in the same item');
                                }
                                $name.html(item.name);
                            } else {
                                $name.text(item.name);
                            }
                        }
                        return $name;
                    }

                    // create contextMenu items
                    $.each(opt.items, function (key, item) {
                        var $t = $('<li class="context-menu-item"></li>').addClass(item.className || ''),
                            $label = null,
                            $input = null;

                        // iOS needs to see a click-event bound to an element to actually
                        // have the TouchEvents infrastructure trigger the click event
                        $t.on('click', $.noop);

                        // Make old school string seperator a real item so checks wont be
                        // akward later.
                        // And normalize 'cm_separator' into 'cm_seperator'.
                        if (typeof item === 'string' || item.type === 'cm_separator') {
                            item = {type: 'cm_seperator'};
                        }

                        item.$node = $t.data({
                            'contextMenu': opt,
                            'contextMenuRoot': root,
                            'contextMenuKey': key
                        });

                        // register accesskey
                        // NOTE: the accesskey attribute should be applicable to any element, but Safari5 and Chrome13 still can't do that
                        if (typeof item.accesskey !== 'undefined') {
                            var aks = splitAccesskey(item.accesskey);
                            for (var i = 0, ak; ak = aks[i]; i++) {
                                if (!root.accesskeys[ak]) {
                                    root.accesskeys[ak] = item;
                                    var matched = item.name.match(new RegExp('^(.*?)(' + ak + ')(.*)$', 'i'));
                                    if (matched) {
                                        item._beforeAccesskey = matched[1];
                                        item._accesskey = matched[2];
                                        item._afterAccesskey = matched[3];
                                    }
                                    break;
                                }
                            }
                        }

                        if (item.type && types[item.type]) {
                            // run custom type handler
                            types[item.type].call($t, item, opt, root);
                            // register commands
                            $.each([opt, root], function (i, k) {
                                k.commands[key] = item;
                                // Overwrite only if undefined or the item is appended to the root. This so it
                                // doesn't overwrite callbacks of root elements if the name is the same.
                                if ($.isFunction(item.callback) && (typeof k.callbacks[key] === 'undefined' || typeof opt.type === 'undefined')) {
                                    k.callbacks[key] = item.callback;
                                }
                            });
                        } else {
                            // add label for input
                            if (item.type === 'cm_seperator') {
                                $t.addClass('context-menu-separator ' + root.classNames.notSelectable);
                            } else if (item.type === 'html') {
                                $t.addClass('context-menu-html ' + root.classNames.notSelectable);
                            } else if (item.type === 'sub') {
                                // We don't want to execute the next else-if if it is a sub.
                            } else if (item.type) {
                                $label = $('<label></label>').appendTo($t);
                                createNameNode(item).appendTo($label);

                                $t.addClass('context-menu-input');
                                opt.hasTypes = true;
                                $.each([opt, root], function (i, k) {
                                    k.commands[key] = item;
                                    k.inputs[key] = item;
                                });
                            } else if (item.items) {
                                item.type = 'sub';
                            }

                            switch (item.type) {
                                case 'cm_seperator':
                                    break;

                                case 'text':
                                    $input = $('<input type="text" value="1" name="" />')
                                        .attr('name', 'context-menu-input-' + key)
                                        .val(item.value || '')
                                        .appendTo($label);
                                    break;

                                case 'textarea':
                                    $input = $('<textarea name=""></textarea>')
                                        .attr('name', 'context-menu-input-' + key)
                                        .val(item.value || '')
                                        .appendTo($label);

                                    if (item.height) {
                                        $input.height(item.height);
                                    }
                                    break;

                                case 'checkbox':
                                    $input = $('<input type="checkbox" value="1" name="" />')
                                        .attr('name', 'context-menu-input-' + key)
                                        .val(item.value || '')
                                        .prop('checked', !!item.selected)
                                        .prependTo($label);
                                    break;

                                case 'radio':
                                    $input = $('<input type="radio" value="1" name="" />')
                                        .attr('name', 'context-menu-input-' + item.radio)
                                        .val(item.value || '')
                                        .prop('checked', !!item.selected)
                                        .prependTo($label);
                                    break;

                                case 'select':
                                    $input = $('<select name=""></select>')
                                        .attr('name', 'context-menu-input-' + key)
                                        .appendTo($label);
                                    if (item.options) {
                                        $.each(item.options, function (value, text) {
                                            $('<option></option>').val(value).text(text).appendTo($input);
                                        });
                                        $input.val(item.selected);
                                    }
                                    break;

                                case 'sub':
                                    createNameNode(item).appendTo($t);
                                    item.appendTo = item.$node;
                                    $t.data('contextMenu', item).addClass('context-menu-submenu');
                                    item.callback = null;

                                    // If item contains items, and this is a promise, we should create it later
                                    // check if subitems is of type promise. If it is a promise we need to create
                                    // it later, after promise has been resolved.
                                    if ('function' === typeof item.items.then) {
                                        // probably a promise, process it, when completed it will create the sub menu's.
                                        op.processPromises(item, root, item.items);
                                    } else {
                                        // normal submenu.
                                        op.create(item, root);
                                    }
                                    break;

                                case 'html':
                                    $(item.html).appendTo($t);
                                    break;

                                default:
                                    $.each([opt, root], function (i, k) {
                                        k.commands[key] = item;
                                        // Overwrite only if undefined or the item is appended to the root. This so it
                                        // doesn't overwrite callbacks of root elements if the name is the same.
                                        if ($.isFunction(item.callback) && (typeof k.callbacks[key] === 'undefined' || typeof opt.type === 'undefined')) {
                                            k.callbacks[key] = item.callback;
                                        }
                                    });
                                    createNameNode(item).appendTo($t);
                                    break;
                            }

                            // disable key listener in <input>
                            if (item.type && item.type !== 'sub' && item.type !== 'html' && item.type !== 'cm_seperator') {
                                $input
                                    .on('focus', handle.focusInput)
                                    .on('blur', handle.blurInput);

                                if (item.events) {
                                    $input.on(item.events, opt);
                                }
                            }

                            // add icons
                            if (item.icon) {
                                if ($.isFunction(item.icon)) {
                                    item._icon = item.icon.call(this, this, $t, key, item);
                                } else {
                                    if (typeof(item.icon) === 'string' && item.icon.substring(0, 3) === 'fa-') {
                                        // to enable font awesome
                                        item._icon = root.classNames.icon + ' ' + root.classNames.icon + '--fa fa ' + item.icon;
                                    } else {
                                        item._icon = root.classNames.icon + ' ' + root.classNames.icon + '-' + item.icon;
                                    }
                                }
                                $t.addClass(item._icon);
                            }
                        }

                        // cache contained elements
                        item.$input = $input;
                        item.$label = $label;

                        // attach item to menu
                        $t.appendTo(opt.$menu);

                        // Disable text selection
                        if (!opt.hasTypes && $.support.eventSelectstart) {
                            // browsers support user-select: none,
                            // IE has a special event for text-selection
                            // browsers supporting neither will not be preventing text-selection
                            $t.on('selectstart.disableTextSelect', handle.abortevent);
                        }
                    });
                    // attach contextMenu to <body> (to bypass any possible overflow:hidden issues on parents of the trigger element)
                    if (!opt.$node) {
                        opt.$menu.css('display', 'none').addClass('context-menu-root');
                    }
                    opt.$menu.appendTo(opt.appendTo || document.body);
                },
                resize: function ($menu, nested) {
                    var domMenu;
                    // determine widths of submenus, as CSS won't grow them automatically
                    // position:absolute within position:absolute; min-width:100; max-width:200; results in width: 100;
                    // kinda sucks hard...

                    // determine width of absolutely positioned element
                    $menu.css({position: 'absolute', display: 'block'});
                    // don't apply yet, because that would break nested elements' widths
                    $menu.data('width',
                        (domMenu = $menu.get(0)).getBoundingClientRect ?
                            Math.ceil(domMenu.getBoundingClientRect().width) :
                            $menu.outerWidth() + 1); // outerWidth() returns rounded pixels
                    // reset styles so they allow nested elements to grow/shrink naturally
                    $menu.css({
                        position: 'static',
                        minWidth: '0px',
                        maxWidth: '100000px'
                    });
                    // identify width of nested menus
                    $menu.find('> li > ul').each(function () {
                        op.resize($(this), true);
                    });
                    // reset and apply changes in the end because nested
                    // elements' widths wouldn't be calculatable otherwise
                    if (!nested) {
                        $menu.find('ul').addBack().css({
                            position: '',
                            display: '',
                            minWidth: '',
                            maxWidth: ''
                        }).outerWidth(function () {
                            return $(this).data('width');
                        });
                    }
                },
                update: function (opt, root) {
                    var $trigger = this;
                    if (typeof root === 'undefined') {
                        root = opt;
                        op.resize(opt.$menu);
                    }
                    // re-check disabled for each item
                    opt.$menu.children().each(function () {
                        var $item = $(this),
                            key = $item.data('contextMenuKey'),
                            item = opt.items[key],
                            disabled = ($.isFunction(item.disabled) && item.disabled.call($trigger, key, root)) || item.disabled === true,
                            visible;
                        if ($.isFunction(item.visible)) {
                            visible = item.visible.call($trigger, key, root);
                        } else if (typeof item.visible !== 'undefined') {
                            visible = item.visible === true;
                        } else {
                            visible = true;
                        }
                        $item[visible ? 'show' : 'hide']();

                        // dis- / enable item
                        $item[disabled ? 'addClass' : 'removeClass'](root.classNames.disabled);

                        if ($.isFunction(item.icon)) {
                            $item.removeClass(item._icon);
                            item._icon = item.icon.call(this, $trigger, $item, key, item);
                            $item.addClass(item._icon);
                        }

                        if (item.type) {
                            // dis- / enable input elements
                            $item.find('input, select, textarea').prop('disabled', disabled);

                            // update input states
                            switch (item.type) {
                                case 'text':
                                case 'textarea':
                                    item.$input.val(item.value || '');
                                    break;

                                case 'checkbox':
                                case 'radio':
                                    item.$input.val(item.value || '').prop('checked', !!item.selected);
                                    break;

                                case 'select':
                                    item.$input.val((item.selected === 0 ? "0" : item.selected) || '');
                                    break;
                            }
                        }

                        if (item.$menu) {
                            // update sub-menu
                            op.update.call($trigger, item, root);
                        }
                    });
                },
                layer: function (opt, zIndex) {
                    // add transparent layer for click area
                    // filter and background for Internet Explorer, Issue #23
                    var $layer = opt.$layer = $('<div id="context-menu-layer"></div>')
                        .css({
                            height: $win.height(),
                            width: $win.width(),
                            display: 'block',
                            position: 'fixed',
                            'z-index': zIndex,
                            top: 0,
                            left: 0,
                            opacity: 0,
                            filter: 'alpha(opacity=0)',
                            'background-color': '#000'
                        })
                        .data('contextMenuRoot', opt)
                        .insertBefore(this)
                        .on('contextmenu', handle.abortevent)
                        .on('mousedown', handle.layerClick);

                    // IE6 doesn't know position:fixed;
                    if (typeof document.body.style.maxWidth === 'undefined') { // IE6 doesn't support maxWidth
                        $layer.css({
                            'position': 'absolute',
                            'height': $(document).height()
                        });
                    }

                    return $layer;
                },
                processPromises: function (opt, root, promise) {
                    // Start
                    opt.$node.addClass(root.classNames.iconLoadingClass);

                    function completedPromise(opt, root, items) {
                        // Completed promise (dev called promise.resolve). We now have a list of items which can
                        // be used to create the rest of the context menu.
                        if (typeof items === 'undefined') {
                            // Null result, dev should have checked
                            errorPromise(undefined);//own error object
                        }
                        finishPromiseProcess(opt, root, items);
                    }

                    function errorPromise(opt, root, errorItem) {
                        // User called promise.reject() with an error item, if not, provide own error item.
                        if (typeof errorItem === 'undefined') {
                            errorItem = {
                                "error": {
                                    name: "No items and no error item",
                                    icon: "context-menu-icon context-menu-icon-quit"
                                }
                            };
                            if (window.console) {
                                (console.error || console.log).call(console, 'When you reject a promise, provide an "items" object, equal to normal sub-menu items');
                            }
                        } else if (typeof errorItem === 'string') {
                            errorItem = {"error": {name: errorItem}};
                        }
                        finishPromiseProcess(opt, root, errorItem);
                    }

                    function finishPromiseProcess(opt, root, items) {
                        if (typeof root.$menu === 'undefined' || !root.$menu.is(':visible')) {
                            return;
                        }
                        opt.$node.removeClass(root.classNames.iconLoadingClass);
                        opt.items = items;
                        op.create(opt, root, true); // Create submenu
                        op.update(opt, root); // Correctly update position if user is already hovered over menu item
                        root.positionSubmenu.call(opt.$node, opt.$menu); // positionSubmenu, will only do anything if user already hovered over menu item that just got new subitems.
                    }

                    // Wait for promise completion. .then(success, error, notify) (we don't track notify). Bind the opt
                    // and root to avoid scope problems
                    promise.then(completedPromise.bind(this, opt, root), errorPromise.bind(this, opt, root));
                },
                // operation that will run after contextMenu showed on screen
                activated: function(opt){
                    var $menu = opt.$menu;
                    var $menuOffset = $menu.offset();
                    var winHeight = $(window).height();
                    var winScrollTop = $(window).scrollTop();
                    var menuHeight = $menu.height();
                    if(menuHeight > winHeight){
                        $menu.css({
                            'height' : winHeight + 'px',
                            'overflow-x': 'hidden',
                            'overflow-y': 'auto',
                            'top': winScrollTop + 'px'
                        });
                    } else if(($menuOffset.top < winScrollTop) || ($menuOffset.top + menuHeight > winScrollTop + winHeight)){
                        $menu.css({
                            'top': '0px'
                        });
                    } 
                }
            };

        // split accesskey according to http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#assigned-access-key
        function splitAccesskey(val) {
            var t = val.split(/\s+/);
            var keys = [];

            for (var i = 0, k; k = t[i]; i++) {
                k = k.charAt(0).toUpperCase(); // first character only
                // theoretically non-accessible characters should be ignored, but different systems, different keyboard layouts, ... screw it.
                // a map to look up already used access keys would be nice
                keys.push(k);
            }

            return keys;
        }

    // handle contextMenu triggers
        $.fn.contextMenu = function (operation) {
            var $t = this, $o = operation;
            if (this.length > 0) {  // this is not a build on demand menu
                if (typeof operation === 'undefined') {
                    this.first().trigger('contextmenu');
                } else if (typeof operation.x !== 'undefined' && typeof operation.y !== 'undefined') {
                    this.first().trigger($.Event('contextmenu', {
                        pageX: operation.x,
                        pageY: operation.y,
                        mouseButton: operation.button
                    }));
                } else if (operation === 'hide') {
                    var $menu = this.first().data('contextMenu') ? this.first().data('contextMenu').$menu : null;
                    if ($menu) {
                        $menu.trigger('contextmenu:hide');
                    }
                } else if (operation === 'destroy') {
                    $.contextMenu('destroy', {context: this});
                } else if ($.isPlainObject(operation)) {
                    operation.context = this;
                    $.contextMenu('create', operation);
                } else if (operation) {
                    this.removeClass('context-menu-disabled');
                } else if (!operation) {
                    this.addClass('context-menu-disabled');
                }
            } else {
                $.each(menus, function () {
                    if (this.selector === $t.selector) {
                        $o.data = this;

                        $.extend($o.data, {trigger: 'demand'});
                    }
                });

                handle.contextmenu.call($o.target, $o);
            }

            return this;
        };

        // manage contextMenu instances
        $.contextMenu = function (operation, options) {
            if (typeof operation !== 'string') {
                options = operation;
                operation = 'create';
            }

            if (typeof options === 'string') {
                options = {selector: options};
            } else if (typeof options === 'undefined') {
                options = {};
            }

            // merge with default options
            var o = $.extend(true, {}, defaults, options || {});
            var $document = $(document);
            var $context = $document;
            var _hasContext = false;

            if (!o.context || !o.context.length) {
                o.context = document;
            } else {
                // you never know what they throw at you...
                $context = $(o.context).first();
                o.context = $context.get(0);
                _hasContext = !$(o.context).is(document);
            }

            switch (operation) {

                case 'update':
                    // Updates visibility and such
                    if(_hasContext){
                        op.update($context);
                    } else {
                        for(var menu in menus){
                            if(menus.hasOwnProperty(menu)){
                                op.update(menus[menu]);
                            }
                        }
                    }
                    break;

                case 'create':
                    // no selector no joy
                    if (!o.selector) {
                        throw new Error('No selector specified');
                    }
                    // make sure internal classes are not bound to
                    if (o.selector.match(/.context-menu-(list|item|input)($|\s)/)) {
                        throw new Error('Cannot bind to selector "' + o.selector + '" as it contains a reserved className');
                    }
                    if (!o.build && (!o.items || $.isEmptyObject(o.items))) {
                        throw new Error('No Items specified');
                    }
                    counter++;
                    o.ns = '.contextMenu' + counter;
                    if (!_hasContext) {
                        namespaces[o.selector] = o.ns;
                    }
                    menus[o.ns] = o;

                    // default to right click
                    if (!o.trigger) {
                        o.trigger = 'right';
                    }

                    if (!initialized) {
                        var itemClick = o.itemClickEvent === 'click' ? 'click.contextMenu' : 'mouseup.contextMenu';
                        var contextMenuItemObj = {
                            // 'mouseup.contextMenu': handle.itemClick,
                            // 'click.contextMenu': handle.itemClick,
                            'contextmenu:focus.contextMenu': handle.focusItem,
                            'contextmenu:blur.contextMenu': handle.blurItem,
                            'contextmenu.contextMenu': handle.abortevent,
                            'mouseenter.contextMenu': handle.itemMouseenter,
                            'mouseleave.contextMenu': handle.itemMouseleave
                        };
                        contextMenuItemObj[itemClick] = handle.itemClick;
                        // make sure item click is registered first
                        $document
                            .on({
                                'contextmenu:hide.contextMenu': handle.hideMenu,
                                'prevcommand.contextMenu': handle.prevItem,
                                'nextcommand.contextMenu': handle.nextItem,
                                'contextmenu.contextMenu': handle.abortevent,
                                'mouseenter.contextMenu': handle.menuMouseenter,
                                'mouseleave.contextMenu': handle.menuMouseleave
                            }, '.context-menu-list')
                            .on('mouseup.contextMenu', '.context-menu-input', handle.inputClick)
                            .on(contextMenuItemObj, '.context-menu-item');

                        initialized = true;
                    }

                    // engage native contextmenu event
                    $context
                        .on('contextmenu' + o.ns, o.selector, o, handle.contextmenu);

                    if (_hasContext) {
                        // add remove hook, just in case
                        $context.on('remove' + o.ns, function () {
                            $(this).contextMenu('destroy');
                        });
                    }

                    switch (o.trigger) {
                        case 'hover':
                            $context
                                .on('mouseenter' + o.ns, o.selector, o, handle.mouseenter)
                                .on('mouseleave' + o.ns, o.selector, o, handle.mouseleave);
                            break;

                        case 'left':
                            $context.on('click' + o.ns, o.selector, o, handle.click);
                            break;
                        case 'touchstart':
                            $context.on('touchstart' + o.ns, o.selector, o, handle.click);
                            break;
                        /*
                         default:
                         // http://www.quirksmode.org/dom/events/contextmenu.html
                         $document
                         .on('mousedown' + o.ns, o.selector, o, handle.mousedown)
                         .on('mouseup' + o.ns, o.selector, o, handle.mouseup);
                         break;
                         */
                    }

                    // create menu
                    if (!o.build) {
                        op.create(o);
                    }
                    break;

                case 'destroy':
                    var $visibleMenu;
                    if (_hasContext) {
                        // get proper options
                        var context = o.context;
                        $.each(menus, function (ns, o) {

                            if (!o) {
                                return true;
                            }

                            // Is this menu equest to the context called from
                            if (!$(context).is(o.selector)) {
                                return true;
                            }

                            $visibleMenu = $('.context-menu-list').filter(':visible');
                            if ($visibleMenu.length && $visibleMenu.data().contextMenuRoot.$trigger.is($(o.context).find(o.selector))) {
                                $visibleMenu.trigger('contextmenu:hide', {force: true});
                            }

                            try {
                                if (menus[o.ns].$menu) {
                                    menus[o.ns].$menu.remove();
                                }

                                delete menus[o.ns];
                            } catch (e) {
                                menus[o.ns] = null;
                            }

                            $(o.context).off(o.ns);

                            return true;
                        });
                    } else if (!o.selector) {
                        $document.off('.contextMenu .contextMenuAutoHide');
                        $.each(menus, function (ns, o) {
                            $(o.context).off(o.ns);
                        });

                        namespaces = {};
                        menus = {};
                        counter = 0;
                        initialized = false;

                        $('#context-menu-layer, .context-menu-list').remove();
                    } else if (namespaces[o.selector]) {
                        $visibleMenu = $('.context-menu-list').filter(':visible');
                        if ($visibleMenu.length && $visibleMenu.data().contextMenuRoot.$trigger.is(o.selector)) {
                            $visibleMenu.trigger('contextmenu:hide', {force: true});
                        }

                        try {
                            if (menus[namespaces[o.selector]].$menu) {
                                menus[namespaces[o.selector]].$menu.remove();
                            }

                            delete menus[namespaces[o.selector]];
                        } catch (e) {
                            menus[namespaces[o.selector]] = null;
                        }

                        $document.off(namespaces[o.selector]);
                    }
                    break;

                case 'html5':
                    // if <command> and <menuitem> are not handled by the browser,
                    // or options was a bool true,
                    // initialize $.contextMenu for them
                    if ((!$.support.htmlCommand && !$.support.htmlMenuitem) || (typeof options === 'boolean' && options)) {
                        $('menu[type="context"]').each(function () {
                            if (this.id) {
                                $.contextMenu({
                                    selector: '[contextmenu=' + this.id + ']',
                                    items: $.contextMenu.fromMenu(this)
                                });
                            }
                        }).css('display', 'none');
                    }
                    break;

                default:
                    throw new Error('Unknown operation "' + operation + '"');
            }

            return this;
        };

    // import values into <input> commands
        $.contextMenu.setInputValues = function (opt, data) {
            if (typeof data === 'undefined') {
                data = {};
            }

            $.each(opt.inputs, function (key, item) {
                switch (item.type) {
                    case 'text':
                    case 'textarea':
                        item.value = data[key] || '';
                        break;

                    case 'checkbox':
                        item.selected = data[key] ? true : false;
                        break;

                    case 'radio':
                        item.selected = (data[item.radio] || '') === item.value;
                        break;

                    case 'select':
                        item.selected = data[key] || '';
                        break;
                }
            });
        };

    // export values from <input> commands
        $.contextMenu.getInputValues = function (opt, data) {
            if (typeof data === 'undefined') {
                data = {};
            }

            $.each(opt.inputs, function (key, item) {
                switch (item.type) {
                    case 'text':
                    case 'textarea':
                    case 'select':
                        data[key] = item.$input.val();
                        break;

                    case 'checkbox':
                        data[key] = item.$input.prop('checked');
                        break;

                    case 'radio':
                        if (item.$input.prop('checked')) {
                            data[item.radio] = item.value;
                        }
                        break;
                }
            });

            return data;
        };

    // find <label for="xyz">
        function inputLabel(node) {
            return (node.id && $('label[for="' + node.id + '"]').val()) || node.name;
        }

    // convert <menu> to items object
        function menuChildren(items, $children, counter) {
            if (!counter) {
                counter = 0;
            }

            $children.each(function () {
                var $node = $(this),
                    node = this,
                    nodeName = this.nodeName.toLowerCase(),
                    label,
                    item;

                // extract <label><input>
                if (nodeName === 'label' && $node.find('input, textarea, select').length) {
                    label = $node.text();
                    $node = $node.children().first();
                    node = $node.get(0);
                    nodeName = node.nodeName.toLowerCase();
                }

                /*
                 * <menu> accepts flow-content as children. that means <embed>, <canvas> and such are valid menu items.
                 * Not being the sadistic kind, $.contextMenu only accepts:
                 * <command>, <menuitem>, <hr>, <span>, <p> <input [text, radio, checkbox]>, <textarea>, <select> and of course <menu>.
                 * Everything else will be imported as an html node, which is not interfaced with contextMenu.
                 */

                // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#concept-command
                switch (nodeName) {
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#the-menu-element
                    case 'menu':
                        item = {name: $node.attr('label'), items: {}};
                        counter = menuChildren(item.items, $node.children(), counter);
                        break;

                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-a-element-to-define-a-command
                    case 'a':
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-button-element-to-define-a-command
                    case 'button':
                        item = {
                            name: $node.text(),
                            disabled: !!$node.attr('disabled'),
                            callback: (function () {
                                return function () {
                                    $node.get(0).click();
                                };
                            })()
                        };
                        break;

                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-command-element-to-define-a-command
                    case 'menuitem':
                    case 'command':
                        switch ($node.attr('type')) {
                            case undefined:
                            case 'command':
                            case 'menuitem':
                                item = {
                                    name: $node.attr('label'),
                                    disabled: !!$node.attr('disabled'),
                                    icon: $node.attr('icon'),
                                    callback: (function () {
                                        return function () {
                                            $node.get(0).click();
                                        };
                                    })()
                                };
                                break;

                            case 'checkbox':
                                item = {
                                    type: 'checkbox',
                                    disabled: !!$node.attr('disabled'),
                                    name: $node.attr('label'),
                                    selected: !!$node.attr('checked')
                                };
                                break;
                            case 'radio':
                                item = {
                                    type: 'radio',
                                    disabled: !!$node.attr('disabled'),
                                    name: $node.attr('label'),
                                    radio: $node.attr('radiogroup'),
                                    value: $node.attr('id'),
                                    selected: !!$node.attr('checked')
                                };
                                break;

                            default:
                                item = undefined;
                        }
                        break;

                    case 'hr':
                        item = '-------';
                        break;

                    case 'input':
                        switch ($node.attr('type')) {
                            case 'text':
                                item = {
                                    type: 'text',
                                    name: label || inputLabel(node),
                                    disabled: !!$node.attr('disabled'),
                                    value: $node.val()
                                };
                                break;

                            case 'checkbox':
                                item = {
                                    type: 'checkbox',
                                    name: label || inputLabel(node),
                                    disabled: !!$node.attr('disabled'),
                                    selected: !!$node.attr('checked')
                                };
                                break;

                            case 'radio':
                                item = {
                                    type: 'radio',
                                    name: label || inputLabel(node),
                                    disabled: !!$node.attr('disabled'),
                                    radio: !!$node.attr('name'),
                                    value: $node.val(),
                                    selected: !!$node.attr('checked')
                                };
                                break;

                            default:
                                item = undefined;
                                break;
                        }
                        break;

                    case 'select':
                        item = {
                            type: 'select',
                            name: label || inputLabel(node),
                            disabled: !!$node.attr('disabled'),
                            selected: $node.val(),
                            options: {}
                        };
                        $node.children().each(function () {
                            item.options[this.value] = $(this).text();
                        });
                        break;

                    case 'textarea':
                        item = {
                            type: 'textarea',
                            name: label || inputLabel(node),
                            disabled: !!$node.attr('disabled'),
                            value: $node.val()
                        };
                        break;

                    case 'label':
                        break;

                    default:
                        item = {type: 'html', html: $node.clone(true)};
                        break;
                }

                if (item) {
                    counter++;
                    items['key' + counter] = item;
                }
            });

            return counter;
        }

    // convert html5 menu
        $.contextMenu.fromMenu = function (element) {
            var $this = $(element),
                items = {};

            menuChildren(items, $this.children());

            return items;
        };

    // make defaults accessible
        $.contextMenu.defaults = defaults;
        $.contextMenu.types = types;
    // export internal functions - undocumented, for hacking only!
        $.contextMenu.handle = handle;
        $.contextMenu.op = op;
        $.contextMenu.menus = menus;
    });
}