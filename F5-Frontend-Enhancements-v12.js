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
    2.0.4   Caching data group list content in iRules instead of fetching on every mouse over.
    2.0.5   Removing old code.
	
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
    var html;

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
        },
        async: false
    });

    return html;

}

function getDataGroupListsFromRule(str){

    "use strict"

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

            if(this.data === undefined){

                this.data = parseDataGroupValues(name, (html) => $(this).showBalloon({ 
                        position: "left",
                        css: { 
                            whitespace: "nowrap"
                        }, 
                        showDuration: 0,
                        hideDuration: 0,
                        contents: html
                }));

            } else {

                $(this).showBalloon({ 
                        position: "left",
                        css: { 
                            whitespace: "nowrap"
                        }, 
                        showDuration: 0,
                        hideDuration: 0,
                        contents: this.data
                });
            }

        });

        $(this).on("mouseleave", function(){
            $(this).hideBalloon();
        });
    })

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

        //  SSL Profile (server)
        addDoubleClick("selectedserversslprofiles", "availableserversslprofiles_button");
        addDoubleClick("availableserversslprofiles", "selectedserversslprofiles_button");

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
