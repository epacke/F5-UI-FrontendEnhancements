// ==UserScript==
// @name BigiIP UI Tweaks
// @description Tweaks the F5 UI
// @match https://*/tmui/Control/*
// @match https://*/xui/
// @author https://loadbalancing.se/about
// @run-at document-end
// @grant none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

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
    Add default certificate signing alternatives
    First one defined is always the default one

    This one is a bit tricky to format, look at the example carefully

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

     /*************************************************************************
        Deactivate the choice to activate the Christmas theme altogether

        Default (allow the choice):
        allowChristmas = false;
        
        Don't allow the choice:
        allowChristmas = true;

    ***************************************************************************/

    var allowChristmas = true;

    /**************************************************************************
        How often should the script update the LTM log stats (in seconds)
        ltmLogCheckInterval = 30;
    **************************************************************************/

    var ltmLogCheckInterval = 30;

/***************************************************************************************
                        End Config section
****************************************************************************************/

//Make sure that the tampermonkey jQuery does not tamper with F5's scripts
this.$ = this.jQuery = jQuery.noConflict(true);

//Declare global ajax queue limit
var tamperDataGroupLists = new Array();
var detectedarr = [];

var poolStatuses;

var logDatabase;

var ltmLogPatterns = {
    "poolFailures": new function(){
        this.enabled = true;
        this.name = "Pool failures";
        this.isMatching = function(event){
            return(event.logEvent.match(/^Pool.+monitor status down/) !== null);
        }
    },
    "nodeFailures": new function(){
        this.enabled = true;
        this.name = "Node failures";
        this.isMatching = function(event){
            return(event.logEvent.match(/^Node.+monitor status down/) !== null);
        }
    },
    "errors": new function(){
        this.enabled = true;
        this.name = "Errors";
        this.isMatching = function(event){
            return(event.logLevel === "error");
        }
    },
    "warnings": new function(){
        this.enabled = true;
        this.name = "Warnings";
        this.isMatching = function(event){
            return(event.logLevel === "warning");
        }
    },
    "tclErrors": new function(){
        this.enabled = true;
        this.name = "TCL Errors";
        this.isMatching = function(event){
            return(event.logEvent.match(/^TCL error/) !== null);
        }
    },
    "aggressiveMode": new function(){
        this.enabled = true;
        this.name = "Aggressive Mode"
        this.isMatching = function(event){
            return(event.logEvent.match(/aggressive mode activated/) !== null);
        }
    },
    "addressConflicts": new function(){
        this.enabled = true;
        this.name = "Address Conflicts"
        this.isMatching = function(event){
            return(event.logEvent.match(/address conflict detected for/) !== null);
        }
    }
}


var globalNameSpace = {

    globalVariables: {
        restUserName: "tamper",
        restPassword: "monkey",
        debug: true
    },
    enhancementFunctions: {

        "enhanceiRuleProperties": new function(){

            // Scans for data group lists in an iRule and adds data group lists on the side
            this.name = "Improve iRule editor";
            this.description = `<ul>
                                    <li>Scans iRule for data group lists</li>
                                    <li>Adds detected data group lists to the right side of the iRule editor</li>
                                    <li>Hovering the mouse over an iRule shows the data group list content</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp")
                && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                && this.enabled;
            };
            this.enhance = improveiRuleProperties;

        },
        "improveiRuleSelection": new function(){

            this.name = "Improve virtual server iRules management";
            this.description = `<ul>
                                    <li>Increases the selection box</li>
                                    <li>Adds double click to move between sections.</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            this.applicable = function(){
                return uriContains("/tmui/Control/form?__handler=/tmui/locallb/virtual_server/resources&__source=Manage")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };
            this.enhance = improveiRuleSelection;

        },
        "addHTTPMonitorSuffix": new function(){

            this.name = "Adds HTTP monitor suffix to pool names";
            this.description = `<ul>
                                    <li>Adds monitor prefixes when creating pools</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            this.applicable = function(){
                return $("select[name=mon_type]").length > 0
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };
            
            this.enhance = addHTTPMonitorSuffix;
        },
        "makeCurrentPartitionObjectsBold": new function(){

            this.name = "Make current partition objects bold";
            this.description = `<ul>
                                    <li>Adds monitor prefixes</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains('/list.jsp')
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = makeCurrentPartitionObjectsBold;
        },
        "improvePoolProperties": new function(){

            this.name = "Enhance the pool properties page";
            this.description = `<ul>
                                    <li>Makes monitor selection bigger</li>
                                    <li>Adds double click functionality</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improvePoolProperties;
        },
        "improvePoolCreation": new function(){

            this.name = "Enhance the pool creation page";
            this.description = `<ul>
                                    <li>Makes monitor selection bigger</li>
                                    <li>Adds double click functionality</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/pool/create.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improvePoolCreation;
        },
        "improvePoolMemberProperties": new function(){

            this.name = "Enhance the pool member properties page";
            this.description = `<ul>
                                    <li>Adds monitor tests for HTTP monitors</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/pool/member/properties.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improvePoolMemberProperties;
        },
        "improveCertKeyChainSelection": new function(){

            this.name = "Client SSL Profile enhancements";
            this.description = `<ul>
                                    <li>Automatically selects certificate and keys matching the name of the client SSL profile</li>
                                    <li>Selects a default chain certificate according to the script configuration</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return $('input[name="cert_key_chain_override"]').length > 0
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveCertKeyChainSelection;

        },
        "improveVirtualServerResources": new function(){

            this.name = "Improve Virtual Server resource tab";
            this.description = `<ul>
                                    <li>Adds a shortcut to the configured default pool</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/virtual_server/resources.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveVirtualServerResources;

        },
        "improveVirtualServerProperties": new function(){

            this.name = "Improve Virtual Server properties page";
            this.description = `<ul>
                                    <li>Double click to the multiple selection lists</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveVirtualServerProperties;

        },
        "improveDataGroupListProperties": new function(){

            this.name = "Data group list editing safe guards";
            this.description = `<ul>
                                    <li>Disabled the update button while the key/value fields contains values not in the list to protect from accidentally removing something by mistake.</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveDataGroupListProperties;

        },
        "improveDataGroupListEditing": new function(){

            this.name = "Add data group list editing features";
            this.description = `<ul>
                                    <li>Adds the possibility to free-text edit, import, export and merge lists.</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return (uriContains("/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp") 
                    || uriContains("/tmui/Control/jspmap/tmui/locallb/datagroup/create.jsp"))
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveDataGroupListEditing;

        },
        "improveClientSSLProfileCreation": new function(){

            this.name = "Improves the client SSL profile creation";
            this.description = `<ul>
                                    <li>Automatically selects a parent profile according to the script configuration</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/profile/clientssl/create.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improveClientSSLProfileCreation;

        },
        "improvePoolList": new function(){

            this.name = "Improves the pool list";
            this.description = `<ul>
                                    <li>Gives more granular pool state symbols</li>
                                    <li>Hovering the mouse of the state symbol shows the members and their states</li>
                                </ul>
                                    <font color="red">Warning: On <i>very</i> large configurations (~2000 pools) this <i><b>can</b></i> be detrimental to the HTTPD process.
                                    <b>This is not a risk for the application delivery itself</b>, but <i>may</i> cause the process to be restarted.</font>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/pool/list.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = improvePoolList;

        },
        "addPartitionFilter": new function(){

            this.name = "Partition filter";
            this.description = `<ul>
                                    <li>Adds a free text partition filter to ease partition selection</li>
                                </ul>`
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return $(parent.top.document).find("input#partitionFilter").length == 0
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = addPartitionFilter;

        },
        "addChristmasTheme": new function(){

            this.name = "Christmas theme";
            this.description = `<ul>
                                    <li>Allows the user to enable/disable christmas theme during december</li>
                                </ul>`
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return isItChristmas()
                    && allowChristmas
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = showChristmasOption;

        },
        "addCSRDropDownMenu": new function(){

            this.name = "CSR profiles";
            this.description = `<ul>
                                    <li>Adds a drop down menu with predefined CSR options</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];
            
            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/locallb/ssl_certificate/create.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = addCSRDropDownMenu;

        }, "addLTMLogSummary": new function(){
            this.name = "LTM log features";
            this.description = `<ul>
                                    <li>Adds information from the LTM log to the top bar</li>
                                    <li>Shows pool failures in the pool list</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];

            this.applicable = function(){
                return uriContains("/tmui/Control/jspmap/tmui/overview/welcome/introduction.jsp")
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = startLTMLogFetcher;

        }, "initiatePools": new function(){
            this.name = "Get pool states";
            this.description = `<ul>
                                    <li>Get regular pool states to populate statistics and show smarter overview.</li>
                                </ul>`;
            this.enabled = true;
            this.appliesToVersion = ["12", "13", "14"];


            this.applicable = function(){
                return document.location.pathname === "/xui/"
                    && this.appliesToVersion.indexOf(globalNameSpace.globalVariables.versionInformation.majorVersion) != -1
                    && this.enabled;
            };

            this.enhance = function(){
                startPoolStatePoller();
            };
        }

    }
}

initiateBaloon();

// Determine version, then launcht the enhancements
getTMOSVersion()
    .then( () => {
        for(i in globalNameSpace.enhancementFunctions){
            var f = globalNameSpace.enhancementFunctions[i];
            if(f.applicable() && f.enabled){
                f.enhance();
            }
        }
    }).catch(err => {
        console.log(err);
    });

/**************************************************************************
 *      
 *                  Modify the top frame
 *
 **************************************************************************/

String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}




class Pools {
    
    constructor() {
        this.pools = {};
        this.updatePoolData();
        //This is where we will store the actual pool data
    }

    get getPools() {
        return this;
    }

    parsePoolData(pools) {

        // Reset the pools data
        this.pools = {};

        pools.items.map(p => {

            let poolName = p.fullPath;

            this.pools[poolName] = {};

            if(p.membersReference){

                p.membersReference.items.map(m => {

                    let memberName = m.fullPath;
                    let session = m.session;
                    let state = m.state;

                    this.pools[poolName][memberName] = {};
                    this.pools[poolName][memberName].session = session;
                    this.pools[poolName][memberName].state = m.state;
                    this.pools[poolName][memberName].icon = getMemberStatusIcon(session, state);

                })

            }

        })

    }

    updatePoolData() {

        //Reset the pool data
        getRestEndpoint("/mgmt/tm/ltm/pool?expandSubcollections=true")
            .then(pools => {    
                this.lastUpdated = new Date();
                this.parsePoolData(pools);
            })
            .catch(err => console.error(err));
    }
}

function startPoolStatePoller(){
    var pools = new Pools();
    //setInterval(() => { 
        pools.updatePoolData();
        console.log(pools)
    // }, 5000);
}

function getToken() {

    return new Promise (

        function (resolve, reject){

            let userName = globalNameSpace.globalVariables.restUserName;
            let password  = globalNameSpace.globalVariables.restPassword;

            let pair = btoa(userName + ":" + password);
            let body = { "username": userName, "password": password, "loginProviderName": "tmos" }

            $.ajax({
                url: "https://" + window.location.host + "/mgmt/shared/authn/login",
                type: "POST",
                data: JSON.stringify(body),
                dataType: "json",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("Authorization", "Basic " + pair);
                },
                success: function(response) {
                   resolve(response.token.token);
                },
                error: function(err){

                    let errorMessage;

                    if(globalNameSpace.globalVariables.debug){
                        errorMessage = "URL: " +  "https://" + window.location.host + "/mgmt/shared/authn/login\n" +
                                                        "Authorization: Basic " + pair + "\n"
                                                        "Data: " + JSON.stringify(body);
                    } else {
                        errorMessage = "failed to get token";
                    }
                    
                    reject(errorMessage);

                }
            })
        }

    )
}

function getTMOSVersion(){

    return new Promise(function(resolve, reject){

        let storedVersionInfo = JSON.parse(localStorage.getItem("f5-enhancements-tmosVersion"));

        if(storedVersionInfo === null || getSecondsSince(storedVersionInfo.lastUpdated) > 600){
            getRestEndpoint("/mgmt/tm/sys/version?$select=Version")
                .then(json => {
                    try {
                        
                        let versionJson = json.entries["https:\/\/localhost\/mgmt\/tm\/sys\/version\/0"].nestedStats.entries;
                        
                        let version = versionJson.Version.description;
                        let majorVersion = version.split(".")[0];

                        globalNameSpace.globalVariables.versionInformation = {
                            version: version,
                            majorVersion: majorVersion,
                            lastUpdated: new Date()
                        };
                        
                        localStorage.setItem("f5-enhancements-tmosVersion", JSON.stringify(globalNameSpace.globalVariables.versionInformation));

                        resolve();
                        
                    } catch(err) {
                        reject(err);
                    }
                })
        } else {
            globalNameSpace.globalVariables.versionInformation = storedVersionInfo;
            resolve();
        }
    })
}

function getSecondsSince(timeStamp){
    return (Date.now() - Date.parse(timeStamp))/1000;
}

function getRestEndpoint(endpoint) {
    
    return new Promise(
    
        function(resolve, reject){

            getToken().then(token => {
                $.ajax({
                    url: "https://" + window.location.host + endpoint,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("X-F5-Auth-Token", token);
                    },
                    success: function(response) {
                        resolve(response);
                    },
                    error: function(err){
                        reject("Failed to get " + endpoint);
                    }
                });
            }).catch(function(err){
                console.log(err)
            })

        }
    )
}

function getMemberStatusIcon(session, state){

    let sessionState = session + "_" + state;

    switch (sessionState) {
        case "monitor-enabled_down":
            return "red";
        case "monitor-enabled_up":
            return "green";
        case "user-disabled_user-down":
            return "black";
        case "user-enabled_unchecked":
            return "blue";
        default:
            return "blue";
    }

}





function startLTMLogFetcher(){

    //Check if the database contains anything
    if(typeof(logDatabase) === "undefined"){
        var rawData = localStorage.getItem("ltmLog") || "{\"content\":{},\"lastSynced\":null}";
        logDatabase = JSON.parse(rawData);
        //updateLTMLogStatistics(getLTMLogStatisticsSummary(logDatabase));
        initiateLTMLogStatistics();
    }

    if(logDatabase.lastSynced){
        var lastSynced = new Date(logDatabase.lastSynced);
        var now = new Date();
        var seconds = (now.getTime() - lastSynced.getTime()) / 1000;
    }

    var fetchLTMLog = function(){
        $.ajax({
            url: "https://" + window.location.host + "/tmui/Control/jspmap/tmui/system/log/list_ltm.jsp",
            type: "GET",
            success: function(response) {
                $(response).find("table.list tbody tr").each(function(){
                    
                    var message = {}
                    
                    row = $(this).find("td");

                    message.timeStamp = $(row[0]).text().trim();
                    message.logLevel = $(row[1]).text().trim();
                    message.host = $(row[2]).text().trim();
                    message.service = $(row[3]).text().trim();
                    message.statusCode = $(row[4]).text().trim();
                    message.logEvent = $(row[5]).text().trim();

                    var data = "";
                    for(i in message){
                        data += message[i]
                    }

                    if(!(data in logDatabase)){
                        logDatabase.content[data] = message
                    }

                    logDatabase.lastSynced = new Date();
                })

                updateLTMLogStatistics(getLTMLogStatisticsSummary(logDatabase));
                localStorage.setItem("ltmLog", JSON.stringify(logDatabase));
            }
            
        })
    }

    fetchLTMLog();
    setInterval(fetchLTMLog, ltmLogCheckInterval*1000);
}

function initiateLTMLogStatistics(){

    var topFrame = $(parent.top.document);

    if(topFrame.find("div.ltmLogStats").length == 0){

        var styleTag = $(`<style>
                                .ltmLogStats { 
                                    float: left;
                                    padding: 0 15px;
                                    border-right: 1px dotted #444;
                                    margin: 0;
                                }
                        </style>`);
        
        topFrame.find('html > head').append(styleTag);
        var html = ``;

        var parameterList = [];

        for(var i in ltmLogPatterns){

            if(parameterList.length == 2){
                html += `<div class="ltmLogStats" id="ltmLogStats">` + parameterList.join("") + `</div>`
                parameterList = [];
            }
            
            parameterList.push(`
                    <div class="" id="logStats` + i +  `">
                        <label>` + ltmLogPatterns[i].name + `:</label>
                        <span>Loading...</span>
                    </div>`
            );
        }

        if(parameterList.length != 0){
            html += `<div class="ltmLogStats">` + parameterList.join("") + `</div>`
        }

        topFrame.find("div#userinfo").last().after(html);
        
    }

}

function updateLTMLogStatistics(summary){

    var topFrame = $(parent.top.document);

    if(topFrame.find("div.ltmLogStats").length != 0){

        var i = 0
        for(var stats in summary){
            var statsSpan = topFrame.find("div#logStats" + stats + " span");
            statsSpan.fadeOut(300);
            statsSpan.html(summary[stats]);
            statsSpan.fadeIn(300);
        }

    }
    
}

function getLTMLogStatisticsSummary(logDatabase){

    var summary = {};
    var events = logDatabase.content;

    for(var f in ltmLogPatterns){
        logTest = ltmLogPatterns[f];
        if(logTest.enabled){
            summary[f] = 0;
        }
    }

    for(var i in events){
        
        var event = events[i];

        for(functionName in ltmLogPatterns){

            var f = ltmLogPatterns[functionName];
            if(f.isMatching(event)){
                summary[functionName]++;
            }
        }

    }

    return(summary);

}

function isItChristmas(){
    var d = new Date();
    return d.getMonth() == 11;
}


function showChristmasOption(){

    if($(parent.top.document).find("input#grinch").length == 0){
        var partitionDiv = $(parent.top.document).find("div#partition");

        partitionDiv.after(`
            <div id="christmasdiv" style="float:right;border-left: 1px dotted #444; padding: 5px;">
                <span style='font-family: "Comic Sans MS", "Comic Sans";color:#f92c2c;font-size:14px;'>Merry christmas! Which one are you? </span>
                <form action="" style="display:inline;">
                    <input name="ChristmasButton" class="christmasButton" type="radio" id="grinch" value="grinch"> Grinch
                    <input name="ChristmasButton" class="christmasButton"type="radio" id="santa" value="santa"> Santa
                </form>
            <div>
        `);

        if(localStorage.getItem("tamperMonkey-snowActicated") === "true"){
            letItSnow();
            $(parent.top.document).find("input#santa").attr("checked", true);
        } else {
            $(parent.top.document).find("input#grinch").attr("checked", true);
        }

        $(parent.top.document).find("input.christmasButton").on("click", function(){
            if($(this).val() === "santa"){
                letItSnow();
                localStorage.setItem("tamperMonkey-snowActicated", "true");
            } else {
                $(parent.top.document).find("#xmas").remove();
                $(parent.top.document).find("#santahat").remove();
                localStorage.setItem("tamperMonkey-snowActicated", "false")
            }
        })

    }

}

// This function handles the Christmas theme (santa hat on the F5 ball and snow)

function letItSnow(canvas, w, h){

    if(parent.top.document.getElementById("xmas") === null){

        var b = parent.top.document.getElementById("banner");
        var logo = parent.top.document.getElementById("logo");
        var image = $(logo).find("img");
        var position  = image.position();

        $(logo).prepend("<div style=\"position:absolute;left:" + (position.left - 3) + "px;top:" + (position.top - 20) + "px;pointer-events: none;\"><canvas id=\"santahat\"></canvas></div>")
        createSantaHat(parent.top.document.getElementById("santahat"));
        $(b).before("<div id=\"xmasdiv\" style=\"position:absolute;left:0px;top:38px;width:100%;height:105.38px;width:" + b.offsetWidth + ";z-index:999;overflow:hidden;pointer-events: none;\"><canvas id=\"xmas\" class=\"snow\"></canvas></div>")

        var canvas = parent.top.document.getElementById("xmas");
        var w = b.offsetWidth
        var h = b.offsetHeight

        var ctx = canvas.getContext('2d'),
        windowW = w,
        windowH = h,
        numFlakes = 200,
        flakes = [];

        function Flake(x, y) {  
            var maxWeight = 5,
            maxSpeed = 0.5;

            this.x = x;
            this.y = y;
            this.r = randomBetween(0, 1);
            this.a = randomBetween(0, Math.PI);
            this.aStep = 0.01;


            this.weight = randomBetween(2, maxWeight);
            this.alpha = (this.weight / maxWeight);
            this.speed = (this.weight / maxWeight) * maxSpeed;

            this.update = function() {
                this.x += Math.cos(this.a) * this.r;
                this.a += this.aStep;

                this.y += this.speed;
            }

        }

        function init() {
            
            var i = numFlakes,
            flake,
            x,
            y;
          
            while (i--) {
                x = randomBetween(0, windowW, true);
                y = randomBetween(0, windowH, true);
            
                flake = new Flake(x, y);
                flakes.push(flake);
            }
          
            scaleCanvas();
            loop();  
        }

        function scaleCanvas() {
            canvas.width = windowW;
            canvas.height = windowH;
        }

        function loop() {
            var i = flakes.length,
            z,
            dist,
            flakeA,
            flakeB;
          
            // clear canvas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, windowW, windowH);
            ctx.restore();
          
            // loop of hell
            while (i--) {
            
                flakeA = flakes[i];
                flakeA.update();
                

                /*for (z = 0; z < flakes.length; z++) {
                  flakeB = flakes[z];
                  if (flakeA !== flakeB && distanceBetween(flakeA, flakeB) < 150) {          
                    ctx.beginPath();
                    ctx.moveTo(flakeA.x, flakeA.y);
                    ctx.lineTo(flakeB.x, flakeB.y);
                    ctx.strokeStyle = '#444444';
                    ctx.stroke();
                    ctx.closePath();
                  }
                }*/

            
                ctx.beginPath();
                ctx.arc(flakeA.x, flakeA.y, flakeA.weight, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'rgba(255, 255, 255, ' + flakeA.alpha + ')';
                ctx.fill();
                
                if (flakeA.y >= windowH) {
                  flakeA.y = -flakeA.weight;
                }
            }
          
            requestAnimationFrame(loop);
            
        }

        function randomBetween(min, max, round) {
            var num = Math.random() * (max - min + 1) + min;

            if (round) {
                return Math.floor(num);
            } else {
                return num;
            }
        }

        function distanceBetween(vector1, vector2) {
          var dx = vector2.x - vector1.x,
              dy = vector2.y - vector1.y;

          return Math.sqrt(dx*dx + dy*dy);
        }

        init();
    }

}

function addPartitionFilter(){

    initiateBaloon();

    var partitionDiv = $(parent.top.document).find("div#partition");

    // Add the filter input and the label
    partitionDiv.prepend("<input size=10 id=\"partitionFilter\"/>  ")
    partitionDiv.prepend("<label>Partition filter <a title=\"Hit enter to activate the selected partition\" id=\"partitionFilterHelp\" href=\"https://loadbalancing.se/f5-webui-tweaks/#Partition_filtering\" target=\"_blank\">[?]</a>: </label>");

    var partitionDropDown = partitionDiv.find("select#partition_control");
    var partitonOptions = partitionDropDown.find("option");
    var partitionFilterInput = partitionDiv.find("input#partitionFilter");
    
    partitionFilterInput.on("keyup", function(e){
        
        if(e.keyCode === 13){
            triggerEvent("change", parent.top.document.querySelector("div#partition select#partition_control"))
            return;
        }

        var searchValue = this.value;

        // Set the local storage in order to re-populate the filter upon page reload 
        localStorage.setItem("tamperMonkey-PartitionFilter", searchValue);

        var re = new RegExp(searchValue, "i");

        partitonOptions.each(function(){
            if($(this).val().match(re) || $(this).val() === "[All]"){
                $(this).attr("ismatch", "true")
                $(this).show();
            } else {
                $(this).attr("ismatch", "false")
                $(this).hide();
            }
        });

        var selectedOption = partitionDropDown.find("option:selected");
        var selectedOptionValue = selectedOption.val() || ""
        var matchedCount = partitionDropDown.find("option[ismatch='true']").length;
        
        if(!selectedOptionValue.match(re) && matchedCount > 0){
            selectedOption.removeAttr("selected");
            partitionDropDown.find("option[ismatch='true']:eq(0)").attr("selected", "selected");
        }

    })

    partitionFilterInput.val(localStorage.getItem("tamperMonkey-PartitionFilter") || "").trigger("keyup");

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
                    <span style="font-weight:bold;">/` + partition + `:</span>`;

            for(let i = 0; i < list.length; i++){

                let fullPath = "/" + partition + "/" + list[i];

                html += `
                    <br>
                    <a href="https://` + window.location.host + `/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=` + fullPath + `" data-name="` + fullPath + `">` + list[i] + `</a>`;
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
                                                    <input type="button" value="Help" id="bulkHelp" onClick="window.open('https://loadbalancing.se/webui-tweaks-manual/#Data_group_list_editing','_blank')"/>
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

