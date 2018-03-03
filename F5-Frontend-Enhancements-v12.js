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
    1.3     Now generating monitor test links.
    2.0     Generating pool status icons.
            Preventing edited data group list entries from being saved.
            Making data-group list parsing more performant.
            Script will automatically match client ssl profile name with certificates and keys using the same name.
    2.0.1   Fixing a bug where the data group list type select box is expanded.
    2.0.2   Adding double clicking on selects.
    2.0.3   Improving data group list scanning.
    2.0.4   Caching data group list content in iRules instead of fetching on every mouse over.
    2.0.5   Removing old code.
    2.0.6   Adding partition filters
    2.0.7   Allowing users to choose if they want to activate the script on v13
    
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

     /*************************************************************************
        Deactivate the choice to activate the Christmas theme altogether

        Default (allow the choice):
        allowChristmas = false;
        
        Don't allow the choice
        allowChristmas = true;

    ***************************************************************************/

    var allowChristmas = true;

    /**************************************************************************
        *This is a BETA, please report any bugs in this thread:
        https://devcentral.f5.com/codeshare/webui-tweaks-v12-1109

        This option allows the script to run on on v13:

        Default:
        allow13 = false;
        
        To allow the script to be active on v13 devices:
        allow13 = true;

    ***************************************************************************/

    allow13 = false;

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

if (version.split(".")[0] === "12" || (allow13 && version.split(".")[0] === "13")) {

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

        if($(parent.top.document).find("input#partitionFilter").length == 0){
            addPartitionFilter();
        }

        // Special request from Devcentral member Boneyard:
        // alwaysChristmas will always activate Christmas if declared
        if((allowChristmas && isItChristmas()) || alwaysChristmas !== undefined){
            showChristmasOption();
        } else {
            localStorage.removeItem("tamperMonkey-snowActicated");
        }
        
    })();
}

/**************************************************************************
 *      
 *                  Modify the top frame
 *
 **************************************************************************/

function isItChristmas(){
    var d = new Date();
    return d.getMonth() == 11;
}

// Adds the santa hat to the F5 ball
function createSantaHat(c){
    c.height=56,c.width=68;var cx=c.getContext("2d");cx.fillStyle="rgba(126,97,96,0)",cx.fillRect(0,0,1,1),cx.fillRect(1,0,1,1),cx.fillRect(2,0,1,1),cx.fillRect(3,0,1,1),cx.fillRect(4,0,1,1),cx.fillRect(5,0,1,1),cx.fillRect(6,0,1,1),cx.fillRect(7,0,1,1),cx.fillRect(8,0,1,1),cx.fillRect(9,0,1,1),cx.fillRect(10,0,1,1),cx.fillRect(11,0,1,1),cx.fillRect(12,0,1,1),cx.fillStyle="rgba(126,98,97,0)",cx.fillRect(13,0,1,1),cx.fillRect(14,0,1,1),cx.fillStyle="rgba(103,58,57,0)",cx.fillRect(15,0,1,1),cx.fillStyle="rgba(81,18,18,0)",cx.fillRect(16,0,1,1),cx.fillStyle="rgba(85,26,25,0.016)",cx.fillRect(17,0,1,1),cx.fillStyle="rgba(80,19,18,0.339)",cx.fillRect(18,0,1,1),cx.fillStyle="rgba(70,10,10,0.685)",cx.fillRect(19,0,1,1),cx.fillStyle="rgba(59,3,3,0.89)",cx.fillRect(20,0,1,1),cx.fillStyle="rgba(59,0,0,0.992)",cx.fillRect(21,0,1,1),cx.fillStyle="rgba(65,1,1,1)",cx.fillRect(22,0,1,1),cx.fillStyle="rgba(73,3,3,1)",cx.fillRect(23,0,1,1),cx.fillStyle="rgba(72,2,2,1)",cx.fillRect(24,0,1,1),cx.fillStyle="rgba(64,1,1,1)",cx.fillRect(25,0,1,1),cx.fillStyle="rgba(59,0,0,0.945)",cx.fillRect(26,0,1,1),cx.fillStyle="rgba(59,2,2,0.803)",cx.fillRect(27,0,1,1),cx.fillStyle="rgba(69,9,9,0.559)",cx.fillRect(28,0,1,1),cx.fillStyle="rgba(79,18,18,0.276)",cx.fillRect(29,0,1,1),cx.fillStyle="rgba(85,25,25,0.039)",cx.fillRect(30,0,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(31,0,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(32,0,1,1),cx.fillStyle="rgba(81,19,19,0)",cx.fillRect(33,0,1,1),cx.fillStyle="rgba(83,22,22,0)",cx.fillRect(34,0,1,1),cx.fillStyle="rgba(91,36,35,0)",cx.fillRect(35,0,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(36,0,1,1),cx.fillStyle="rgba(81,18,18,0)",cx.fillRect(37,0,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(38,0,1,1),cx.fillStyle="rgba(85,27,27,0)",cx.fillRect(39,0,1,1),cx.fillStyle="rgba(89,33,32,0)",cx.fillRect(40,0,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(41,0,1,1),cx.fillStyle="rgba(103,56,56,0)",cx.fillRect(42,0,1,1),cx.fillStyle="rgba(87,37,37,0)",cx.fillRect(43,0,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(44,0,1,1),cx.fillStyle="rgba(80,17,16,0)",cx.fillRect(45,0,1,1),cx.fillStyle="rgba(84,24,23,0)",cx.fillRect(46,0,1,1),cx.fillStyle="rgba(87,29,29,0)",cx.fillRect(47,0,1,1),cx.fillStyle="rgba(83,22,21,0)",cx.fillRect(48,0,1,1),cx.fillStyle="rgba(84,23,22,0)",cx.fillRect(49,0,1,1),cx.fillStyle="rgba(74,7,7,0)",cx.fillRect(50,0,1,1),cx.fillStyle="rgba(97,45,45,0)",cx.fillRect(51,0,1,1),cx.fillStyle="rgba(135,105,105,0)",cx.fillRect(52,0,1,1),cx.fillStyle="rgba(141,114,114,0)",cx.fillRect(53,0,1,1),cx.fillStyle="rgba(140,112,112,0)",cx.fillRect(54,0,1,1),cx.fillRect(55,0,1,1),cx.fillRect(56,0,1,1),cx.fillRect(57,0,1,1),cx.fillRect(58,0,1,1),cx.fillRect(59,0,1,1),cx.fillRect(60,0,1,1),cx.fillRect(61,0,1,1),cx.fillRect(62,0,1,1),cx.fillRect(63,0,1,1),cx.fillRect(64,0,1,1),cx.fillRect(65,0,1,1),cx.fillRect(66,0,1,1),cx.fillRect(67,0,1,1),cx.fillStyle="rgba(126,97,96,0)",cx.fillRect(0,1,1,1),cx.fillRect(1,1,1,1),cx.fillRect(2,1,1,1),cx.fillRect(3,1,1,1),cx.fillRect(4,1,1,1),cx.fillRect(5,1,1,1),cx.fillRect(6,1,1,1),cx.fillRect(7,1,1,1),cx.fillRect(8,1,1,1),cx.fillRect(9,1,1,1),cx.fillRect(10,1,1,1),cx.fillRect(11,1,1,1),cx.fillRect(12,1,1,1),cx.fillStyle="rgba(126,98,97,0)",cx.fillRect(13,1,1,1),cx.fillRect(14,1,1,1),cx.fillStyle="rgba(105,61,60,0)",cx.fillRect(15,1,1,1),cx.fillStyle="rgba(78,14,14,0.252)",cx.fillRect(16,1,1,1),cx.fillStyle="rgba(67,7,7,0.795)",cx.fillRect(17,1,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(18,1,1,1),cx.fillStyle="rgba(88,5,5,1)",cx.fillRect(19,1,1,1),cx.fillStyle="rgba(139,16,16,1)",cx.fillRect(20,1,1,1),cx.fillStyle="rgba(179,25,25,1)",cx.fillRect(21,1,1,1),cx.fillStyle="rgba(201,30,30,1)",cx.fillRect(22,1,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(23,1,1,1),cx.fillStyle="rgba(211,32,32,1)",cx.fillRect(24,1,1,1),cx.fillStyle="rgba(198,29,29,1)",cx.fillRect(25,1,1,1),cx.fillStyle="rgba(175,24,24,1)",cx.fillRect(26,1,1,1),cx.fillStyle="rgba(138,16,16,1)",cx.fillRect(27,1,1,1),cx.fillStyle="rgba(95,7,7,1)",cx.fillRect(28,1,1,1),cx.fillStyle="rgba(64,1,1,1)",cx.fillRect(29,1,1,1),cx.fillStyle="rgba(59,3,3,0.858)",cx.fillRect(30,1,1,1),cx.fillStyle="rgba(72,13,13,0.535)",cx.fillRect(31,1,1,1),cx.fillStyle="rgba(79,15,15,0.173)",cx.fillRect(32,1,1,1),cx.fillStyle="rgba(82,20,20,0)",cx.fillRect(33,1,1,1),cx.fillStyle="rgba(84,23,23,0)",cx.fillRect(34,1,1,1),cx.fillStyle="rgba(92,38,37,0)",cx.fillRect(35,1,1,1),cx.fillStyle="rgba(78,15,15,0)",cx.fillRect(36,1,1,1),cx.fillStyle="rgba(81,18,18,0)",cx.fillRect(37,1,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(38,1,1,1),cx.fillStyle="rgba(86,28,28,0)",cx.fillRect(39,1,1,1),cx.fillStyle="rgba(90,35,34,0)",cx.fillRect(40,1,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(41,1,1,1),cx.fillStyle="rgba(105,59,59,0)",cx.fillRect(42,1,1,1),cx.fillStyle="rgba(88,39,39,0)",cx.fillRect(43,1,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(44,1,1,1),cx.fillStyle="rgba(81,18,17,0)",cx.fillRect(45,1,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(46,1,1,1),cx.fillStyle="rgba(87,29,29,0)",cx.fillRect(47,1,1,1),cx.fillStyle="rgba(83,22,21,0)",cx.fillRect(48,1,1,1),cx.fillStyle="rgba(84,23,22,0)",cx.fillRect(49,1,1,1),cx.fillStyle="rgba(74,7,7,0)",cx.fillRect(50,1,1,1),cx.fillStyle="rgba(97,45,45,0)",cx.fillRect(51,1,1,1),cx.fillStyle="rgba(135,105,105,0)",cx.fillRect(52,1,1,1),cx.fillStyle="rgba(141,114,114,0)",cx.fillRect(53,1,1,1),cx.fillStyle="rgba(140,112,112,0)",cx.fillRect(54,1,1,1),cx.fillRect(55,1,1,1),cx.fillRect(56,1,1,1),cx.fillRect(57,1,1,1),cx.fillRect(58,1,1,1),cx.fillRect(59,1,1,1),cx.fillRect(60,1,1,1),cx.fillRect(61,1,1,1),cx.fillRect(62,1,1,1),cx.fillRect(63,1,1,1),cx.fillRect(64,1,1,1),cx.fillRect(65,1,1,1),cx.fillRect(66,1,1,1),cx.fillRect(67,1,1,1),cx.fillStyle="rgba(126,97,96,0)",cx.fillRect(0,2,1,1),cx.fillRect(1,2,1,1),cx.fillRect(2,2,1,1),cx.fillRect(3,2,1,1),cx.fillRect(4,2,1,1),cx.fillRect(5,2,1,1),cx.fillRect(6,2,1,1),cx.fillRect(7,2,1,1),cx.fillRect(8,2,1,1),cx.fillRect(9,2,1,1),cx.fillRect(10,2,1,1),cx.fillRect(11,2,1,1),cx.fillRect(12,2,1,1),cx.fillStyle="rgba(127,98,97,0)",cx.fillRect(13,2,1,1),cx.fillStyle="rgba(128,100,99,0)",cx.fillRect(14,2,1,1),cx.fillStyle="rgba(94,45,44,0.386)",cx.fillRect(15,2,1,1),cx.fillStyle="rgba(54,0,0,0.984)",cx.fillRect(16,2,1,1),cx.fillStyle="rgba(84,4,4,1)",cx.fillRect(17,2,1,1),cx.fillStyle="rgba(174,24,24,1)",cx.fillRect(18,2,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(19,2,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(20,2,1,1),cx.fillStyle="rgba(231,36,36,1)",cx.fillRect(21,2,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(22,2,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(23,2,1,1),cx.fillRect(24,2,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(25,2,1,1),cx.fillStyle="rgba(231,36,36,1)",cx.fillRect(26,2,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(27,2,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(28,2,1,1),cx.fillStyle="rgba(200,30,30,1)",cx.fillRect(29,2,1,1),cx.fillStyle="rgba(143,17,17,1)",cx.fillRect(30,2,1,1),cx.fillStyle="rgba(83,4,4,1)",cx.fillRect(31,2,1,1),cx.fillStyle="rgba(56,0,0,0.976)",cx.fillRect(32,2,1,1),cx.fillStyle="rgba(65,6,6,0.693)",cx.fillRect(33,2,1,1),cx.fillStyle="rgba(79,15,15,0.457)",cx.fillRect(34,2,1,1),cx.fillStyle="rgba(85,25,25,0.346)",cx.fillRect(35,2,1,1),cx.fillStyle="rgba(76,11,11,0.276)",cx.fillRect(36,2,1,1),cx.fillStyle="rgba(80,18,18,0.26)",cx.fillRect(37,2,1,1),cx.fillStyle="rgba(76,12,12,0.268)",cx.fillRect(38,2,1,1),cx.fillStyle="rgba(80,19,19,0.283)",cx.fillRect(39,2,1,1),cx.fillStyle="rgba(82,23,23,0.386)",cx.fillRect(40,2,1,1),cx.fillStyle="rgba(74,12,12,0.567)",cx.fillRect(41,2,1,1),cx.fillStyle="rgba(74,18,18,0.732)",cx.fillRect(42,2,1,1),cx.fillStyle="rgba(68,11,12,0.748)",cx.fillRect(43,2,1,1),cx.fillStyle="rgba(71,9,9,0.661)",cx.fillRect(44,2,1,1),cx.fillStyle="rgba(74,12,11,0.496)",cx.fillRect(45,2,1,1),cx.fillStyle="rgba(80,19,18,0.291)",cx.fillRect(46,2,1,1),cx.fillStyle="rgba(87,29,29,0.063)",cx.fillRect(47,2,1,1),cx.fillStyle="rgba(84,23,23,0)",cx.fillRect(48,2,1,1),cx.fillStyle="rgba(84,23,22,0)",cx.fillRect(49,2,1,1),cx.fillStyle="rgba(74,7,7,0)",cx.fillRect(50,2,1,1),cx.fillStyle="rgba(97,45,45,0)",cx.fillRect(51,2,1,1),cx.fillStyle="rgba(135,105,105,0)",cx.fillRect(52,2,1,1),cx.fillStyle="rgba(141,114,114,0)",cx.fillRect(53,2,1,1),cx.fillStyle="rgba(140,112,112,0)",cx.fillRect(54,2,1,1),cx.fillRect(55,2,1,1),cx.fillRect(56,2,1,1),cx.fillRect(57,2,1,1),cx.fillRect(58,2,1,1),cx.fillRect(59,2,1,1),cx.fillRect(60,2,1,1),cx.fillRect(61,2,1,1),cx.fillRect(62,2,1,1),cx.fillRect(63,2,1,1),cx.fillRect(64,2,1,1),cx.fillRect(65,2,1,1),cx.fillRect(66,2,1,1),cx.fillRect(67,2,1,1),cx.fillStyle="rgba(120,91,90,0)",cx.fillRect(0,3,1,1),cx.fillRect(1,3,1,1),cx.fillRect(2,3,1,1),cx.fillRect(3,3,1,1),cx.fillRect(4,3,1,1),cx.fillRect(5,3,1,1),cx.fillRect(6,3,1,1),cx.fillRect(7,3,1,1),cx.fillRect(8,3,1,1),cx.fillRect(9,3,1,1),cx.fillStyle="rgba(121,92,91,0)",cx.fillRect(10,3,1,1),cx.fillRect(11,3,1,1),cx.fillRect(12,3,1,1),cx.fillStyle="rgba(124,97,96,0)",cx.fillRect(13,3,1,1),cx.fillStyle="rgba(101,59,59,0.291)",cx.fillRect(14,3,1,1),cx.fillStyle="rgba(52,0,0,0.992)",cx.fillRect(15,3,1,1),cx.fillStyle="rgba(117,13,13,1)",cx.fillRect(16,3,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(17,3,1,1),cx.fillStyle="rgba(234,37,37,1)",cx.fillRect(18,3,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(19,3,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(20,3,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(21,3,1,1),cx.fillRect(22,3,1,1),cx.fillRect(23,3,1,1),cx.fillRect(24,3,1,1),cx.fillRect(25,3,1,1),cx.fillRect(26,3,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(27,3,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(28,3,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(29,3,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(30,3,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(31,3,1,1),cx.fillStyle="rgba(175,25,25,1)",cx.fillRect(32,3,1,1),cx.fillStyle="rgba(100,8,8,1)",cx.fillRect(33,3,1,1),cx.fillStyle="rgba(55,0,0,1)",cx.fillRect(34,3,1,1),cx.fillStyle="rgba(61,0,0,1)",cx.fillRect(35,3,1,1),cx.fillStyle="rgba(69,0,0,1)",cx.fillRect(36,3,1,1),cx.fillStyle="rgba(71,2,2,1)",cx.fillRect(37,3,1,1),cx.fillStyle="rgba(75,3,3,1)",cx.fillRect(38,3,1,1),cx.fillStyle="rgba(73,0,0,1)",cx.fillRect(39,3,1,1),cx.fillStyle="rgba(74,0,0,1)",cx.fillRect(40,3,1,1),cx.fillStyle="rgba(82,2,2,1)",cx.fillRect(41,3,1,1),cx.fillStyle="rgba(97,4,3,1)",cx.fillRect(42,3,1,1),cx.fillStyle="rgba(101,6,4,1)",cx.fillRect(43,3,1,1),cx.fillStyle="rgba(90,4,3,1)",cx.fillRect(44,3,1,1),cx.fillStyle="rgba(78,2,2,1)",cx.fillRect(45,3,1,1),cx.fillStyle="rgba(67,0,0,1)",cx.fillRect(46,3,1,1),cx.fillStyle="rgba(65,4,4,0.898)",cx.fillRect(47,3,1,1),cx.fillStyle="rgba(73,11,11,0.583)",cx.fillRect(48,3,1,1),cx.fillStyle="rgba(83,21,21,0.157)",cx.fillRect(49,3,1,1),cx.fillStyle="rgba(75,7,7,0)",cx.fillRect(50,3,1,1),cx.fillStyle="rgba(97,45,45,0)",cx.fillRect(51,3,1,1),cx.fillStyle="rgba(135,105,105,0)",cx.fillRect(52,3,1,1),cx.fillStyle="rgba(141,114,114,0)",cx.fillRect(53,3,1,1),cx.fillStyle="rgba(140,112,112,0)",cx.fillRect(54,3,1,1),cx.fillRect(55,3,1,1),cx.fillRect(56,3,1,1),cx.fillRect(57,3,1,1),cx.fillRect(58,3,1,1),cx.fillRect(59,3,1,1),cx.fillRect(60,3,1,1),cx.fillRect(61,3,1,1),cx.fillRect(62,3,1,1),cx.fillRect(63,3,1,1),cx.fillRect(64,3,1,1),cx.fillRect(65,3,1,1),cx.fillRect(66,3,1,1),cx.fillRect(67,3,1,1),cx.fillStyle="rgba(125,99,98,0)",cx.fillRect(0,4,1,1),cx.fillRect(1,4,1,1),cx.fillRect(2,4,1,1),cx.fillRect(3,4,1,1),cx.fillRect(4,4,1,1),cx.fillRect(5,4,1,1),cx.fillRect(6,4,1,1),cx.fillRect(7,4,1,1),cx.fillRect(8,4,1,1),cx.fillStyle="rgba(124,98,96,0)",cx.fillRect(9,4,1,1),cx.fillStyle="rgba(120,91,89,0)",cx.fillRect(10,4,1,1),cx.fillRect(11,4,1,1),cx.fillStyle="rgba(121,92,90,0)",cx.fillRect(12,4,1,1),cx.fillStyle="rgba(114,80,78,0.063)",cx.fillRect(13,4,1,1),cx.fillStyle="rgba(59,7,7,0.882)",cx.fillRect(14,4,1,1),cx.fillStyle="rgba(114,10,10,1)",cx.fillRect(15,4,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(16,4,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(17,4,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(18,4,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(19,4,1,1),cx.fillRect(20,4,1,1),cx.fillRect(21,4,1,1),cx.fillRect(22,4,1,1),cx.fillRect(23,4,1,1),cx.fillRect(24,4,1,1),cx.fillRect(25,4,1,1),cx.fillRect(26,4,1,1),cx.fillRect(27,4,1,1),cx.fillRect(28,4,1,1),cx.fillRect(29,4,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(30,4,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(31,4,1,1),cx.fillStyle="rgba(232,36,36,1)",cx.fillRect(32,4,1,1),cx.fillStyle="rgba(231,37,37,1)",cx.fillRect(33,4,1,1),cx.fillStyle="rgba(174,25,25,1)",cx.fillRect(34,4,1,1),cx.fillStyle="rgba(97,9,9,1)",cx.fillRect(35,4,1,1),cx.fillStyle="rgba(59,0,0,1)",cx.fillRect(36,4,1,1),cx.fillRect(37,4,1,1),cx.fillStyle="rgba(89,4,4,1)",cx.fillRect(38,4,1,1),cx.fillStyle="rgba(117,10,9,1)",cx.fillRect(39,4,1,1),cx.fillStyle="rgba(138,14,13,1)",cx.fillRect(40,4,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(41,4,1,1),cx.fillStyle="rgba(156,18,16,1)",cx.fillRect(42,4,1,1),cx.fillStyle="rgba(157,19,16,1)",cx.fillRect(43,4,1,1),cx.fillStyle="rgba(156,18,16,1)",cx.fillRect(44,4,1,1),cx.fillStyle="rgba(152,18,16,1)",cx.fillRect(45,4,1,1),cx.fillStyle="rgba(135,14,12,1)",cx.fillRect(46,4,1,1),cx.fillStyle="rgba(110,8,7,1)",cx.fillRect(47,4,1,1),cx.fillStyle="rgba(76,1,1,1)",cx.fillRect(48,4,1,1),cx.fillStyle="rgba(65,2,2,0.953)",cx.fillRect(49,4,1,1),cx.fillStyle="rgba(71,2,2,0.346)",cx.fillRect(50,4,1,1),cx.fillStyle="rgba(99,47,47,0)",cx.fillRect(51,4,1,1),cx.fillStyle="rgba(135,105,105,0)",cx.fillRect(52,4,1,1),cx.fillStyle="rgba(141,114,114,0)",cx.fillRect(53,4,1,1),cx.fillStyle="rgba(140,112,112,0)",cx.fillRect(54,4,1,1),cx.fillRect(55,4,1,1),cx.fillRect(56,4,1,1),cx.fillRect(57,4,1,1),cx.fillRect(58,4,1,1),cx.fillRect(59,4,1,1),cx.fillRect(60,4,1,1),cx.fillRect(61,4,1,1),cx.fillRect(62,4,1,1),cx.fillRect(63,4,1,1),cx.fillRect(64,4,1,1),cx.fillRect(65,4,1,1),cx.fillRect(66,4,1,1),cx.fillRect(67,4,1,1),cx.fillStyle="rgba(131,108,106,0)",cx.fillRect(0,5,1,1),cx.fillRect(1,5,1,1),cx.fillRect(2,5,1,1),cx.fillRect(3,5,1,1),cx.fillRect(4,5,1,1),cx.fillRect(5,5,1,1),cx.fillRect(6,5,1,1),cx.fillRect(7,5,1,1),cx.fillStyle="rgba(133,111,109,0)",cx.fillRect(8,5,1,1),cx.fillStyle="rgba(120,89,87,0)",cx.fillRect(9,5,1,1),cx.fillStyle="rgba(100,52,51,0)",cx.fillRect(10,5,1,1),cx.fillStyle="rgba(102,60,59,0)",cx.fillRect(11,5,1,1),cx.fillStyle="rgba(112,76,74,0)",cx.fillRect(12,5,1,1),cx.fillStyle="rgba(78,27,27,0.591)",cx.fillRect(13,5,1,1),cx.fillStyle="rgba(70,1,1,1)",cx.fillRect(14,5,1,1),cx.fillStyle="rgba(217,34,34,1)",cx.fillRect(15,5,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(16,5,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(17,5,1,1),cx.fillRect(18,5,1,1),cx.fillRect(19,5,1,1),cx.fillRect(20,5,1,1),cx.fillRect(21,5,1,1),cx.fillRect(22,5,1,1),cx.fillRect(23,5,1,1),cx.fillRect(24,5,1,1),cx.fillRect(25,5,1,1),cx.fillRect(26,5,1,1),cx.fillRect(27,5,1,1),cx.fillRect(28,5,1,1),cx.fillRect(29,5,1,1),cx.fillRect(30,5,1,1),cx.fillRect(31,5,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(32,5,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(33,5,1,1),cx.fillStyle="rgba(232,36,36,1)",cx.fillRect(34,5,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(35,5,1,1),cx.fillStyle="rgba(190,27,27,1)",cx.fillRect(36,5,1,1),cx.fillStyle="rgba(133,16,16,1)",cx.fillRect(37,5,1,1),cx.fillStyle="rgba(84,5,5,1)",cx.fillRect(38,5,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(39,5,1,1),cx.fillStyle="rgba(60,0,0,1)",cx.fillRect(40,5,1,1),cx.fillStyle="rgba(70,1,1,1)",cx.fillRect(41,5,1,1),cx.fillStyle="rgba(80,3,3,1)",cx.fillRect(42,5,1,1),cx.fillStyle="rgba(90,5,4,1)",cx.fillRect(43,5,1,1),cx.fillStyle="rgba(92,5,5,1)",cx.fillRect(44,5,1,1),cx.fillStyle="rgba(98,7,6,1)",cx.fillRect(45,5,1,1),cx.fillStyle="rgba(141,16,13,1)",cx.fillRect(46,5,1,1),cx.fillStyle="rgba(152,18,15,1)",cx.fillRect(47,5,1,1),cx.fillStyle="rgba(148,17,14,1)",cx.fillRect(48,5,1,1),cx.fillStyle="rgba(100,7,6,1)",cx.fillRect(49,5,1,1),cx.fillStyle="rgba(60,0,0,0.984)",cx.fillRect(50,5,1,1),cx.fillStyle="rgba(92,39,39,0.331)",cx.fillRect(51,5,1,1),cx.fillStyle="rgba(138,109,109,0)",cx.fillRect(52,5,1,1),cx.fillStyle="rgba(142,116,116,0)",cx.fillRect(53,5,1,1),cx.fillStyle="rgba(141,113,113,0)",cx.fillRect(54,5,1,1),cx.fillRect(55,5,1,1),cx.fillRect(56,5,1,1),cx.fillRect(57,5,1,1),cx.fillRect(58,5,1,1),cx.fillRect(59,5,1,1),cx.fillRect(60,5,1,1),cx.fillRect(61,5,1,1),cx.fillRect(62,5,1,1),cx.fillRect(63,5,1,1),cx.fillRect(64,5,1,1),cx.fillRect(65,5,1,1),cx.fillRect(66,5,1,1),cx.fillRect(67,5,1,1),cx.fillStyle="rgba(130,107,105,0)",cx.fillRect(0,6,1,1),cx.fillRect(1,6,1,1),cx.fillRect(2,6,1,1),cx.fillRect(3,6,1,1),cx.fillRect(4,6,1,1),cx.fillRect(5,6,1,1),cx.fillRect(6,6,1,1),cx.fillRect(7,6,1,1),cx.fillStyle="rgba(133,112,110,0)",cx.fillRect(8,6,1,1),cx.fillStyle="rgba(112,75,73,0)",cx.fillRect(9,6,1,1),cx.fillStyle="rgba(83,21,20,0)",cx.fillRect(10,6,1,1),cx.fillStyle="rgba(87,37,36,0)",cx.fillRect(11,6,1,1),cx.fillStyle="rgba(85,36,35,0.417)",cx.fillRect(12,6,1,1),cx.fillStyle="rgba(52,0,0,1)",cx.fillRect(13,6,1,1),cx.fillStyle="rgba(174,24,24,1)",cx.fillRect(14,6,1,1),cx.fillStyle="rgba(233,37,37,1)",cx.fillRect(15,6,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(16,6,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(17,6,1,1),cx.fillRect(18,6,1,1),cx.fillRect(19,6,1,1),cx.fillRect(20,6,1,1),cx.fillRect(21,6,1,1),cx.fillRect(22,6,1,1),cx.fillRect(23,6,1,1),cx.fillRect(24,6,1,1),cx.fillRect(25,6,1,1),cx.fillRect(26,6,1,1),cx.fillRect(27,6,1,1),cx.fillRect(28,6,1,1),cx.fillRect(29,6,1,1),cx.fillRect(30,6,1,1),cx.fillRect(31,6,1,1),cx.fillRect(32,6,1,1),cx.fillRect(33,6,1,1),cx.fillRect(34,6,1,1),cx.fillRect(35,6,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(36,6,1,1),cx.fillStyle="rgba(234,37,37,1)",cx.fillRect(37,6,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(38,6,1,1),cx.fillStyle="rgba(199,29,29,1)",cx.fillRect(39,6,1,1),cx.fillStyle="rgba(167,23,23,1)",cx.fillRect(40,6,1,1),cx.fillStyle="rgba(139,16,17,1)",cx.fillRect(41,6,1,1),cx.fillStyle="rgba(114,12,12,1)",cx.fillRect(42,6,1,1),cx.fillStyle="rgba(103,10,10,1)",cx.fillRect(43,6,1,1),cx.fillStyle="rgba(97,8,8,1)",cx.fillRect(44,6,1,1),cx.fillStyle="rgba(111,12,12,1)",cx.fillRect(45,6,1,1),cx.fillStyle="rgba(166,21,20,1)",cx.fillRect(46,6,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(47,6,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(48,6,1,1),cx.fillStyle="rgba(151,18,15,1)",cx.fillRect(49,6,1,1),cx.fillStyle="rgba(98,7,6,1)",cx.fillRect(50,6,1,1),cx.fillStyle="rgba(59,2,3,0.961)",cx.fillRect(51,6,1,1),cx.fillStyle="rgba(115,75,75,0.228)",cx.fillRect(52,6,1,1),cx.fillStyle="rgba(137,107,106,0)",cx.fillRect(53,6,1,1),cx.fillStyle="rgba(137,107,107,0)",cx.fillRect(54,6,1,1),cx.fillRect(55,6,1,1),cx.fillRect(56,6,1,1),cx.fillRect(57,6,1,1),cx.fillRect(58,6,1,1),cx.fillRect(59,6,1,1),cx.fillRect(60,6,1,1),cx.fillRect(61,6,1,1),cx.fillRect(62,6,1,1),cx.fillRect(63,6,1,1),cx.fillRect(64,6,1,1),cx.fillRect(65,6,1,1),cx.fillRect(66,6,1,1),cx.fillRect(67,6,1,1),cx.fillStyle="rgba(130,107,105,0)",cx.fillRect(0,7,1,1),cx.fillRect(1,7,1,1),cx.fillRect(2,7,1,1),cx.fillRect(3,7,1,1),cx.fillRect(4,7,1,1),cx.fillRect(5,7,1,1),cx.fillRect(6,7,1,1),cx.fillRect(7,7,1,1),cx.fillStyle="rgba(133,112,110,0)",cx.fillRect(8,7,1,1),cx.fillStyle="rgba(113,77,75,0)",cx.fillRect(9,7,1,1),cx.fillStyle="rgba(86,27,26,0)",cx.fillRect(10,7,1,1),cx.fillStyle="rgba(82,28,27,0.362)",cx.fillRect(11,7,1,1),cx.fillStyle="rgba(49,0,0,0.992)",cx.fillRect(12,7,1,1),cx.fillStyle="rgba(142,17,17,1)",cx.fillRect(13,7,1,1),cx.fillStyle="rgba(236,37,37,1)",cx.fillRect(14,7,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(15,7,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(16,7,1,1),cx.fillRect(17,7,1,1),cx.fillRect(18,7,1,1),cx.fillRect(19,7,1,1),cx.fillRect(20,7,1,1),cx.fillRect(21,7,1,1),cx.fillRect(22,7,1,1),cx.fillRect(23,7,1,1),cx.fillRect(24,7,1,1),cx.fillRect(25,7,1,1),cx.fillRect(26,7,1,1),cx.fillRect(27,7,1,1),cx.fillRect(28,7,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(29,7,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(30,7,1,1),cx.fillStyle="rgba(232,36,36,1)",cx.fillRect(31,7,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(32,7,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(33,7,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(34,7,1,1),cx.fillRect(35,7,1,1),cx.fillRect(36,7,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(37,7,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(38,7,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(39,7,1,1),cx.fillStyle="rgba(231,36,36,1)";cx.fillRect(40,7,1,1),cx.fillStyle="rgba(234,37,37,1)",cx.fillRect(41,7,1,1),cx.fillStyle="rgba(233,37,37,1)",cx.fillRect(42,7,1,1),cx.fillStyle="rgba(231,36,36,1)",cx.fillRect(43,7,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(44,7,1,1),cx.fillStyle="rgba(232,37,37,1)",cx.fillRect(45,7,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(46,7,1,1),cx.fillStyle="rgba(181,25,24,1)",cx.fillRect(47,7,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(48,7,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(49,7,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(50,7,1,1),cx.fillStyle="rgba(88,4,3,1)",cx.fillRect(51,7,1,1),cx.fillStyle="rgba(60,1,1,0.89)",cx.fillRect(52,7,1,1),cx.fillStyle="rgba(102,55,54,0.134)",cx.fillRect(53,7,1,1),cx.fillStyle="rgba(127,90,89,0)",cx.fillRect(54,7,1,1),cx.fillStyle="rgba(123,84,83,0)",cx.fillRect(55,7,1,1),cx.fillRect(56,7,1,1),cx.fillRect(57,7,1,1),cx.fillRect(58,7,1,1),cx.fillRect(59,7,1,1),cx.fillRect(60,7,1,1),cx.fillRect(61,7,1,1),cx.fillRect(62,7,1,1),cx.fillRect(63,7,1,1),cx.fillRect(64,7,1,1),cx.fillRect(65,7,1,1),cx.fillRect(66,7,1,1),cx.fillRect(67,7,1,1),cx.fillStyle="rgba(131,108,106,0)",cx.fillRect(0,8,1,1),cx.fillRect(1,8,1,1),cx.fillRect(2,8,1,1),cx.fillRect(3,8,1,1),cx.fillRect(4,8,1,1),cx.fillRect(5,8,1,1),cx.fillRect(6,8,1,1),cx.fillRect(7,8,1,1),cx.fillStyle="rgba(134,114,112,0)",cx.fillRect(8,8,1,1),cx.fillStyle="rgba(117,82,80,0)",cx.fillRect(9,8,1,1),cx.fillStyle="rgba(72,10,9,0.496)",cx.fillRect(10,8,1,1),cx.fillStyle="rgba(53,1,1,0.992)",cx.fillRect(11,8,1,1),cx.fillStyle="rgba(131,15,15,1)",cx.fillRect(12,8,1,1),cx.fillStyle="rgba(234,36,36,1)",cx.fillRect(13,8,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(14,8,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(15,8,1,1),cx.fillRect(16,8,1,1),cx.fillRect(17,8,1,1),cx.fillRect(18,8,1,1),cx.fillRect(19,8,1,1),cx.fillRect(20,8,1,1),cx.fillRect(21,8,1,1),cx.fillRect(22,8,1,1),cx.fillRect(23,8,1,1),cx.fillRect(24,8,1,1),cx.fillRect(25,8,1,1),cx.fillRect(26,8,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(27,8,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(28,8,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(29,8,1,1),cx.fillStyle="rgba(194,29,29,1)",cx.fillRect(30,8,1,1),cx.fillStyle="rgba(97,10,10,1)",cx.fillRect(31,8,1,1),cx.fillStyle="rgba(202,30,30,1)",cx.fillRect(32,8,1,1),cx.fillStyle="rgba(237,37,37,1)",cx.fillRect(33,8,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(34,8,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(35,8,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(36,8,1,1),cx.fillRect(37,8,1,1),cx.fillRect(38,8,1,1),cx.fillRect(39,8,1,1),cx.fillRect(40,8,1,1),cx.fillRect(41,8,1,1),cx.fillRect(42,8,1,1),cx.fillRect(43,8,1,1),cx.fillStyle="rgba(223,34,34,1)",cx.fillRect(44,8,1,1),cx.fillStyle="rgba(213,32,32,1)",cx.fillRect(45,8,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(46,8,1,1),cx.fillStyle="rgba(235,38,38,1)",cx.fillRect(47,8,1,1),cx.fillStyle="rgba(192,27,27,1)",cx.fillRect(48,8,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(49,8,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(50,8,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(51,8,1,1),cx.fillStyle="rgba(77,2,1,1)",cx.fillRect(52,8,1,1),cx.fillStyle="rgba(70,15,15,0.795)",cx.fillRect(53,8,1,1),cx.fillStyle="rgba(107,62,61,0.047)",cx.fillRect(54,8,1,1),cx.fillStyle="rgba(119,79,78,0)",cx.fillRect(55,8,1,1),cx.fillStyle="rgba(120,80,79,0)",cx.fillRect(56,8,1,1),cx.fillRect(57,8,1,1),cx.fillRect(58,8,1,1),cx.fillRect(59,8,1,1),cx.fillRect(60,8,1,1),cx.fillRect(61,8,1,1),cx.fillRect(62,8,1,1),cx.fillRect(63,8,1,1),cx.fillRect(64,8,1,1),cx.fillRect(65,8,1,1),cx.fillRect(66,8,1,1),cx.fillRect(67,8,1,1),cx.fillStyle="rgba(119,88,86,0)",cx.fillRect(0,9,1,1),cx.fillRect(1,9,1,1),cx.fillRect(2,9,1,1),cx.fillRect(3,9,1,1),cx.fillRect(4,9,1,1),cx.fillRect(5,9,1,1),cx.fillRect(6,9,1,1),cx.fillStyle="rgba(120,90,88,0)",cx.fillRect(7,9,1,1),cx.fillStyle="rgba(118,87,85,0)",cx.fillRect(8,9,1,1),cx.fillStyle="rgba(81,31,31,0.551)",cx.fillRect(9,9,1,1),cx.fillStyle="rgba(57,0,0,1)",cx.fillRect(10,9,1,1),cx.fillStyle="rgba(143,18,18,1)",cx.fillRect(11,9,1,1),cx.fillStyle="rgba(233,37,37,1)",cx.fillRect(12,9,1,1),cx.fillStyle="rgba(223,34,34,1)",cx.fillRect(13,9,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(14,9,1,1),cx.fillRect(15,9,1,1),cx.fillRect(16,9,1,1),cx.fillRect(17,9,1,1),cx.fillRect(18,9,1,1),cx.fillRect(19,9,1,1),cx.fillRect(20,9,1,1),cx.fillRect(21,9,1,1),cx.fillRect(22,9,1,1),cx.fillRect(23,9,1,1),cx.fillRect(24,9,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(25,9,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(26,9,1,1),cx.fillStyle="rgba(216,33,33,1)",cx.fillRect(27,9,1,1),cx.fillStyle="rgba(219,33,33,1)",cx.fillRect(28,9,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(29,9,1,1),cx.fillStyle="rgba(211,32,32,1)",cx.fillRect(30,9,1,1),cx.fillStyle="rgba(84,7,7,1)",cx.fillRect(31,9,1,1),cx.fillStyle="rgba(59,2,2,1)",cx.fillRect(32,9,1,1),cx.fillStyle="rgba(149,19,19,1)",cx.fillRect(33,9,1,1),cx.fillStyle="rgba(219,34,34,1)",cx.fillRect(34,9,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(35,9,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(36,9,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(37,9,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(38,9,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(39,9,1,1),cx.fillRect(40,9,1,1),cx.fillRect(41,9,1,1),cx.fillRect(42,9,1,1),cx.fillRect(43,9,1,1),cx.fillRect(44,9,1,1),cx.fillStyle="rgba(223,34,34,1)",cx.fillRect(45,9,1,1),cx.fillStyle="rgba(182,25,24,1)",cx.fillRect(46,9,1,1),cx.fillStyle="rgba(189,27,26,1)",cx.fillRect(47,9,1,1),cx.fillStyle="rgba(236,38,38,1)",cx.fillRect(48,9,1,1),cx.fillStyle="rgba(204,30,30,1)",cx.fillRect(49,9,1,1),cx.fillStyle="rgba(142,16,14,1)",cx.fillRect(50,9,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(51,9,1,1),cx.fillStyle="rgba(138,15,13,1)",cx.fillRect(52,9,1,1),cx.fillStyle="rgba(67,0,0,1)",cx.fillRect(53,9,1,1),cx.fillStyle="rgba(68,13,12,0.654)",cx.fillRect(54,9,1,1),cx.fillStyle="rgba(115,74,73,0)",cx.fillRect(55,9,1,1),cx.fillStyle="rgba(118,76,76,0)",cx.fillRect(56,9,1,1),cx.fillStyle="rgba(115,72,72,0)",cx.fillRect(57,9,1,1),cx.fillStyle="rgba(115,72,73,0)",cx.fillRect(58,9,1,1),cx.fillRect(59,9,1,1),cx.fillRect(60,9,1,1),cx.fillRect(61,9,1,1),cx.fillRect(62,9,1,1),cx.fillRect(63,9,1,1),cx.fillRect(64,9,1,1),cx.fillRect(65,9,1,1),cx.fillRect(66,9,1,1),cx.fillRect(67,9,1,1),cx.fillStyle="rgba(113,79,77,0)",cx.fillRect(0,10,1,1),cx.fillRect(1,10,1,1),cx.fillRect(2,10,1,1),cx.fillRect(3,10,1,1),cx.fillRect(4,10,1,1),cx.fillRect(5,10,1,1),cx.fillStyle="rgba(113,80,79,0)",cx.fillRect(6,10,1,1),cx.fillStyle="rgba(117,85,83,0)",cx.fillRect(7,10,1,1),cx.fillStyle="rgba(96,53,51,0.346)",cx.fillRect(8,10,1,1),cx.fillStyle="rgba(54,0,0,1)",cx.fillRect(9,10,1,1),cx.fillStyle="rgba(172,24,24,1)",cx.fillRect(10,10,1,1),cx.fillStyle="rgba(238,37,37,1)",cx.fillRect(11,10,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(12,10,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(13,10,1,1),cx.fillRect(14,10,1,1),cx.fillRect(15,10,1,1),cx.fillRect(16,10,1,1),cx.fillRect(17,10,1,1),cx.fillRect(18,10,1,1),cx.fillRect(19,10,1,1),cx.fillRect(20,10,1,1),cx.fillRect(21,10,1,1),cx.fillRect(22,10,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(23,10,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(24,10,1,1),cx.fillStyle="rgba(214,32,32,1)",cx.fillRect(25,10,1,1),cx.fillStyle="rgba(176,23,23,1)",cx.fillRect(26,10,1,1),cx.fillStyle="rgba(181,25,24,1)",cx.fillRect(27,10,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(28,10,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(29,10,1,1),cx.fillStyle="rgba(231,36,36,1)",cx.fillRect(30,10,1,1),cx.fillStyle="rgba(197,29,28,1)",cx.fillRect(31,10,1,1),cx.fillStyle="rgba(95,7,6,1)",cx.fillRect(32,10,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(33,10,1,1),cx.fillStyle="rgba(70,3,3,1)",cx.fillRect(34,10,1,1),cx.fillStyle="rgba(136,17,17,1)",cx.fillRect(35,10,1,1),cx.fillStyle="rgba(199,30,30,1)",cx.fillRect(36,10,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(37,10,1,1),cx.fillStyle="rgba(234,37,37,1)",cx.fillRect(38,10,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(39,10,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(40,10,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(41,10,1,1),cx.fillRect(42,10,1,1),cx.fillRect(43,10,1,1),cx.fillRect(44,10,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(45,10,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(46,10,1,1),cx.fillStyle="rgba(168,22,21,1)",cx.fillRect(47,10,1,1),cx.fillStyle="rgba(170,22,21,1)",cx.fillRect(48,10,1,1),cx.fillStyle="rgba(233,37,37,1)",cx.fillRect(49,10,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(50,10,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(51,10,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(52,10,1,1),cx.fillStyle="rgba(128,13,11,1)",cx.fillRect(53,10,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(54,10,1,1),cx.fillStyle="rgba(85,32,32,0.504)",cx.fillRect(55,10,1,1),cx.fillStyle="rgba(113,71,70,0)",cx.fillRect(56,10,1,1),cx.fillStyle="rgba(121,80,80,0)",cx.fillRect(57,10,1,1),cx.fillStyle="rgba(120,79,79,0)",cx.fillRect(58,10,1,1),cx.fillRect(59,10,1,1),cx.fillRect(60,10,1,1),cx.fillRect(61,10,1,1),cx.fillRect(62,10,1,1),cx.fillRect(63,10,1,1),cx.fillRect(64,10,1,1),cx.fillRect(65,10,1,1),cx.fillRect(66,10,1,1),cx.fillRect(67,10,1,1),cx.fillStyle="rgba(106,68,67,0)",cx.fillRect(0,11,1,1),cx.fillRect(1,11,1,1),cx.fillRect(2,11,1,1),cx.fillRect(3,11,1,1),cx.fillRect(4,11,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(5,11,1,1),cx.fillStyle="rgba(99,55,54,0)",cx.fillRect(6,11,1,1),cx.fillStyle="rgba(97,52,51,0.016)",cx.fillRect(7,11,1,1),cx.fillStyle="rgba(61,10,10,0.866)",cx.fillRect(8,11,1,1),cx.fillStyle="rgba(126,12,12,1)",cx.fillRect(9,11,1,1),cx.fillStyle="rgba(239,38,38,1)",cx.fillRect(10,11,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(11,11,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(12,11,1,1),cx.fillRect(13,11,1,1),cx.fillRect(14,11,1,1),cx.fillRect(15,11,1,1),cx.fillRect(16,11,1,1),cx.fillRect(17,11,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(18,11,1,1),cx.fillStyle="rgba(223,34,35,1)",cx.fillRect(19,11,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(20,11,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(21,11,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(22,11,1,1),cx.fillStyle="rgba(202,30,29,1)",cx.fillRect(23,11,1,1),cx.fillStyle="rgba(166,21,20,1)",cx.fillRect(24,11,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(25,11,1,1),cx.fillStyle="rgba(146,16,15,1)",cx.fillRect(26,11,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(27,11,1,1),cx.fillStyle="rgba(223,34,35,1)",cx.fillRect(28,11,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(29,11,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(30,11,1,1),cx.fillStyle="rgba(159,20,18,1)",cx.fillRect(31,11,1,1),cx.fillStyle="rgba(147,17,14,1)",cx.fillRect(32,11,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(33,11,1,1),cx.fillStyle="rgba(103,8,7,1)",cx.fillRect(34,11,1,1),cx.fillStyle="rgba(63,0,0,1)",cx.fillRect(35,11,1,1),cx.fillStyle="rgba(57,0,0,1)",cx.fillRect(36,11,1,1),cx.fillStyle="rgba(93,8,8,1)",cx.fillRect(37,11,1,1),cx.fillStyle="rgba(155,21,21,1)",cx.fillRect(38,11,1,1),cx.fillStyle="rgba(218,33,33,1)",cx.fillRect(39,11,1,1),cx.fillStyle="rgba(232,36,36,1)",cx.fillRect(40,11,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(41,11,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(42,11,1,1),cx.fillRect(43,11,1,1),cx.fillRect(44,11,1,1),cx.fillRect(45,11,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(46,11,1,1),cx.fillStyle="rgba(227,36,36,1)",cx.fillRect(47,11,1,1),cx.fillStyle="rgba(158,19,18,1)",cx.fillRect(48,11,1,1),cx.fillStyle="rgba(150,18,16,1)",cx.fillRect(49,11,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(50,11,1,1),cx.fillStyle="rgba(217,33,33,1)",cx.fillRect(51,11,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(52,11,1,1),cx.fillStyle="rgba(149,17,14,1)",cx.fillRect(53,11,1,1),cx.fillStyle="rgba(115,10,9,1)",cx.fillRect(54,11,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(55,11,1,1),cx.fillStyle="rgba(94,44,44,0.339)",cx.fillRect(56,11,1,1),cx.fillStyle="rgba(134,98,97,0)",cx.fillRect(57,11,1,1),cx.fillStyle="rgba(130,93,92,0)",cx.fillRect(58,11,1,1),cx.fillStyle="rgba(129,92,91,0)",cx.fillRect(59,11,1,1),cx.fillRect(60,11,1,1),cx.fillRect(61,11,1,1),cx.fillRect(62,11,1,1),cx.fillRect(63,11,1,1),cx.fillRect(64,11,1,1),cx.fillRect(65,11,1,1),cx.fillRect(66,11,1,1),cx.fillRect(67,11,1,1),cx.fillStyle="rgba(103,60,59,0)",cx.fillRect(0,12,1,1),cx.fillRect(1,12,1,1),cx.fillRect(2,12,1,1),cx.fillRect(3,12,1,1),cx.fillRect(4,12,1,1),cx.fillStyle="rgba(106,65,63,0)",cx.fillRect(5,12,1,1),cx.fillStyle="rgba(92,40,40,0)",cx.fillRect(6,12,1,1),cx.fillStyle="rgba(72,10,9,0.48)",cx.fillRect(7,12,1,1),cx.fillStyle="rgba(63,1,1,1)",cx.fillRect(8,12,1,1),cx.fillStyle="rgba(204,31,31,1)",cx.fillRect(9,12,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(10,12,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(11,12,1,1),cx.fillStyle="rgba(228,35,36,1)",cx.fillRect(12,12,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(13,12,1,1),cx.fillStyle="rgba(227,36,36,1)",cx.fillRect(14,12,1,1),cx.fillRect(15,12,1,1),cx.fillRect(16,12,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(17,12,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(18,12,1,1),cx.fillStyle="rgba(216,33,33,1)",cx.fillRect(19,12,1,1),cx.fillStyle="rgba(203,30,29,1)",cx.fillRect(20,12,1,1),cx.fillStyle="rgba(182,25,24,1)",cx.fillRect(21,12,1,1),cx.fillStyle="rgba(155,18,17,1)",cx.fillRect(22,12,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(23,12,1,1),cx.fillStyle="rgba(131,13,11,1)",cx.fillRect(24,12,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(25,12,1,1),cx.fillStyle="rgba(213,32,32,1)",cx.fillRect(26,12,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(27,12,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(28,12,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(29,12,1,1),cx.fillStyle="rgba(189,27,26,1)",cx.fillRect(30,12,1,1),cx.fillStyle="rgba(137,15,12,1)",cx.fillRect(31,12,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(32,12,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(33,12,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(34,12,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(35,12,1,1),cx.fillStyle="rgba(122,12,10,1)",cx.fillRect(36,12,1,1),cx.fillStyle="rgba(87,5,4,1)",cx.fillRect(37,12,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(38,12,1,1),cx.fillStyle="rgba(71,4,4,1)",cx.fillRect(39,12,1,1),cx.fillStyle="rgba(175,25,25,1)",cx.fillRect(40,12,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(41,12,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(42,12,1,1),cx.fillRect(43,12,1,1),cx.fillRect(44,12,1,1),cx.fillRect(45,12,1,1),cx.fillRect(46,12,1,1),cx.fillStyle="rgba(223,35,35,1)",cx.fillRect(47,12,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(48,12,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(49,12,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(50,12,1,1),cx.fillStyle="rgba(215,33,32,1)",cx.fillRect(51,12,1,1),cx.fillStyle="rgba(214,32,32,1)",cx.fillRect(52,12,1,1),cx.fillStyle="rgba(142,15,14,1)",cx.fillRect(53,12,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(54,12,1,1),cx.fillStyle="rgba(99,7,5,1)",cx.fillRect(55,12,1,1),cx.fillStyle="rgba(63,5,5,0.945)",cx.fillRect(56,12,1,1),cx.fillStyle="rgba(89,39,39,0.197)",cx.fillRect(57,12,1,1),cx.fillStyle="rgba(105,59,59,0)",cx.fillRect(58,12,1,1),cx.fillStyle="rgba(115,71,70,0)",cx.fillRect(59,12,1,1),cx.fillStyle="rgba(114,70,69,0)",cx.fillRect(60,12,1,1),cx.fillRect(61,12,1,1),cx.fillRect(62,12,1,1),cx.fillRect(63,12,1,1),cx.fillRect(64,12,1,1),cx.fillRect(65,12,1,1),cx.fillRect(66,12,1,1),cx.fillRect(67,12,1,1),cx.fillStyle="rgba(119,87,86,0)",cx.fillRect(0,13,1,1),cx.fillRect(1,13,1,1),cx.fillRect(2,13,1,1),cx.fillRect(3,13,1,1),cx.fillRect(4,13,1,1),cx.fillStyle="rgba(118,86,85,0)",cx.fillRect(5,13,1,1),cx.fillStyle="rgba(83,28,27,0.528)",cx.fillRect(6,13,1,1),cx.fillStyle="rgba(58,0,0,1)",cx.fillRect(7,13,1,1),cx.fillStyle="rgba(107,10,10,1)",cx.fillRect(8,13,1,1),cx.fillStyle="rgba(232,37,37,1)",cx.fillRect(9,13,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(10,13,1,1),cx.fillStyle="rgba(193,28,27,1)",cx.fillRect(11,13,1,1),cx.fillStyle="rgba(180,25,23,1)",cx.fillRect(12,13,1,1),cx.fillStyle="rgba(178,24,23,1)",cx.fillRect(13,13,1,1),cx.fillStyle="rgba(176,23,22,1)",cx.fillRect(14,13,1,1),cx.fillStyle="rgba(173,23,22,1)",cx.fillRect(15,13,1,1),cx.fillStyle="rgba(170,22,21,1)",cx.fillRect(16,13,1,1),cx.fillStyle="rgba(161,20,18,1)",cx.fillRect(17,13,1,1),cx.fillStyle="rgba(153,18,17,1)",cx.fillRect(18,13,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(19,13,1,1),cx.fillStyle="rgba(136,14,12,1)",cx.fillRect(20,13,1,1),cx.fillStyle="rgba(132,13,11,1)",cx.fillRect(21,13,1,1),cx.fillStyle="rgba(134,14,12,1)",cx.fillRect(22,13,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(23,13,1,1),cx.fillStyle="rgba(179,25,23,1)",cx.fillRect(24,13,1,1),cx.fillStyle="rgba(218,34,34,1)",cx.fillRect(25,13,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(26,13,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(27,13,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(28,13,1,1),cx.fillStyle="rgba(198,29,29,1)",cx.fillRect(29,13,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(30,13,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(31,13,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(32,13,1,1),cx.fillRect(33,13,1,1),cx.fillRect(34,13,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(35,13,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(36,13,1,1),cx.fillStyle="rgba(151,18,15,1)",cx.fillRect(37,13,1,1),cx.fillStyle="rgba(141,16,13,1)",cx.fillRect(38,13,1,1),cx.fillStyle="rgba(91,6,5,1)",cx.fillRect(39,13,1,1),cx.fillStyle="rgba(49,0,0,1)",cx.fillRect(40,13,1,1),cx.fillStyle="rgba(146,19,19,1)",cx.fillRect(41,13,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(42,13,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(43,13,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(44,13,1,1),cx.fillRect(45,13,1,1),cx.fillRect(46,13,1,1),cx.fillRect(47,13,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(48,13,1,1),cx.fillStyle="rgba(216,33,33,1)",cx.fillRect(49,13,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(50,13,1,1),cx.fillStyle="rgba(139,15,12,1)",cx.fillRect(51,13,1,1),cx.fillStyle="rgba(218,34,33,1)",cx.fillRect(52,13,1,1),cx.fillStyle="rgba(205,30,30,1)",cx.fillRect(53,13,1,1),cx.fillStyle="rgba(139,15,12,1)",cx.fillRect(54,13,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(55,13,1,1),cx.fillStyle="rgba(87,3,3,1)",cx.fillRect(56,13,1,1),cx.fillStyle="rgba(55,0,0,0.89)",cx.fillRect(57,13,1,1),cx.fillStyle="rgba(88,37,37,0.142)",cx.fillRect(58,13,1,1),cx.fillStyle="rgba(107,59,58,0)",cx.fillRect(59,13,1,1),cx.fillStyle="rgba(104,55,54,0)",cx.fillRect(60,13,1,1),cx.fillRect(61,13,1,1),cx.fillRect(62,13,1,1),cx.fillRect(63,13,1,1),cx.fillRect(64,13,1,1),cx.fillRect(65,13,1,1),cx.fillRect(66,13,1,1),cx.fillRect(67,13,1,1),cx.fillStyle="rgba(102,59,58,0)",cx.fillRect(0,14,1,1),cx.fillRect(1,14,1,1),cx.fillRect(2,14,1,1),cx.fillRect(3,14,1,1),cx.fillStyle="rgba(103,60,59,0)",cx.fillRect(4,14,1,1),cx.fillStyle="rgba(99,54,53,0.181)",cx.fillRect(5,14,1,1),cx.fillStyle="rgba(67,0,0,0.992)",cx.fillRect(6,14,1,1),cx.fillStyle="rgba(53,0,0,1)",cx.fillRect(7,14,1,1),cx.fillStyle="rgba(168,23,23,1)",cx.fillRect(8,14,1,1),cx.fillStyle="rgba(243,39,39,1)",cx.fillRect(9,14,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(10,14,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(11,14,1,1),cx.fillStyle="rgba(189,26,26,1)",cx.fillRect(12,14,1,1),cx.fillStyle="rgba(168,21,20,1)",cx.fillRect(13,14,1,1),cx.fillStyle="rgba(152,18,16,1)",cx.fillRect(14,14,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(15,14,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(16,14,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(17,14,1,1),cx.fillStyle="rgba(142,16,14,1)",cx.fillRect(18,14,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(19,14,1,1),cx.fillStyle="rgba(157,19,17,1)",cx.fillRect(20,14,1,1),cx.fillStyle="rgba(173,23,21,1)",cx.fillRect(21,14,1,1),cx.fillStyle="rgba(196,28,28,1)",cx.fillRect(22,14,1,1),cx.fillStyle="rgba(219,34,34,1)",cx.fillRect(23,14,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(24,14,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(25,14,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(26,14,1,1),cx.fillStyle="rgba(223,35,35,1)",cx.fillRect(27,14,1,1),cx.fillStyle="rgba(182,25,24,1)",cx.fillRect(28,14,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(29,14,1,1),cx.fillStyle="rgba(142,16,14,1)",cx.fillRect(30,14,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(31,14,1,1),cx.fillRect(32,14,1,1),cx.fillRect(33,14,1,1),cx.fillRect(34,14,1,1),cx.fillRect(35,14,1,1),cx.fillRect(36,14,1,1),cx.fillRect(37,14,1,1),cx.fillStyle="rgba(146,17,14,1)",cx.fillRect(38,14,1,1),cx.fillStyle="rgba(152,18,15,1)",cx.fillRect(39,14,1,1),cx.fillStyle="rgba(110,10,8,1)",cx.fillRect(40,14,1,1),cx.fillStyle="rgba(47,0,0,1)",cx.fillRect(41,14,1,1),cx.fillStyle="rgba(141,17,17,1)",cx.fillRect(42,14,1,1),cx.fillStyle="rgba(236,37,37,1)",cx.fillRect(43,14,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(44,14,1,1),cx.fillRect(45,14,1,1),cx.fillRect(46,14,1,1),cx.fillRect(47,14,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(48,14,1,1);cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(49,14,1,1),cx.fillStyle="rgba(215,32,32,1)",cx.fillRect(50,14,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(51,14,1,1),cx.fillStyle="rgba(142,15,14,1)",cx.fillRect(52,14,1,1),cx.fillStyle="rgba(223,34,35,1)",cx.fillRect(53,14,1,1),cx.fillStyle="rgba(182,25,24,1)",cx.fillRect(54,14,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(55,14,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(56,14,1,1),cx.fillStyle="rgba(80,3,2,1)",cx.fillRect(57,14,1,1),cx.fillStyle="rgba(68,13,13,0.811)",cx.fillRect(58,14,1,1),cx.fillStyle="rgba(105,57,56,0.047)",cx.fillRect(59,14,1,1),cx.fillStyle="rgba(110,63,62,0)",cx.fillRect(60,14,1,1),cx.fillStyle="rgba(109,62,61,0)",cx.fillRect(61,14,1,1),cx.fillRect(62,14,1,1),cx.fillRect(63,14,1,1),cx.fillRect(64,14,1,1),cx.fillRect(65,14,1,1),cx.fillRect(66,14,1,1),cx.fillRect(67,14,1,1),cx.fillStyle="rgba(82,22,22,0)",cx.fillRect(0,15,1,1),cx.fillRect(1,15,1,1),cx.fillRect(2,15,1,1),cx.fillRect(3,15,1,1),cx.fillStyle="rgba(83,24,24,0)",cx.fillRect(4,15,1,1),cx.fillStyle="rgba(73,9,9,0.488)",cx.fillRect(5,15,1,1),cx.fillStyle="rgba(83,26,27,1)",cx.fillRect(6,15,1,1),cx.fillStyle="rgba(70,19,20,1)",cx.fillRect(7,15,1,1),cx.fillStyle="rgba(99,3,2,1)",cx.fillRect(8,15,1,1),cx.fillStyle="rgba(187,27,26,1)",cx.fillRect(9,15,1,1),cx.fillStyle="rgba(215,33,32,1)",cx.fillRect(10,15,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(11,15,1,1),cx.fillStyle="rgba(231,36,36,1)",cx.fillRect(12,15,1,1),cx.fillStyle="rgba(235,37,38,1)",cx.fillRect(13,15,1,1),cx.fillStyle="rgba(231,36,37,1)",cx.fillRect(14,15,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(15,15,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(16,15,1,1),cx.fillStyle="rgba(216,33,33,1)",cx.fillRect(17,15,1,1),cx.fillStyle="rgba(218,33,33,1)",cx.fillRect(18,15,1,1),cx.fillStyle="rgba(223,34,35,1)",cx.fillRect(19,15,1,1),cx.fillStyle="rgba(227,36,36,1)",cx.fillRect(20,15,1,1),cx.fillStyle="rgba(232,37,37,1)",cx.fillRect(21,15,1,1),cx.fillStyle="rgba(232,36,37,1)",cx.fillRect(22,15,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(23,15,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(24,15,1,1),cx.fillStyle="rgba(217,33,33,1)",cx.fillRect(25,15,1,1),cx.fillStyle="rgba(189,26,26,1)",cx.fillRect(26,15,1,1),cx.fillStyle="rgba(153,18,17,1)",cx.fillRect(27,15,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(28,15,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(29,15,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(30,15,1,1),cx.fillRect(31,15,1,1),cx.fillRect(32,15,1,1),cx.fillRect(33,15,1,1),cx.fillRect(34,15,1,1),cx.fillRect(35,15,1,1),cx.fillRect(36,15,1,1),cx.fillRect(37,15,1,1),cx.fillRect(38,15,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(39,15,1,1),cx.fillStyle="rgba(155,19,16,1)",cx.fillRect(40,15,1,1),cx.fillStyle="rgba(120,11,10,1)",cx.fillRect(41,15,1,1),cx.fillStyle="rgba(53,0,0,1)",cx.fillRect(42,15,1,1),cx.fillStyle="rgba(153,21,21,1)",cx.fillRect(43,15,1,1),cx.fillStyle="rgba(237,37,37,1)",cx.fillRect(44,15,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(45,15,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(46,15,1,1),cx.fillRect(47,15,1,1),cx.fillRect(48,15,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(49,15,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(50,15,1,1),cx.fillStyle="rgba(213,32,32,1)",cx.fillRect(51,15,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(52,15,1,1),cx.fillStyle="rgba(153,18,17,1)",cx.fillRect(53,15,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(54,15,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(55,15,1,1),cx.fillStyle="rgba(146,17,14,1)",cx.fillRect(56,15,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(57,15,1,1),cx.fillStyle="rgba(67,0,0,1)",cx.fillRect(58,15,1,1),cx.fillStyle="rgba(83,30,30,0.575)",cx.fillRect(59,15,1,1),cx.fillStyle="rgba(119,79,79,0)",cx.fillRect(60,15,1,1),cx.fillStyle="rgba(117,76,75,0)",cx.fillRect(61,15,1,1),cx.fillStyle="rgba(116,76,75,0)",cx.fillRect(62,15,1,1),cx.fillRect(63,15,1,1),cx.fillRect(64,15,1,1),cx.fillRect(65,15,1,1),cx.fillRect(66,15,1,1),cx.fillRect(67,15,1,1),cx.fillStyle="rgba(84,27,27,0)",cx.fillRect(0,16,1,1),cx.fillRect(1,16,1,1),cx.fillRect(2,16,1,1),cx.fillRect(3,16,1,1),cx.fillStyle="rgba(85,29,28,0)",cx.fillRect(4,16,1,1),cx.fillStyle="rgba(65,2,1,0.638)",cx.fillRect(5,16,1,1),cx.fillStyle="rgba(123,84,85,1)",cx.fillRect(6,16,1,1),cx.fillStyle="rgba(208,196,196,1)",cx.fillRect(7,16,1,1),cx.fillStyle="rgba(76,39,40,1)",cx.fillRect(8,16,1,1),cx.fillStyle="rgba(45,0,0,1)",cx.fillRect(9,16,1,1),cx.fillStyle="rgba(87,0,0,1)",cx.fillRect(10,16,1,1),cx.fillStyle="rgba(133,12,11,1)",cx.fillRect(11,16,1,1),cx.fillStyle="rgba(163,20,19,1)",cx.fillRect(12,16,1,1),cx.fillStyle="rgba(176,23,22,1)",cx.fillRect(13,16,1,1),cx.fillStyle="rgba(191,27,26,1)",cx.fillRect(14,16,1,1),cx.fillStyle="rgba(198,29,28,1)",cx.fillRect(15,16,1,1),cx.fillStyle="rgba(205,30,30,1)",cx.fillRect(16,16,1,1),cx.fillStyle="rgba(209,31,31,1)",cx.fillRect(17,16,1,1),cx.fillRect(18,16,1,1),cx.fillRect(19,16,1,1),cx.fillStyle="rgba(207,31,31,1)",cx.fillRect(20,16,1,1),cx.fillStyle="rgba(201,29,29,1)",cx.fillRect(21,16,1,1),cx.fillStyle="rgba(192,28,27,1)",cx.fillRect(22,16,1,1),cx.fillStyle="rgba(180,24,23,1)",cx.fillRect(23,16,1,1),cx.fillStyle="rgba(162,20,19,1)",cx.fillRect(24,16,1,1),cx.fillStyle="rgba(145,16,15,1)",cx.fillRect(25,16,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(26,16,1,1),cx.fillStyle="rgba(141,15,13,1)",cx.fillRect(27,16,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(28,16,1,1),cx.fillRect(29,16,1,1),cx.fillRect(30,16,1,1),cx.fillRect(31,16,1,1),cx.fillRect(32,16,1,1),cx.fillRect(33,16,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(34,16,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(35,16,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(36,16,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(37,16,1,1),cx.fillRect(38,16,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(39,16,1,1),cx.fillStyle="rgba(130,13,11,1)",cx.fillRect(40,16,1,1),cx.fillStyle="rgba(109,5,4,1)",cx.fillRect(41,16,1,1),cx.fillStyle="rgba(66,0,0,1)",cx.fillRect(42,16,1,1),cx.fillStyle="rgba(53,0,0,1)",cx.fillRect(43,16,1,1),cx.fillStyle="rgba(176,25,25,1)",cx.fillRect(44,16,1,1),cx.fillStyle="rgba(234,36,36,1)",cx.fillRect(45,16,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(46,16,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(47,16,1,1),cx.fillRect(48,16,1,1),cx.fillRect(49,16,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(50,16,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(51,16,1,1),cx.fillStyle="rgba(202,30,29,1)",cx.fillRect(52,16,1,1),cx.fillStyle="rgba(130,13,10,1)",cx.fillRect(53,16,1,1),cx.fillStyle="rgba(192,27,27,1)",cx.fillRect(54,16,1,1),cx.fillStyle="rgba(183,25,24,1)",cx.fillRect(55,16,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(56,16,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(57,16,1,1),cx.fillStyle="rgba(116,10,8,1)",cx.fillRect(58,16,1,1),cx.fillStyle="rgba(61,2,2,0.984)",cx.fillRect(59,16,1,1),cx.fillStyle="rgba(98,50,50,0.189)",cx.fillRect(60,16,1,1),cx.fillStyle="rgba(106,60,60,0)",cx.fillRect(61,16,1,1),cx.fillStyle="rgba(105,59,58,0)",cx.fillRect(62,16,1,1),cx.fillRect(63,16,1,1),cx.fillRect(64,16,1,1),cx.fillRect(65,16,1,1),cx.fillRect(66,16,1,1),cx.fillRect(67,16,1,1),cx.fillStyle="rgba(117,84,84,0)",cx.fillRect(0,17,1,1),cx.fillRect(1,17,1,1),cx.fillRect(2,17,1,1),cx.fillRect(3,17,1,1),cx.fillStyle="rgba(120,88,87,0)",cx.fillRect(4,17,1,1),cx.fillStyle="rgba(68,8,8,0.732)",cx.fillRect(5,17,1,1),cx.fillStyle="rgba(137,96,97,1)",cx.fillRect(6,17,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(7,17,1,1),cx.fillStyle="rgba(245,238,240,1)",cx.fillRect(8,17,1,1),cx.fillStyle="rgba(170,148,148,1)",cx.fillRect(9,17,1,1),cx.fillStyle="rgba(89,51,51,1)",cx.fillRect(10,17,1,1),cx.fillStyle="rgba(54,0,0,1)",cx.fillRect(11,17,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(12,17,1,1),cx.fillStyle="rgba(71,0,0,1)",cx.fillRect(13,17,1,1),cx.fillStyle="rgba(92,0,0,1)",cx.fillRect(14,17,1,1),cx.fillStyle="rgba(112,6,4,1)",cx.fillRect(15,17,1,1),cx.fillStyle="rgba(129,12,10,1)",cx.fillRect(16,17,1,1),cx.fillStyle="rgba(142,15,14,1)",cx.fillRect(17,17,1,1),cx.fillStyle="rgba(147,16,14,1)",cx.fillRect(18,17,1,1),cx.fillStyle="rgba(148,17,14,1)",cx.fillRect(19,17,1,1),cx.fillStyle="rgba(147,17,14,1)",cx.fillRect(20,17,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(21,17,1,1),cx.fillStyle="rgba(142,16,13,1)",cx.fillRect(22,17,1,1),cx.fillStyle="rgba(143,16,13,1)",cx.fillRect(23,17,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(24,17,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(25,17,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(26,17,1,1),cx.fillRect(27,17,1,1),cx.fillRect(28,17,1,1),cx.fillRect(29,17,1,1),cx.fillRect(30,17,1,1),cx.fillRect(31,17,1,1),cx.fillRect(32,17,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(33,17,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(34,17,1,1),cx.fillStyle="rgba(137,14,12,1)",cx.fillRect(35,17,1,1),cx.fillStyle="rgba(125,9,8,1)",cx.fillRect(36,17,1,1),cx.fillStyle="rgba(109,5,4,1)",cx.fillRect(37,17,1,1),cx.fillStyle="rgba(91,0,0,1)",cx.fillRect(38,17,1,1),cx.fillStyle="rgba(71,0,0,1)",cx.fillRect(39,17,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(40,17,1,1),cx.fillStyle="rgba(69,21,21,1)",cx.fillRect(41,17,1,1),cx.fillStyle="rgba(99,76,75,1)",cx.fillRect(42,17,1,1),cx.fillStyle="rgba(89,63,61,1)",cx.fillRect(43,17,1,1),cx.fillStyle="rgba(59,0,0,1)",cx.fillRect(44,17,1,1),cx.fillStyle="rgba(197,29,29,1)",cx.fillRect(45,17,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(46,17,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(47,17,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(48,17,1,1),cx.fillRect(49,17,1,1),cx.fillRect(50,17,1,1),cx.fillRect(51,17,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(52,17,1,1),cx.fillStyle="rgba(167,21,20,1)",cx.fillRect(53,17,1,1),cx.fillStyle="rgba(156,19,17,1)",cx.fillRect(54,17,1,1),cx.fillStyle="rgba(211,31,31,1)",cx.fillRect(55,17,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(56,17,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(57,17,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(58,17,1,1),cx.fillStyle="rgba(80,1,1,1)",cx.fillRect(59,17,1,1),cx.fillStyle="rgba(77,20,19,0.638)",cx.fillRect(60,17,1,1),cx.fillStyle="rgba(102,52,52,0)",cx.fillRect(61,17,1,1),cx.fillStyle="rgba(99,49,48,0)",cx.fillRect(62,17,1,1),cx.fillRect(63,17,1,1),cx.fillRect(64,17,1,1),cx.fillRect(65,17,1,1),cx.fillRect(66,17,1,1),cx.fillRect(67,17,1,1),cx.fillStyle="rgba(114,78,77,0)",cx.fillRect(0,18,1,1),cx.fillRect(1,18,1,1),cx.fillRect(2,18,1,1),cx.fillRect(3,18,1,1),cx.fillStyle="rgba(115,80,79,0)",cx.fillRect(4,18,1,1),cx.fillStyle="rgba(67,10,10,0.732)",cx.fillRect(5,18,1,1),cx.fillStyle="rgba(135,93,94,1)",cx.fillRect(6,18,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(7,18,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(8,18,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(9,18,1,1),cx.fillStyle="rgba(254,249,251,1)",cx.fillRect(10,18,1,1),cx.fillStyle="rgba(209,195,196,1)",cx.fillRect(11,18,1,1),cx.fillStyle="rgba(161,138,139,1)",cx.fillRect(12,18,1,1),cx.fillStyle="rgba(125,88,88,1)",cx.fillRect(13,18,1,1),cx.fillStyle="rgba(88,44,44,1)",cx.fillRect(14,18,1,1),cx.fillStyle="rgba(65,12,12,1)",cx.fillRect(15,18,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(16,18,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(17,18,1,1),cx.fillStyle="rgba(79,0,0,1)",cx.fillRect(18,18,1,1),cx.fillStyle="rgba(95,0,0,1)",cx.fillRect(19,18,1,1),cx.fillStyle="rgba(107,3,2,1)",cx.fillRect(20,18,1,1),cx.fillStyle="rgba(114,6,4,1)",cx.fillRect(21,18,1,1),cx.fillStyle="rgba(117,7,6,1)",cx.fillRect(22,18,1,1),cx.fillStyle="rgba(119,8,6,1)",cx.fillRect(23,18,1,1),cx.fillStyle="rgba(116,7,5,1)",cx.fillRect(24,18,1,1),cx.fillStyle="rgba(113,5,4,1)",cx.fillRect(25,18,1,1),cx.fillStyle="rgba(108,3,2,1)",cx.fillRect(26,18,1,1),cx.fillStyle="rgba(103,1,0,1)",cx.fillRect(27,18,1,1),cx.fillStyle="rgba(97,0,0,1)",cx.fillRect(28,18,1,1),cx.fillStyle="rgba(93,0,0,1)",cx.fillRect(29,18,1,1),cx.fillStyle="rgba(89,0,0,1)",cx.fillRect(30,18,1,1),cx.fillStyle="rgba(87,0,0,1)",cx.fillRect(31,18,1,1),cx.fillStyle="rgba(83,0,0,1)",cx.fillRect(32,18,1,1),cx.fillStyle="rgba(71,0,0,1)",cx.fillRect(33,18,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(34,18,1,1),cx.fillStyle="rgba(57,0,0,1)",cx.fillRect(35,18,1,1),cx.fillStyle="rgba(61,6,6,1)",cx.fillRect(36,18,1,1),cx.fillStyle="rgba(68,19,18,1)",cx.fillRect(37,18,1,1),cx.fillStyle="rgba(81,48,46,1)",cx.fillRect(38,18,1,1),cx.fillStyle="rgba(102,90,87,1)",cx.fillRect(39,18,1,1),cx.fillStyle="rgba(122,130,128,1)",cx.fillRect(40,18,1,1),cx.fillStyle="rgba(136,161,157,1)",cx.fillRect(41,18,1,1),cx.fillStyle="rgba(143,175,171,1)",cx.fillRect(42,18,1,1),cx.fillStyle="rgba(141,171,167,1)",cx.fillRect(43,18,1,1),cx.fillStyle="rgba(74,41,39,1)",cx.fillRect(44,18,1,1),cx.fillStyle="rgba(79,0,1,1)",cx.fillRect(45,18,1,1),cx.fillStyle="rgba(222,35,35,1)",cx.fillRect(46,18,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(47,18,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(48,18,1,1),cx.fillRect(49,18,1,1),cx.fillRect(50,18,1,1),cx.fillRect(51,18,1,1),cx.fillStyle="rgba(223,34,34,1)",cx.fillRect(52,18,1,1),cx.fillStyle="rgba(218,34,33,1)",cx.fillRect(53,18,1,1),cx.fillStyle="rgba(161,20,18,1)",cx.fillRect(54,18,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(55,18,1,1),cx.fillStyle="rgba(153,18,17,1)",cx.fillRect(56,18,1,1),cx.fillStyle="rgba(141,15,13,1)",cx.fillRect(57,18,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(58,18,1,1),cx.fillStyle="rgba(114,9,8,1)",cx.fillRect(59,18,1,1),cx.fillStyle="rgba(64,4,4,0.929)",cx.fillRect(60,18,1,1),cx.fillStyle="rgba(100,50,50,0.087)",cx.fillRect(61,18,1,1),cx.fillStyle="rgba(102,52,53,0)",cx.fillRect(62,18,1,1),cx.fillStyle="rgba(101,52,52,0)",cx.fillRect(63,18,1,1),cx.fillRect(64,18,1,1),cx.fillRect(65,18,1,1),cx.fillRect(66,18,1,1),cx.fillRect(67,18,1,1),cx.fillStyle="rgba(73,12,11,0)",cx.fillRect(0,19,1,1),cx.fillRect(1,19,1,1),cx.fillRect(2,19,1,1),cx.fillStyle="rgba(74,12,12,0)",cx.fillRect(3,19,1,1),cx.fillStyle="rgba(74,12,12,0.339)",cx.fillRect(4,19,1,1),cx.fillStyle="rgba(53,0,0,0.961)",cx.fillRect(5,19,1,1),cx.fillStyle="rgba(137,103,104,1)",cx.fillRect(6,19,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(7,19,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(8,19,1,1),cx.fillRect(9,19,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(10,19,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(11,19,1,1),cx.fillRect(12,19,1,1),cx.fillRect(13,19,1,1),cx.fillStyle="rgba(253,247,249,1)",cx.fillRect(14,19,1,1),cx.fillStyle="rgba(230,220,222,1)",cx.fillRect(15,19,1,1),cx.fillStyle="rgba(200,182,183,1)",cx.fillRect(16,19,1,1),cx.fillStyle="rgba(159,134,136,1)",cx.fillRect(17,19,1,1),cx.fillStyle="rgba(121,83,83,1)",cx.fillRect(18,19,1,1),cx.fillStyle="rgba(93,54,54,1)",cx.fillRect(19,19,1,1),cx.fillStyle="rgba(77,29,30,1)",cx.fillRect(20,19,1,1),cx.fillStyle="rgba(72,16,16,1)",cx.fillRect(21,19,1,1),cx.fillStyle="rgba(70,11,12,1)",cx.fillRect(22,19,1,1),cx.fillStyle="rgba(67,10,10,1)",cx.fillRect(23,19,1,1),cx.fillStyle="rgba(70,12,12,1)",cx.fillRect(24,19,1,1),cx.fillStyle="rgba(73,18,18,1)",cx.fillRect(25,19,1,1),cx.fillStyle="rgba(77,28,28,1)",cx.fillRect(26,19,1,1),cx.fillStyle="rgba(81,38,38,1)",cx.fillRect(27,19,1,1),cx.fillStyle="rgba(88,48,48,1)",cx.fillRect(28,19,1,1),cx.fillStyle="rgba(99,59,59,1)",cx.fillRect(29,19,1,1),cx.fillStyle="rgba(109,68,69,1)",cx.fillRect(30,19,1,1),cx.fillStyle="rgba(115,73,73,1)",cx.fillRect(31,19,1,1),cx.fillStyle="rgba(120,78,78,1)",cx.fillRect(32,19,1,1),cx.fillStyle="rgba(135,102,103,1)",cx.fillRect(33,19,1,1),cx.fillStyle="rgba(161,138,139,1)",cx.fillRect(34,19,1,1),cx.fillStyle="rgba(195,175,176,1)",cx.fillRect(35,19,1,1),cx.fillStyle="rgba(223,211,213,1)",cx.fillRect(36,19,1,1),cx.fillStyle="rgba(188,198,196,1)",cx.fillRect(37,19,1,1),cx.fillStyle="rgba(131,164,159,1)",cx.fillRect(38,19,1,1),cx.fillStyle="rgba(142,173,169,1)",cx.fillRect(39,19,1,1),cx.fillStyle="rgba(139,168,163,1)",cx.fillRect(40,19,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(41,19,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(42,19,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(43,19,1,1),cx.fillStyle="rgba(132,150,146,1)",cx.fillRect(44,19,1,1),cx.fillStyle="rgba(56,12,12,1)",cx.fillRect(45,19,1,1),cx.fillStyle="rgba(124,11,11,1)",cx.fillRect(46,19,1,1),cx.fillStyle="rgba(235,37,37,1)",cx.fillRect(47,19,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(48,19,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(49,19,1,1),cx.fillRect(50,19,1,1),cx.fillRect(51,19,1,1),cx.fillRect(52,19,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(53,19,1,1),cx.fillStyle="rgba(190,27,26,1)",cx.fillRect(54,19,1,1),cx.fillStyle="rgba(219,34,34,1)",cx.fillRect(55,19,1,1),cx.fillStyle="rgba(173,23,21,1)",cx.fillRect(56,19,1,1),cx.fillStyle="rgba(138,15,13,1)",cx.fillRect(57,19,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(58,19,1,1),cx.fillStyle="rgba(138,15,13,1)",cx.fillRect(59,19,1,1),cx.fillStyle="rgba(68,0,0,1)",cx.fillRect(60,19,1,1),cx.fillStyle="rgba(88,32,32,0.323)",cx.fillRect(61,19,1,1),cx.fillStyle="rgba(99,47,47,0)",cx.fillRect(62,19,1,1),cx.fillStyle="rgba(97,45,45,0)",cx.fillRect(63,19,1,1),cx.fillRect(64,19,1,1),cx.fillRect(65,19,1,1),cx.fillRect(66,19,1,1),cx.fillRect(67,19,1,1),cx.fillStyle="rgba(87,35,35,0)",cx.fillRect(0,20,1,1),cx.fillRect(1,20,1,1),cx.fillRect(2,20,1,1),cx.fillStyle="rgba(88,37,37,0)",cx.fillRect(3,20,1,1),cx.fillStyle="rgba(79,19,18,0.465)",cx.fillRect(4,20,1,1),cx.fillStyle="rgba(66,8,8,1)",cx.fillRect(5,20,1,1),cx.fillStyle="rgba(205,193,194,1)",cx.fillRect(6,20,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(7,20,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(8,20,1,1),cx.fillRect(9,20,1,1),cx.fillRect(10,20,1,1),cx.fillRect(11,20,1,1),cx.fillRect(12,20,1,1),cx.fillRect(13,20,1,1),cx.fillStyle="rgba(255,249,253,1)",cx.fillRect(14,20,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(15,20,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(16,20,1,1),cx.fillRect(17,20,1,1),cx.fillRect(18,20,1,1),cx.fillStyle="rgba(255,250,252,1)",cx.fillRect(19,20,1,1),cx.fillStyle="rgba(247,240,242,1)",cx.fillRect(20,20,1,1),cx.fillStyle="rgba(240,230,232,1)",cx.fillRect(21,20,1,1),cx.fillStyle="rgba(235,224,226,1)",cx.fillRect(22,20,1,1),cx.fillStyle="rgba(232,221,222,1)",cx.fillRect(23,20,1,1),cx.fillStyle="rgba(236,225,227,1)",cx.fillRect(24,20,1,1),cx.fillStyle="rgba(241,232,234,1)",cx.fillRect(25,20,1,1),cx.fillStyle="rgba(246,240,241,1)",cx.fillRect(26,20,1,1),cx.fillStyle="rgba(250,243,245,1)",cx.fillRect(27,20,1,1),cx.fillStyle="rgba(253,247,249,1)",cx.fillRect(28,20,1,1),cx.fillStyle="rgba(255,252,254,1)",cx.fillRect(29,20,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(30,20,1,1),cx.fillRect(31,20,1,1),cx.fillRect(32,20,1,1),cx.fillRect(33,20,1,1),cx.fillRect(34,20,1,1),cx.fillRect(35,20,1,1),cx.fillRect(36,20,1,1),cx.fillStyle="rgba(247,247,248,1)",cx.fillRect(37,20,1,1),cx.fillStyle="rgba(142,164,161,1)",cx.fillRect(38,20,1,1),cx.fillStyle="rgba(133,157,153,1)",cx.fillRect(39,20,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(40,20,1,1),cx.fillRect(41,20,1,1),cx.fillRect(42,20,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(43,20,1,1),cx.fillStyle="rgba(142,173,169,1)",cx.fillRect(44,20,1,1),cx.fillStyle="rgba(112,108,106,1)",cx.fillRect(45,20,1,1),cx.fillStyle="rgba(52,0,0,1)",cx.fillRect(46,20,1,1),cx.fillStyle="rgba(186,27,27,1)",cx.fillRect(47,20,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(48,20,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(49,20,1,1),cx.fillRect(50,20,1,1),cx.fillRect(51,20,1,1),cx.fillRect(52,20,1,1),cx.fillStyle="rgba(223,34,35,1)",cx.fillRect(53,20,1,1),cx.fillStyle="rgba(211,32,31,1)",cx.fillRect(54,20,1,1),cx.fillStyle="rgba(220,34,34,1)",cx.fillRect(55,20,1,1),cx.fillStyle="rgba(191,27,26,1)",cx.fillRect(56,20,1,1),cx.fillStyle="rgba(137,15,12,1)",cx.fillRect(57,20,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(58,20,1,1),cx.fillRect(59,20,1,1),cx.fillStyle="rgba(76,1,1,1)",cx.fillRect(60,20,1,1),cx.fillStyle="rgba(85,28,27,0.441)",cx.fillRect(61,20,1,1),cx.fillStyle="rgba(101,49,48,0)",cx.fillRect(62,20,1,1),cx.fillStyle="rgba(99,46,46,0)",cx.fillRect(63,20,1,1),cx.fillRect(64,20,1,1),cx.fillRect(65,20,1,1),cx.fillRect(66,20,1,1),cx.fillRect(67,20,1,1),cx.fillStyle="rgba(94,43,42,0)",cx.fillRect(0,21,1,1),cx.fillRect(1,21,1,1),cx.fillRect(2,21,1,1),cx.fillStyle="rgba(95,45,44,0)",cx.fillRect(3,21,1,1),cx.fillStyle="rgba(80,21,21,0.394)",cx.fillRect(4,21,1,1),cx.fillStyle="rgba(83,26,26,1)",cx.fillRect(5,21,1,1),cx.fillStyle="rgba(250,243,246,1)",cx.fillRect(6,21,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(7,21,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(8,21,1,1),cx.fillRect(9,21,1,1),cx.fillRect(10,21,1,1),cx.fillRect(11,21,1,1),cx.fillRect(12,21,1,1),cx.fillRect(13,21,1,1),cx.fillRect(14,21,1,1),cx.fillRect(15,21,1,1),cx.fillRect(16,21,1,1),cx.fillRect(17,21,1,1),cx.fillRect(18,21,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(19,21,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(20,21,1,1),cx.fillStyle="rgba(255,252,255,1)",cx.fillRect(21,21,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(22,21,1,1),cx.fillRect(23,21,1,1),cx.fillRect(24,21,1,1),cx.fillStyle="rgba(255,252,255,1)",cx.fillRect(25,21,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(26,21,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(27,21,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(28,21,1,1),cx.fillStyle="rgba(255,248,252,1)",cx.fillRect(29,21,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(30,21,1,1),cx.fillStyle="rgba(255,247,251,1)",cx.fillRect(31,21,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(32,21,1,1);cx.fillRect(33,21,1,1),cx.fillRect(34,21,1,1),cx.fillRect(35,21,1,1),cx.fillRect(36,21,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(37,21,1,1),cx.fillStyle="rgba(192,204,203,1)",cx.fillRect(38,21,1,1),cx.fillStyle="rgba(126,152,148,1)",cx.fillRect(39,21,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(40,21,1,1),cx.fillRect(41,21,1,1),cx.fillRect(42,21,1,1),cx.fillRect(43,21,1,1),cx.fillRect(44,21,1,1),cx.fillStyle="rgba(142,173,168,1)",cx.fillRect(45,21,1,1),cx.fillStyle="rgba(78,47,46,1)",cx.fillRect(46,21,1,1),cx.fillStyle="rgba(90,2,2,1)",cx.fillRect(47,21,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(48,21,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(49,21,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(50,21,1,1),cx.fillRect(51,21,1,1),cx.fillRect(52,21,1,1),cx.fillRect(53,21,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(54,21,1,1),cx.fillStyle="rgba(226,35,35,1)",cx.fillRect(55,21,1,1),cx.fillStyle="rgba(203,29,29,1)",cx.fillRect(56,21,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(57,21,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(58,21,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(59,21,1,1),cx.fillStyle="rgba(79,3,2,1)",cx.fillRect(60,21,1,1),cx.fillStyle="rgba(70,5,5,0.457)",cx.fillRect(61,21,1,1),cx.fillStyle="rgba(75,9,8,0)",cx.fillRect(62,21,1,1),cx.fillStyle="rgba(74,8,8,0)",cx.fillRect(63,21,1,1),cx.fillRect(64,21,1,1),cx.fillRect(65,21,1,1),cx.fillRect(66,21,1,1),cx.fillRect(67,21,1,1),cx.fillStyle="rgba(89,35,35,0)",cx.fillRect(0,22,1,1),cx.fillRect(1,22,1,1),cx.fillRect(2,22,1,1),cx.fillStyle="rgba(91,38,37,0)",cx.fillRect(3,22,1,1),cx.fillStyle="rgba(71,10,9,0.583)",cx.fillRect(4,22,1,1),cx.fillStyle="rgba(100,56,56,1)",cx.fillRect(5,22,1,1),cx.fillStyle="rgba(255,252,254,1)",cx.fillRect(6,22,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(7,22,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(8,22,1,1),cx.fillRect(9,22,1,1),cx.fillRect(10,22,1,1),cx.fillRect(11,22,1,1),cx.fillRect(12,22,1,1),cx.fillRect(13,22,1,1),cx.fillRect(14,22,1,1),cx.fillRect(15,22,1,1),cx.fillRect(16,22,1,1),cx.fillRect(17,22,1,1),cx.fillRect(18,22,1,1),cx.fillRect(19,22,1,1),cx.fillRect(20,22,1,1),cx.fillRect(21,22,1,1),cx.fillRect(22,22,1,1),cx.fillRect(23,22,1,1),cx.fillRect(24,22,1,1),cx.fillRect(25,22,1,1),cx.fillRect(26,22,1,1),cx.fillRect(27,22,1,1),cx.fillRect(28,22,1,1),cx.fillRect(29,22,1,1),cx.fillRect(30,22,1,1),cx.fillRect(31,22,1,1),cx.fillRect(32,22,1,1),cx.fillRect(33,22,1,1),cx.fillRect(34,22,1,1),cx.fillRect(35,22,1,1),cx.fillRect(36,22,1,1),cx.fillStyle="rgba(255,249,253,1)",cx.fillRect(37,22,1,1),cx.fillStyle="rgba(239,239,240,1)",cx.fillRect(38,22,1,1),cx.fillStyle="rgba(135,160,156,1)",cx.fillRect(39,22,1,1),cx.fillStyle="rgba(134,159,155,1)",cx.fillRect(40,22,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,22,1,1),cx.fillRect(42,22,1,1),cx.fillRect(43,22,1,1),cx.fillRect(44,22,1,1),cx.fillStyle="rgba(139,168,163,1)",cx.fillRect(45,22,1,1),cx.fillStyle="rgba(126,137,134,1)",cx.fillRect(46,22,1,1),cx.fillStyle="rgba(52,2,2,1)",cx.fillRect(47,22,1,1),cx.fillStyle="rgba(168,21,21,1)",cx.fillRect(48,22,1,1),cx.fillStyle="rgba(233,36,36,1)",cx.fillRect(49,22,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(50,22,1,1),cx.fillRect(51,22,1,1),cx.fillRect(52,22,1,1),cx.fillRect(53,22,1,1),cx.fillRect(54,22,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(55,22,1,1),cx.fillStyle="rgba(211,32,32,1)",cx.fillRect(56,22,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(57,22,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(58,22,1,1),cx.fillStyle="rgba(146,17,14,1)",cx.fillRect(59,22,1,1),cx.fillStyle="rgba(80,3,3,1)",cx.fillRect(60,22,1,1),cx.fillStyle="rgba(65,0,0,0.457)",cx.fillRect(61,22,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(62,22,1,1),cx.fillRect(63,22,1,1),cx.fillRect(64,22,1,1),cx.fillRect(65,22,1,1),cx.fillRect(66,22,1,1),cx.fillRect(67,22,1,1),cx.fillStyle="rgba(97,48,48,0)",cx.fillRect(0,23,1,1),cx.fillRect(1,23,1,1),cx.fillRect(2,23,1,1),cx.fillStyle="rgba(98,50,50,0)",cx.fillRect(3,23,1,1),cx.fillStyle="rgba(65,2,1,0.732)",cx.fillRect(4,23,1,1),cx.fillStyle="rgba(128,90,90,1)",cx.fillRect(5,23,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,23,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(7,23,1,1),cx.fillRect(8,23,1,1),cx.fillRect(9,23,1,1),cx.fillRect(10,23,1,1),cx.fillRect(11,23,1,1),cx.fillRect(12,23,1,1),cx.fillRect(13,23,1,1),cx.fillRect(14,23,1,1),cx.fillRect(15,23,1,1),cx.fillRect(16,23,1,1),cx.fillRect(17,23,1,1),cx.fillRect(18,23,1,1),cx.fillRect(19,23,1,1),cx.fillRect(20,23,1,1),cx.fillRect(21,23,1,1),cx.fillRect(22,23,1,1),cx.fillRect(23,23,1,1),cx.fillRect(24,23,1,1),cx.fillRect(25,23,1,1),cx.fillRect(26,23,1,1),cx.fillRect(27,23,1,1),cx.fillRect(28,23,1,1),cx.fillRect(29,23,1,1),cx.fillRect(30,23,1,1),cx.fillRect(31,23,1,1),cx.fillRect(32,23,1,1),cx.fillRect(33,23,1,1),cx.fillRect(34,23,1,1),cx.fillRect(35,23,1,1),cx.fillRect(36,23,1,1),cx.fillRect(37,23,1,1),cx.fillStyle="rgba(255,252,255,1)",cx.fillRect(38,23,1,1),cx.fillStyle="rgba(164,182,180,1)",cx.fillRect(39,23,1,1),cx.fillStyle="rgba(129,155,151,1)",cx.fillRect(40,23,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,23,1,1),cx.fillRect(42,23,1,1),cx.fillRect(43,23,1,1),cx.fillRect(44,23,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(45,23,1,1),cx.fillStyle="rgba(142,174,170,1)",cx.fillRect(46,23,1,1),cx.fillStyle="rgba(84,59,58,1)",cx.fillRect(47,23,1,1),cx.fillStyle="rgba(87,1,1,1)",cx.fillRect(48,23,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(49,23,1,1),cx.fillStyle="rgba(222,34,34,1)",cx.fillRect(50,23,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(51,23,1,1),cx.fillRect(52,23,1,1),cx.fillRect(53,23,1,1),cx.fillRect(54,23,1,1),cx.fillStyle="rgba(223,35,35,1)",cx.fillRect(55,23,1,1),cx.fillStyle="rgba(213,32,32,1)",cx.fillRect(56,23,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(57,23,1,1),cx.fillRect(58,23,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(59,23,1,1),cx.fillStyle="rgba(79,2,2,1)",cx.fillRect(60,23,1,1),cx.fillStyle="rgba(75,12,12,0.457)",cx.fillRect(61,23,1,1),cx.fillStyle="rgba(83,21,21,0)",cx.fillRect(62,23,1,1),cx.fillStyle="rgba(82,20,20,0)",cx.fillRect(63,23,1,1),cx.fillRect(64,23,1,1),cx.fillRect(65,23,1,1),cx.fillRect(66,23,1,1),cx.fillRect(67,23,1,1),cx.fillStyle="rgba(91,39,39,0)",cx.fillRect(0,24,1,1),cx.fillRect(1,24,1,1),cx.fillRect(2,24,1,1),cx.fillStyle="rgba(93,41,41,0.039)",cx.fillRect(3,24,1,1),cx.fillStyle="rgba(58,0,0,0.866)",cx.fillRect(4,24,1,1),cx.fillStyle="rgba(160,134,135,1)",cx.fillRect(5,24,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,24,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(7,24,1,1),cx.fillRect(8,24,1,1),cx.fillRect(9,24,1,1),cx.fillRect(10,24,1,1),cx.fillRect(11,24,1,1),cx.fillRect(12,24,1,1),cx.fillRect(13,24,1,1),cx.fillRect(14,24,1,1),cx.fillRect(15,24,1,1),cx.fillRect(16,24,1,1),cx.fillRect(17,24,1,1),cx.fillRect(18,24,1,1),cx.fillRect(19,24,1,1),cx.fillRect(20,24,1,1),cx.fillRect(21,24,1,1),cx.fillRect(22,24,1,1),cx.fillRect(23,24,1,1),cx.fillRect(24,24,1,1),cx.fillRect(25,24,1,1),cx.fillRect(26,24,1,1),cx.fillRect(27,24,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(28,24,1,1),cx.fillStyle="rgba(255,248,252,1)",cx.fillRect(29,24,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(30,24,1,1),cx.fillRect(31,24,1,1),cx.fillRect(32,24,1,1),cx.fillRect(33,24,1,1),cx.fillRect(34,24,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(35,24,1,1),cx.fillRect(36,24,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(37,24,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(38,24,1,1),cx.fillStyle="rgba(196,206,205,1)",cx.fillRect(39,24,1,1),cx.fillStyle="rgba(126,153,148,1)",cx.fillRect(40,24,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,24,1,1),cx.fillRect(42,24,1,1),cx.fillRect(43,24,1,1),cx.fillRect(44,24,1,1),cx.fillRect(45,24,1,1),cx.fillStyle="rgba(139,168,163,1)",cx.fillRect(46,24,1,1),cx.fillStyle="rgba(123,132,129,1)",cx.fillRect(47,24,1,1),cx.fillStyle="rgba(54,0,0,1)",cx.fillRect(48,24,1,1),cx.fillStyle="rgba(182,25,25,1)",cx.fillRect(49,24,1,1),cx.fillStyle="rgba(230,36,36,1)",cx.fillRect(50,24,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(51,24,1,1),cx.fillRect(52,24,1,1),cx.fillRect(53,24,1,1),cx.fillRect(54,24,1,1),cx.fillStyle="rgba(224,35,35,1)",cx.fillRect(55,24,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(56,24,1,1),cx.fillStyle="rgba(143,16,14,1)",cx.fillRect(57,24,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(58,24,1,1),cx.fillRect(59,24,1,1),cx.fillStyle="rgba(74,0,0,1)",cx.fillRect(60,24,1,1),cx.fillStyle="rgba(88,32,32,0.417)",cx.fillRect(61,24,1,1),cx.fillStyle="rgba(105,55,54,0)",cx.fillRect(62,24,1,1),cx.fillStyle="rgba(103,52,51,0)",cx.fillRect(63,24,1,1),cx.fillRect(64,24,1,1),cx.fillRect(65,24,1,1),cx.fillRect(66,24,1,1),cx.fillRect(67,24,1,1),cx.fillStyle="rgba(95,45,44,0)",cx.fillRect(0,25,1,1),cx.fillRect(1,25,1,1),cx.fillStyle="rgba(96,46,45,0)",cx.fillRect(2,25,1,1),cx.fillStyle="rgba(92,39,39,0.126)",cx.fillRect(3,25,1,1),cx.fillStyle="rgba(58,0,0,0.961)",cx.fillRect(4,25,1,1),cx.fillStyle="rgba(192,172,173,1)",cx.fillRect(5,25,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,25,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(7,25,1,1),cx.fillRect(8,25,1,1),cx.fillRect(9,25,1,1),cx.fillRect(10,25,1,1),cx.fillRect(11,25,1,1),cx.fillRect(12,25,1,1),cx.fillRect(13,25,1,1),cx.fillRect(14,25,1,1),cx.fillRect(15,25,1,1),cx.fillRect(16,25,1,1),cx.fillRect(17,25,1,1),cx.fillRect(18,25,1,1),cx.fillRect(19,25,1,1),cx.fillRect(20,25,1,1),cx.fillRect(21,25,1,1),cx.fillRect(22,25,1,1),cx.fillRect(23,25,1,1),cx.fillRect(24,25,1,1),cx.fillRect(25,25,1,1),cx.fillRect(26,25,1,1),cx.fillStyle="rgba(254,247,251,1)",cx.fillRect(27,25,1,1),cx.fillStyle="rgba(248,244,246,1)",cx.fillRect(28,25,1,1),cx.fillStyle="rgba(240,239,240,1)",cx.fillRect(29,25,1,1),cx.fillStyle="rgba(237,236,238,1)",cx.fillRect(30,25,1,1),cx.fillStyle="rgba(234,234,236,1)",cx.fillRect(31,25,1,1),cx.fillRect(32,25,1,1),cx.fillStyle="rgba(236,235,237,1)",cx.fillRect(33,25,1,1),cx.fillStyle="rgba(239,239,240,1)",cx.fillRect(34,25,1,1),cx.fillStyle="rgba(245,243,244,1)",cx.fillRect(35,25,1,1),cx.fillStyle="rgba(251,247,249,1)",cx.fillRect(36,25,1,1),cx.fillStyle="rgba(255,252,255,1)",cx.fillRect(37,25,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(38,25,1,1),cx.fillStyle="rgba(218,224,223,1)",cx.fillRect(39,25,1,1),cx.fillStyle="rgba(126,153,148,1)",cx.fillRect(40,25,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,25,1,1),cx.fillRect(42,25,1,1),cx.fillRect(43,25,1,1),cx.fillRect(44,25,1,1),cx.fillRect(45,25,1,1),cx.fillRect(46,25,1,1),cx.fillStyle="rgba(140,169,165,1)",cx.fillRect(47,25,1,1),cx.fillStyle="rgba(72,37,36,1)",cx.fillRect(48,25,1,1),cx.fillStyle="rgba(111,6,6,1)",cx.fillRect(49,25,1,1),cx.fillStyle="rgba(237,38,38,1)",cx.fillRect(50,25,1,1),cx.fillStyle="rgba(225,35,35,1)",cx.fillRect(51,25,1,1),cx.fillStyle="rgba(221,34,34,1)",cx.fillRect(52,25,1,1),cx.fillRect(53,25,1,1),cx.fillRect(54,25,1,1),cx.fillStyle="rgba(227,35,35,1)",cx.fillRect(55,25,1,1),cx.fillStyle="rgba(199,29,29,1)",cx.fillRect(56,25,1,1),cx.fillStyle="rgba(138,14,12,1)",cx.fillRect(57,25,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(58,25,1,1),cx.fillStyle="rgba(138,15,13,1)",cx.fillRect(59,25,1,1),cx.fillStyle="rgba(69,0,0,1)",cx.fillRect(60,25,1,1),cx.fillStyle="rgba(85,26,26,0.315)",cx.fillRect(61,25,1,1),cx.fillStyle="rgba(94,39,38,0)",cx.fillRect(62,25,1,1),cx.fillStyle="rgba(93,37,37,0)",cx.fillRect(63,25,1,1),cx.fillRect(64,25,1,1),cx.fillRect(65,25,1,1),cx.fillRect(66,25,1,1),cx.fillRect(67,25,1,1),cx.fillStyle="rgba(78,18,18,0)",cx.fillRect(0,26,1,1),cx.fillRect(1,26,1,1),cx.fillStyle="rgba(79,18,18,0)",cx.fillRect(2,26,1,1),cx.fillStyle="rgba(77,14,14,0.205)",cx.fillRect(3,26,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(4,26,1,1),cx.fillStyle="rgba(215,200,201,1)",cx.fillRect(5,26,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,26,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(7,26,1,1),cx.fillRect(8,26,1,1),cx.fillRect(9,26,1,1),cx.fillRect(10,26,1,1),cx.fillRect(11,26,1,1),cx.fillRect(12,26,1,1),cx.fillRect(13,26,1,1),cx.fillRect(14,26,1,1),cx.fillRect(15,26,1,1),cx.fillRect(16,26,1,1),cx.fillRect(17,26,1,1),cx.fillRect(18,26,1,1),cx.fillRect(19,26,1,1),cx.fillRect(20,26,1,1),cx.fillRect(21,26,1,1),cx.fillRect(22,26,1,1),cx.fillRect(23,26,1,1),cx.fillRect(24,26,1,1),cx.fillStyle="rgba(255,247,250,1)",cx.fillRect(25,26,1,1),cx.fillStyle="rgba(255,247,251,1)",cx.fillRect(26,26,1,1),cx.fillStyle="rgba(255,249,253,1)",cx.fillRect(27,26,1,1),cx.fillStyle="rgba(240,238,240,1)",cx.fillRect(28,26,1,1),cx.fillStyle="rgba(217,222,222,1)",cx.fillRect(29,26,1,1),cx.fillStyle="rgba(207,214,214,1)",cx.fillRect(30,26,1,1),cx.fillStyle="rgba(193,204,203,1)",cx.fillRect(31,26,1,1),cx.fillStyle="rgba(183,195,194,1)",cx.fillRect(32,26,1,1),cx.fillStyle="rgba(167,184,181,1)",cx.fillRect(33,26,1,1),cx.fillStyle="rgba(155,175,171,1)",cx.fillRect(34,26,1,1),cx.fillStyle="rgba(146,169,165,1)",cx.fillRect(35,26,1,1),cx.fillStyle="rgba(142,164,161,1)",cx.fillRect(36,26,1,1),cx.fillStyle="rgba(155,174,171,1)",cx.fillRect(37,26,1,1),cx.fillStyle="rgba(173,189,187,1)",cx.fillRect(38,26,1,1),cx.fillStyle="rgba(178,192,191,1)",cx.fillRect(39,26,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(40,26,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,26,1,1),cx.fillRect(42,26,1,1),cx.fillRect(43,26,1,1),cx.fillRect(44,26,1,1),cx.fillRect(45,26,1,1),cx.fillRect(46,26,1,1),cx.fillStyle="rgba(142,173,168,1)",cx.fillRect(47,26,1,1),cx.fillStyle="rgba(106,96,93,1)",cx.fillRect(48,26,1,1),cx.fillStyle="rgba(62,0,0,1)",cx.fillRect(49,26,1,1),cx.fillStyle="rgba(163,21,19,1)",cx.fillRect(50,26,1,1),cx.fillStyle="rgba(212,32,32,1)",cx.fillRect(51,26,1,1),cx.fillStyle="rgba(228,36,36,1)",cx.fillRect(52,26,1,1),cx.fillStyle="rgba(227,36,36,1)",cx.fillRect(53,26,1,1),cx.fillStyle="rgba(227,35,36,1)",cx.fillRect(54,26,1,1),cx.fillStyle="rgba(229,36,36,1)",cx.fillRect(55,26,1,1),cx.fillStyle="rgba(164,21,19,1)",cx.fillRect(56,26,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(57,26,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(58,26,1,1),cx.fillStyle="rgba(131,13,12,1)",cx.fillRect(59,26,1,1),cx.fillStyle="rgba(66,1,1,1)",cx.fillRect(60,26,1,1),cx.fillStyle="rgba(90,34,35,0.205)",cx.fillRect(61,26,1,1),cx.fillStyle="rgba(93,38,38,0)",cx.fillRect(62,26,1,1),cx.fillStyle="rgba(93,37,37,0)",cx.fillRect(63,26,1,1),cx.fillRect(64,26,1,1),cx.fillRect(65,26,1,1),cx.fillRect(66,26,1,1),cx.fillRect(67,26,1,1),cx.fillStyle="rgba(88,34,34,0)",cx.fillRect(0,27,1,1),cx.fillRect(1,27,1,1),cx.fillStyle="rgba(89,35,35,0)",cx.fillRect(2,27,1,1),cx.fillStyle="rgba(85,27,27,0.197)",cx.fillRect(3,27,1,1),cx.fillStyle="rgba(61,0,0,1)",cx.fillRect(4,27,1,1),cx.fillStyle="rgba(214,198,199,1)",cx.fillRect(5,27,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,27,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(7,27,1,1),cx.fillRect(8,27,1,1),cx.fillRect(9,27,1,1),cx.fillRect(10,27,1,1),cx.fillRect(11,27,1,1),cx.fillRect(12,27,1,1),cx.fillRect(13,27,1,1),cx.fillRect(14,27,1,1),cx.fillRect(15,27,1,1),cx.fillRect(16,27,1,1),cx.fillRect(17,27,1,1),cx.fillRect(18,27,1,1),cx.fillRect(19,27,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(20,27,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(21,27,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(22,27,1,1),cx.fillRect(23,27,1,1),cx.fillRect(24,27,1,1),cx.fillStyle="rgba(255,251,253,1)",cx.fillRect(25,27,1,1),cx.fillStyle="rgba(253,249,251,1)",cx.fillRect(26,27,1,1),cx.fillStyle="rgba(251,246,248,1)",cx.fillRect(27,27,1,1),cx.fillStyle="rgba(251,247,249,1)",cx.fillRect(28,27,1,1),cx.fillStyle="rgba(253,249,251,1)",cx.fillRect(29,27,1,1),cx.fillStyle="rgba(255,251,252,1)",cx.fillRect(30,27,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(31,27,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(32,27,1,1),cx.fillRect(33,27,1,1),cx.fillStyle="rgba(255,252,254,1)",cx.fillRect(34,27,1,1),cx.fillStyle="rgba(246,245,246,1)",cx.fillRect(35,27,1,1),cx.fillStyle="rgba(228,231,232,1)",cx.fillRect(36,27,1,1),cx.fillStyle="rgba(193,205,203,1)",cx.fillRect(37,27,1,1),cx.fillStyle="rgba(155,175,172,1)",cx.fillRect(38,27,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(39,27,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(40,27,1,1),cx.fillRect(41,27,1,1),cx.fillRect(42,27,1,1),cx.fillRect(43,27,1,1),cx.fillRect(44,27,1,1),cx.fillRect(45,27,1,1),cx.fillRect(46,27,1,1),cx.fillStyle="rgba(139,166,162,1)",cx.fillRect(47,27,1,1),cx.fillStyle="rgba(126,138,134,1)",cx.fillRect(48,27,1,1),cx.fillStyle="rgba(61,1,1,1)",cx.fillRect(49,27,1,1),cx.fillStyle="rgba(117,9,8,1)",cx.fillRect(50,27,1,1),cx.fillStyle="rgba(146,16,14,1)",cx.fillRect(51,27,1,1),cx.fillStyle="rgba(166,21,20,1)",cx.fillRect(52,27,1,1),cx.fillStyle="rgba(189,26,26,1)",cx.fillRect(53,27,1,1),cx.fillStyle="rgba(195,28,28,1)",cx.fillRect(54,27,1,1),cx.fillStyle="rgba(166,21,20,1)",cx.fillRect(55,27,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(56,27,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(57,27,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(58,27,1,1),cx.fillStyle="rgba(117,10,9,1)",cx.fillRect(59,27,1,1),cx.fillStyle="rgba(65,4,4,0.921)",cx.fillRect(60,27,1,1),cx.fillStyle="rgba(94,40,40,0.071)",cx.fillRect(61,27,1,1),cx.fillStyle="rgba(96,43,43,0)",cx.fillRect(62,27,1,1),cx.fillRect(63,27,1,1),cx.fillRect(64,27,1,1),cx.fillRect(65,27,1,1),cx.fillRect(66,27,1,1),cx.fillRect(67,27,1,1),cx.fillStyle="rgba(92,40,40,0)",cx.fillRect(0,28,1,1),cx.fillRect(1,28,1,1),cx.fillStyle="rgba(93,41,41,0)",cx.fillRect(2,28,1,1),cx.fillStyle="rgba(90,36,36,0.102)",cx.fillRect(3,28,1,1),cx.fillStyle="rgba(57,0,0,0.945)",cx.fillRect(4,28,1,1),cx.fillStyle="rgba(180,160,160,1)",cx.fillRect(5,28,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(6,28,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(7,28,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(8,28,1,1),cx.fillRect(9,28,1,1),cx.fillRect(10,28,1,1),cx.fillRect(11,28,1,1),cx.fillRect(12,28,1,1),cx.fillRect(13,28,1,1),cx.fillRect(14,28,1,1),cx.fillRect(15,28,1,1),cx.fillRect(16,28,1,1),cx.fillRect(17,28,1,1),cx.fillRect(18,28,1,1),cx.fillStyle="rgba(254,247,251,1)",cx.fillRect(19,28,1,1),cx.fillStyle="rgba(243,240,243,1)",cx.fillRect(20,28,1,1),cx.fillStyle="rgba(221,225,225,1)",cx.fillRect(21,28,1,1),cx.fillStyle="rgba(201,210,209,1)",cx.fillRect(22,28,1,1),cx.fillStyle="rgba(181,195,193,1)",cx.fillRect(23,28,1,1),cx.fillStyle="rgba(169,186,183,1)",cx.fillRect(24,28,1,1),cx.fillStyle="rgba(159,178,175,1)",cx.fillRect(25,28,1,1),cx.fillStyle="rgba(153,174,170,1)",cx.fillRect(26,28,1,1),cx.fillStyle="rgba(146,169,165,1)",cx.fillRect(27,28,1,1),cx.fillStyle="rgba(142,165,162,1)",cx.fillRect(28,28,1,1),cx.fillStyle="rgba(140,163,159,1)",cx.fillRect(29,28,1,1),cx.fillStyle="rgba(138,162,158,1)",cx.fillRect(30,28,1,1),cx.fillRect(31,28,1,1),cx.fillStyle="rgba(143,165,162,1)",cx.fillRect(32,28,1,1),cx.fillStyle="rgba(149,170,167,1)",cx.fillRect(33,28,1,1),cx.fillStyle="rgba(156,175,172,1)",cx.fillRect(34,28,1,1),cx.fillStyle="rgba(168,184,182,1)",cx.fillRect(35,28,1,1),cx.fillStyle="rgba(184,198,196,1)",cx.fillRect(36,28,1,1),cx.fillStyle="rgba(198,208,206,1)",cx.fillRect(37,28,1,1),cx.fillStyle="rgba(203,211,210,1)",cx.fillRect(38,28,1,1),cx.fillStyle="rgba(149,170,166,1)",cx.fillRect(39,28,1,1),cx.fillStyle="rgba(133,158,153,1)",cx.fillRect(40,28,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(41,28,1,1),cx.fillRect(42,28,1,1),cx.fillRect(43,28,1,1),cx.fillRect(44,28,1,1),cx.fillRect(45,28,1,1),cx.fillRect(46,28,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(47,28,1,1),cx.fillStyle="rgba(135,158,154,1)",cx.fillRect(48,28,1,1),cx.fillStyle="rgba(67,17,17,1)",cx.fillRect(49,28,1,1),cx.fillStyle="rgba(104,4,3,1)",cx.fillRect(50,28,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(51,28,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(52,28,1,1),cx.fillStyle="rgba(138,14,12,1)",cx.fillRect(53,28,1,1),cx.fillStyle="rgba(138,15,13,1)",cx.fillRect(54,28,1,1),cx.fillStyle="rgba(139,15,13,1)",cx.fillRect(55,28,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(56,28,1,1),cx.fillRect(57,28,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(58,28,1,1),cx.fillStyle="rgba(99,5,4,1)",cx.fillRect(59,28,1,1),cx.fillStyle="rgba(72,16,16,0.772)",cx.fillRect(60,28,1,1),cx.fillStyle="rgba(104,55,55,0)",cx.fillRect(61,28,1,1),cx.fillStyle="rgba(102,52,52,0)",cx.fillRect(62,28,1,1),cx.fillRect(63,28,1,1),cx.fillRect(64,28,1,1),cx.fillRect(65,28,1,1),cx.fillRect(66,28,1,1),cx.fillRect(67,28,1,1),cx.fillStyle="rgba(81,25,24,0)",cx.fillRect(0,29,1,1),cx.fillRect(1,29,1,1),cx.fillRect(2,29,1,1),cx.fillStyle="rgba(82,27,26,0.008)",cx.fillRect(3,29,1,1),cx.fillStyle="rgba(66,3,3,0.748)",cx.fillRect(4,29,1,1),cx.fillStyle="rgba(87,50,49,1)",cx.fillRect(5,29,1,1),cx.fillStyle="rgba(210,225,224,1)",cx.fillRect(6,29,1,1),cx.fillStyle="rgba(252,250,251,1)",cx.fillRect(7,29,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(8,29,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(9,29,1,1),cx.fillStyle="rgba(255,251,254,1)",cx.fillRect(10,29,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(11,29,1,1),cx.fillRect(12,29,1,1),cx.fillStyle="rgba(255,249,253,1)",cx.fillRect(13,29,1,1),cx.fillStyle="rgba(255,250,253,1)";cx.fillRect(14,29,1,1),cx.fillRect(15,29,1,1),cx.fillRect(16,29,1,1),cx.fillStyle="rgba(255,250,254,1)",cx.fillRect(17,29,1,1),cx.fillStyle="rgba(255,251,255,1)",cx.fillRect(18,29,1,1),cx.fillStyle="rgba(255,250,254,1)",cx.fillRect(19,29,1,1),cx.fillStyle="rgba(236,235,237,1)",cx.fillRect(20,29,1,1),cx.fillStyle="rgba(221,226,225,1)",cx.fillRect(21,29,1,1),cx.fillStyle="rgba(219,224,224,1)",cx.fillRect(22,29,1,1),cx.fillStyle="rgba(223,227,227,1)",cx.fillRect(23,29,1,1),cx.fillStyle="rgba(228,231,231,1)",cx.fillRect(24,29,1,1),cx.fillStyle="rgba(234,235,236,1)",cx.fillRect(25,29,1,1),cx.fillStyle="rgba(237,237,238,1)",cx.fillRect(26,29,1,1),cx.fillStyle="rgba(238,238,239,1)",cx.fillRect(27,29,1,1),cx.fillStyle="rgba(236,237,237,1)",cx.fillRect(28,29,1,1),cx.fillStyle="rgba(232,233,234,1)",cx.fillRect(29,29,1,1),cx.fillStyle="rgba(226,229,229,1)",cx.fillRect(30,29,1,1),cx.fillStyle="rgba(221,226,226,1)",cx.fillRect(31,29,1,1),cx.fillStyle="rgba(209,216,216,1)",cx.fillRect(32,29,1,1),cx.fillStyle="rgba(189,201,200,1)",cx.fillRect(33,29,1,1),cx.fillStyle="rgba(177,192,190,1)",cx.fillRect(34,29,1,1),cx.fillStyle="rgba(161,178,176,1)",cx.fillRect(35,29,1,1),cx.fillStyle="rgba(145,166,163,1)",cx.fillRect(36,29,1,1),cx.fillStyle="rgba(126,152,148,1)",cx.fillRect(37,29,1,1),cx.fillStyle="rgba(128,153,149,1)",cx.fillRect(38,29,1,1),cx.fillStyle="rgba(134,159,155,1)",cx.fillRect(39,29,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(40,29,1,1),cx.fillRect(41,29,1,1),cx.fillRect(42,29,1,1),cx.fillRect(43,29,1,1),cx.fillRect(44,29,1,1),cx.fillRect(45,29,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(46,29,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(47,29,1,1),cx.fillStyle="rgba(145,181,176,1)",cx.fillRect(48,29,1,1),cx.fillStyle="rgba(83,47,46,1)",cx.fillRect(49,29,1,1),cx.fillStyle="rgba(88,0,0,1)",cx.fillRect(50,29,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(51,29,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(52,29,1,1),cx.fillRect(53,29,1,1),cx.fillRect(54,29,1,1),cx.fillRect(55,29,1,1),cx.fillRect(56,29,1,1),cx.fillRect(57,29,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(58,29,1,1),cx.fillStyle="rgba(78,0,0,1)",cx.fillRect(59,29,1,1),cx.fillStyle="rgba(83,27,27,0.543)",cx.fillRect(60,29,1,1),cx.fillStyle="rgba(108,61,61,0)",cx.fillRect(61,29,1,1),cx.fillStyle="rgba(106,57,57,0)",cx.fillRect(62,29,1,1),cx.fillRect(63,29,1,1),cx.fillRect(64,29,1,1),cx.fillRect(65,29,1,1),cx.fillRect(66,29,1,1),cx.fillRect(67,29,1,1),cx.fillStyle="rgba(106,66,66,0)",cx.fillRect(0,30,1,1),cx.fillRect(1,30,1,1),cx.fillRect(2,30,1,1),cx.fillStyle="rgba(107,67,68,0)",cx.fillRect(3,30,1,1),cx.fillStyle="rgba(99,55,55,0.252)",cx.fillRect(4,30,1,1),cx.fillStyle="rgba(61,0,0,0.961)",cx.fillRect(5,30,1,1),cx.fillStyle="rgba(95,81,79,1)",cx.fillRect(6,30,1,1),cx.fillStyle="rgba(152,178,173,1)",cx.fillRect(7,30,1,1),cx.fillStyle="rgba(185,198,196,1)",cx.fillRect(8,30,1,1),cx.fillStyle="rgba(208,215,214,1)",cx.fillRect(9,30,1,1),cx.fillStyle="rgba(228,231,232,1)",cx.fillRect(10,30,1,1),cx.fillStyle="rgba(233,234,235,1)",cx.fillRect(11,30,1,1),cx.fillStyle="rgba(235,236,236,1)",cx.fillRect(12,30,1,1),cx.fillStyle="rgba(237,237,238,1)",cx.fillRect(13,30,1,1),cx.fillRect(14,30,1,1),cx.fillStyle="rgba(235,235,236,1)",cx.fillRect(15,30,1,1),cx.fillStyle="rgba(233,234,235,1)",cx.fillRect(16,30,1,1),cx.fillStyle="rgba(231,233,234,1)",cx.fillRect(17,30,1,1),cx.fillStyle="rgba(230,231,233,1)",cx.fillRect(18,30,1,1),cx.fillStyle="rgba(226,228,230,1)",cx.fillRect(19,30,1,1),cx.fillStyle="rgba(220,225,225,1)",cx.fillRect(20,30,1,1),cx.fillStyle="rgba(215,220,220,1)",cx.fillRect(21,30,1,1),cx.fillStyle="rgba(210,216,216,1)",cx.fillRect(22,30,1,1),cx.fillStyle="rgba(206,214,213,1)",cx.fillRect(23,30,1,1),cx.fillStyle="rgba(203,211,211,1)",cx.fillRect(24,30,1,1),cx.fillStyle="rgba(200,210,209,1)",cx.fillRect(25,30,1,1),cx.fillStyle="rgba(198,208,207,1)",cx.fillRect(26,30,1,1),cx.fillRect(27,30,1,1),cx.fillRect(28,30,1,1),cx.fillStyle="rgba(201,210,209,1)",cx.fillRect(29,30,1,1),cx.fillStyle="rgba(204,212,212,1)",cx.fillRect(30,30,1,1),cx.fillStyle="rgba(208,216,215,1)",cx.fillRect(31,30,1,1),cx.fillStyle="rgba(214,221,220,1)",cx.fillRect(32,30,1,1),cx.fillStyle="rgba(218,223,223,1)",cx.fillRect(33,30,1,1),cx.fillStyle="rgba(211,218,218,1)",cx.fillRect(34,30,1,1),cx.fillStyle="rgba(195,206,204,1)",cx.fillRect(35,30,1,1),cx.fillStyle="rgba(167,183,181,1)",cx.fillRect(36,30,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(37,30,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(38,30,1,1),cx.fillRect(39,30,1,1),cx.fillRect(40,30,1,1),cx.fillRect(41,30,1,1),cx.fillRect(42,30,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(43,30,1,1),cx.fillStyle="rgba(136,161,157,1)",cx.fillRect(44,30,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(45,30,1,1),cx.fillStyle="rgba(142,174,169,1)",cx.fillRect(46,30,1,1),cx.fillStyle="rgba(136,161,156,1)",cx.fillRect(47,30,1,1),cx.fillStyle="rgba(113,109,106,1)",cx.fillRect(48,30,1,1),cx.fillStyle="rgba(72,21,20,1)",cx.fillRect(49,30,1,1),cx.fillStyle="rgba(80,2,1,1)",cx.fillRect(50,30,1,1),cx.fillStyle="rgba(148,17,15,1)",cx.fillRect(51,30,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(52,30,1,1),cx.fillRect(53,30,1,1),cx.fillRect(54,30,1,1),cx.fillRect(55,30,1,1),cx.fillRect(56,30,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(57,30,1,1),cx.fillStyle="rgba(133,14,12,1)",cx.fillRect(58,30,1,1),cx.fillStyle="rgba(64,0,0,1)",cx.fillRect(59,30,1,1),cx.fillStyle="rgba(96,43,43,0.268)",cx.fillRect(60,30,1,1),cx.fillStyle="rgba(109,61,60,0)",cx.fillRect(61,30,1,1),cx.fillStyle="rgba(106,58,57,0)",cx.fillRect(62,30,1,1),cx.fillRect(63,30,1,1),cx.fillRect(64,30,1,1),cx.fillRect(65,30,1,1),cx.fillRect(66,30,1,1),cx.fillRect(67,30,1,1),cx.fillStyle="rgba(109,69,68,0)",cx.fillRect(0,31,1,1),cx.fillRect(1,31,1,1),cx.fillRect(2,31,1,1),cx.fillStyle="rgba(109,69,69,0)",cx.fillRect(3,31,1,1),cx.fillStyle="rgba(109,71,70,0)",cx.fillRect(4,31,1,1),cx.fillStyle="rgba(77,17,17,0.646)",cx.fillRect(5,31,1,1),cx.fillStyle="rgba(70,13,13,1)",cx.fillRect(6,31,1,1),cx.fillStyle="rgba(135,164,160,1)",cx.fillRect(7,31,1,1),cx.fillStyle="rgba(133,166,161,1)",cx.fillRect(8,31,1,1),cx.fillStyle="rgba(133,167,162,1)",cx.fillRect(9,31,1,1),cx.fillStyle="rgba(135,167,162,1)",cx.fillRect(10,31,1,1),cx.fillStyle="rgba(135,163,159,1)",cx.fillRect(11,31,1,1),cx.fillStyle="rgba(135,160,156,1)",cx.fillRect(12,31,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(13,31,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(14,31,1,1),cx.fillStyle="rgba(134,158,154,1)",cx.fillRect(15,31,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(16,31,1,1),cx.fillRect(17,31,1,1),cx.fillStyle="rgba(131,156,152,1)",cx.fillRect(18,31,1,1),cx.fillStyle="rgba(130,156,151,1)",cx.fillRect(19,31,1,1),cx.fillStyle="rgba(129,154,150,1)",cx.fillRect(20,31,1,1),cx.fillStyle="rgba(128,154,149,1)",cx.fillRect(21,31,1,1),cx.fillStyle="rgba(127,153,149,1)",cx.fillRect(22,31,1,1),cx.fillStyle="rgba(127,153,148,1)",cx.fillRect(23,31,1,1),cx.fillRect(24,31,1,1),cx.fillStyle="rgba(126,152,148,1)",cx.fillRect(25,31,1,1),cx.fillRect(26,31,1,1),cx.fillStyle="rgba(126,153,148,1)",cx.fillRect(27,31,1,1),cx.fillStyle="rgba(126,152,148,1)",cx.fillRect(28,31,1,1),cx.fillRect(29,31,1,1),cx.fillStyle="rgba(127,153,148,1)",cx.fillRect(30,31,1,1),cx.fillStyle="rgba(127,153,149,1)",cx.fillRect(31,31,1,1),cx.fillRect(32,31,1,1),cx.fillStyle="rgba(128,153,149,1)",cx.fillRect(33,31,1,1),cx.fillStyle="rgba(127,153,149,1)",cx.fillRect(34,31,1,1),cx.fillStyle="rgba(127,153,148,1)",cx.fillRect(35,31,1,1),cx.fillStyle="rgba(131,156,151,1)",cx.fillRect(36,31,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(37,31,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(38,31,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(39,31,1,1),cx.fillStyle="rgba(137,163,159,1)",cx.fillRect(40,31,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(41,31,1,1),cx.fillStyle="rgba(141,171,167,1)",cx.fillRect(42,31,1,1),cx.fillStyle="rgba(142,173,169,1)",cx.fillRect(43,31,1,1),cx.fillStyle="rgba(137,163,159,1)",cx.fillRect(44,31,1,1),cx.fillStyle="rgba(123,131,128,1)",cx.fillRect(45,31,1,1),cx.fillStyle="rgba(99,77,75,1)",cx.fillRect(46,31,1,1),cx.fillStyle="rgba(74,20,20,1)",cx.fillRect(47,31,1,1),cx.fillStyle="rgba(65,0,0,0.945)",cx.fillRect(48,31,1,1),cx.fillStyle="rgba(70,4,4,0.78)",cx.fillRect(49,31,1,1),cx.fillStyle="rgba(73,3,2,1)",cx.fillRect(50,31,1,1),cx.fillStyle="rgba(140,15,13,1)",cx.fillRect(51,31,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(52,31,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(53,31,1,1),cx.fillRect(54,31,1,1),cx.fillRect(55,31,1,1),cx.fillRect(56,31,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(57,31,1,1),cx.fillStyle="rgba(107,7,6,1)",cx.fillRect(58,31,1,1),cx.fillStyle="rgba(66,7,7,0.874)",cx.fillRect(59,31,1,1),cx.fillStyle="rgba(103,51,51,0.039)",cx.fillRect(60,31,1,1),cx.fillStyle="rgba(104,53,53,0)",cx.fillRect(61,31,1,1),cx.fillStyle="rgba(103,52,52,0)",cx.fillRect(62,31,1,1),cx.fillStyle="rgba(103,53,53,0)",cx.fillRect(63,31,1,1),cx.fillStyle="rgba(104,55,55,0)",cx.fillRect(64,31,1,1),cx.fillStyle="rgba(104,54,53,0)",cx.fillRect(65,31,1,1),cx.fillStyle="rgba(103,53,53,0)",cx.fillRect(66,31,1,1),cx.fillRect(67,31,1,1),cx.fillStyle="rgba(98,51,51,0)",cx.fillRect(0,32,1,1),cx.fillRect(1,32,1,1),cx.fillRect(2,32,1,1),cx.fillStyle="rgba(99,53,52,0)",cx.fillRect(3,32,1,1),cx.fillStyle="rgba(93,44,44,0.173)",cx.fillRect(4,32,1,1),cx.fillStyle="rgba(68,1,1,0.937)",cx.fillRect(5,32,1,1),cx.fillStyle="rgba(81,31,30,1)",cx.fillRect(6,32,1,1),cx.fillStyle="rgba(90,59,57,1)",cx.fillRect(7,32,1,1),cx.fillStyle="rgba(85,48,47,1)",cx.fillRect(8,32,1,1),cx.fillStyle="rgba(98,72,70,1)",cx.fillRect(9,32,1,1),cx.fillStyle="rgba(113,109,106,1)",cx.fillRect(10,32,1,1),cx.fillStyle="rgba(126,138,135,1)",cx.fillRect(11,32,1,1),cx.fillStyle="rgba(135,160,156,1)",cx.fillRect(12,32,1,1),cx.fillStyle="rgba(139,168,164,1)",cx.fillRect(13,32,1,1),cx.fillStyle="rgba(141,172,168,1)",cx.fillRect(14,32,1,1),cx.fillStyle="rgba(140,171,167,1)",cx.fillRect(15,32,1,1),cx.fillStyle="rgba(139,168,164,1)",cx.fillRect(16,32,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(17,32,1,1),cx.fillStyle="rgba(138,164,160,1)",cx.fillRect(18,32,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(19,32,1,1),cx.fillRect(20,32,1,1),cx.fillStyle="rgba(137,161,157,1)",cx.fillRect(21,32,1,1),cx.fillRect(22,32,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(23,32,1,1),cx.fillRect(24,32,1,1),cx.fillRect(25,32,1,1),cx.fillRect(26,32,1,1),cx.fillStyle="rgba(137,160,156,1)",cx.fillRect(27,32,1,1),cx.fillStyle="rgba(137,161,157,1)",cx.fillRect(28,32,1,1),cx.fillRect(29,32,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(30,32,1,1),cx.fillRect(31,32,1,1),cx.fillStyle="rgba(138,163,159,1)",cx.fillRect(32,32,1,1),cx.fillStyle="rgba(139,166,162,1)",cx.fillRect(33,32,1,1),cx.fillStyle="rgba(140,168,164,1)",cx.fillRect(34,32,1,1),cx.fillStyle="rgba(141,170,166,1)",cx.fillRect(35,32,1,1),cx.fillStyle="rgba(141,173,169,1)",cx.fillRect(36,32,1,1),cx.fillStyle="rgba(142,173,168,1)",cx.fillRect(37,32,1,1),cx.fillStyle="rgba(140,168,164,1)",cx.fillRect(38,32,1,1),cx.fillStyle="rgba(136,160,157,1)",cx.fillRect(39,32,1,1),cx.fillStyle="rgba(131,150,147,1)",cx.fillRect(40,32,1,1),cx.fillStyle="rgba(123,131,127,1)",cx.fillRect(41,32,1,1),cx.fillStyle="rgba(112,105,103,1)",cx.fillRect(42,32,1,1),cx.fillStyle="rgba(94,66,64,1)",cx.fillRect(43,32,1,1),cx.fillStyle="rgba(77,26,25,1)",cx.fillRect(44,32,1,1),cx.fillStyle="rgba(65,0,0,1)",cx.fillRect(45,32,1,1),cx.fillStyle="rgba(67,0,0,0.843)",cx.fillRect(46,32,1,1),cx.fillStyle="rgba(72,3,4,0.52)",cx.fillRect(47,32,1,1),cx.fillStyle="rgba(85,23,23,0.134)",cx.fillRect(48,32,1,1),cx.fillStyle="rgba(93,41,40,0.181)",cx.fillRect(49,32,1,1),cx.fillStyle="rgba(66,2,2,1)",cx.fillRect(50,32,1,1),cx.fillStyle="rgba(131,13,11,1)",cx.fillRect(51,32,1,1),cx.fillStyle="rgba(147,17,15,1)",cx.fillRect(52,32,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(53,32,1,1),cx.fillRect(54,32,1,1),cx.fillRect(55,32,1,1),cx.fillRect(56,32,1,1),cx.fillStyle="rgba(147,17,14,1)",cx.fillRect(57,32,1,1),cx.fillStyle="rgba(75,0,0,1)",cx.fillRect(58,32,1,1),cx.fillStyle="rgba(84,29,29,0.559)",cx.fillRect(59,32,1,1),cx.fillStyle="rgba(115,72,71,0)",cx.fillRect(60,32,1,1),cx.fillStyle="rgba(112,68,67,0)",cx.fillRect(61,32,1,1),cx.fillStyle="rgba(113,67,67,0)",cx.fillRect(62,32,1,1),cx.fillStyle="rgba(110,62,61,0)",cx.fillRect(63,32,1,1),cx.fillStyle="rgba(96,42,42,0)",cx.fillRect(64,32,1,1),cx.fillStyle="rgba(101,51,50,0)",cx.fillRect(65,32,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(66,32,1,1),cx.fillStyle="rgba(106,56,56,0)",cx.fillRect(67,32,1,1),cx.fillStyle="rgba(105,63,62,0)",cx.fillRect(0,33,1,1),cx.fillRect(1,33,1,1),cx.fillRect(2,33,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(3,33,1,1),cx.fillStyle="rgba(87,36,35,0.512)",cx.fillRect(4,33,1,1),cx.fillStyle="rgba(66,0,0,1)",cx.fillRect(5,33,1,1),cx.fillStyle="rgba(70,0,0,0.89)",cx.fillRect(6,33,1,1),cx.fillStyle="rgba(70,1,1,0.646)",cx.fillRect(7,33,1,1),cx.fillStyle="rgba(72,4,4,0.614)",cx.fillRect(8,33,1,1),cx.fillStyle="rgba(67,0,0,0.772)",cx.fillRect(9,33,1,1),cx.fillStyle="rgba(66,0,0,0.921)",cx.fillRect(10,33,1,1),cx.fillStyle="rgba(68,2,2,1)",cx.fillRect(11,33,1,1),cx.fillStyle="rgba(75,21,20,1)",cx.fillRect(12,33,1,1),cx.fillStyle="rgba(85,44,43,1)",cx.fillRect(13,33,1,1),cx.fillStyle="rgba(97,73,71,1)",cx.fillRect(14,33,1,1),cx.fillStyle="rgba(107,94,92,1)",cx.fillRect(15,33,1,1),cx.fillStyle="rgba(118,122,119,1)",cx.fillRect(16,33,1,1),cx.fillStyle="rgba(123,131,128,1)",cx.fillRect(17,33,1,1),cx.fillStyle="rgba(129,143,140,1)",cx.fillRect(18,33,1,1),cx.fillStyle="rgba(134,156,153,1)",cx.fillRect(19,33,1,1),cx.fillStyle="rgba(136,161,157,1)",cx.fillRect(20,33,1,1),cx.fillStyle="rgba(138,164,160,1)",cx.fillRect(21,33,1,1),cx.fillStyle="rgba(139,167,162,1)",cx.fillRect(22,33,1,1),cx.fillStyle="rgba(140,168,164,1)",cx.fillRect(23,33,1,1),cx.fillStyle="rgba(140,169,165,1)",cx.fillRect(24,33,1,1),cx.fillRect(25,33,1,1),cx.fillRect(26,33,1,1),cx.fillStyle="rgba(140,169,164,1)",cx.fillRect(27,33,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(28,33,1,1),cx.fillStyle="rgba(138,165,161,1)",cx.fillRect(29,33,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(30,33,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(31,33,1,1),cx.fillStyle="rgba(132,151,148,1)",cx.fillRect(32,33,1,1),cx.fillStyle="rgba(126,137,133,1)",cx.fillRect(33,33,1,1),cx.fillStyle="rgba(121,128,125,1)",cx.fillRect(34,33,1,1),cx.fillStyle="rgba(112,108,104,1)",cx.fillRect(35,33,1,1),cx.fillStyle="rgba(103,84,82,1)",cx.fillRect(36,33,1,1),cx.fillStyle="rgba(92,64,63,1)",cx.fillRect(37,33,1,1),cx.fillStyle="rgba(83,40,39,1)",cx.fillRect(38,33,1,1),cx.fillStyle="rgba(75,21,20,1)",cx.fillRect(39,33,1,1),cx.fillStyle="rgba(69,10,10,1)",cx.fillRect(40,33,1,1),cx.fillStyle="rgba(67,0,0,1)",cx.fillRect(41,33,1,1),cx.fillStyle="rgba(65,0,0,0.906)",cx.fillRect(42,33,1,1),cx.fillStyle="rgba(67,0,0,0.74)",cx.fillRect(43,33,1,1),cx.fillStyle="rgba(73,5,5,0.504)",cx.fillRect(44,33,1,1),cx.fillStyle="rgba(81,16,17,0.236)",cx.fillRect(45,33,1,1),cx.fillStyle="rgba(83,19,19,0.031)",cx.fillRect(46,33,1,1),cx.fillStyle="rgba(80,15,15,0)",cx.fillRect(47,33,1,1),cx.fillStyle="rgba(85,23,23,0)",cx.fillRect(48,33,1,1),cx.fillStyle="rgba(95,41,41,0.071)",cx.fillRect(49,33,1,1),cx.fillStyle="rgba(65,4,4,0.921)",cx.fillRect(50,33,1,1),cx.fillStyle="rgba(117,9,8,1)",cx.fillRect(51,33,1,1),cx.fillStyle="rgba(149,17,15,1)",cx.fillRect(52,33,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(53,33,1,1),cx.fillRect(54,33,1,1),cx.fillStyle="rgba(145,16,14,1)",cx.fillRect(55,33,1,1),cx.fillStyle="rgba(154,18,16,1)",cx.fillRect(56,33,1,1),cx.fillStyle="rgba(122,11,9,1)",cx.fillRect(57,33,1,1),cx.fillStyle="rgba(64,4,4,0.953)",cx.fillRect(58,33,1,1),cx.fillStyle="rgba(95,41,41,0.142)",cx.fillRect(59,33,1,1),cx.fillStyle="rgba(90,32,31,0)",cx.fillRect(60,33,1,1),cx.fillStyle="rgba(79,15,14,0)",cx.fillRect(61,33,1,1),cx.fillStyle="rgba(89,29,29,0)",cx.fillRect(62,33,1,1),cx.fillStyle="rgba(94,35,35,0)",cx.fillRect(63,33,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(64,33,1,1),cx.fillStyle="rgba(89,32,32,0)",cx.fillRect(65,33,1,1),cx.fillStyle="rgba(102,45,45,0)",cx.fillRect(66,33,1,1),cx.fillStyle="rgba(99,43,43,0)",cx.fillRect(67,33,1,1),cx.fillStyle="rgba(107,68,67,0)",cx.fillRect(0,34,1,1),cx.fillRect(1,34,1,1),cx.fillRect(2,34,1,1),cx.fillStyle="rgba(109,71,70,0)",cx.fillRect(3,34,1,1),cx.fillStyle="rgba(97,48,48,0.102)",cx.fillRect(4,34,1,1),cx.fillStyle="rgba(78,15,15,0.346)",cx.fillRect(5,34,1,1),cx.fillStyle="rgba(78,13,13,0.071)",cx.fillRect(6,34,1,1),cx.fillStyle="rgba(83,22,21,0)",cx.fillRect(7,34,1,1),cx.fillStyle="rgba(84,25,25,0)",cx.fillRect(8,34,1,1),cx.fillStyle="rgba(79,16,15,0)",cx.fillRect(9,34,1,1),cx.fillStyle="rgba(85,26,25,0.094)",cx.fillRect(10,34,1,1),cx.fillStyle="rgba(84,23,22,0.244)",cx.fillRect(11,34,1,1),cx.fillStyle="rgba(74,6,6,0.425)",cx.fillRect(12,34,1,1),cx.fillStyle="rgba(72,4,4,0.606)",cx.fillRect(13,34,1,1),cx.fillStyle="rgba(67,0,0,0.756)",cx.fillRect(14,34,1,1),cx.fillStyle="rgba(66,0,0,0.874)",cx.fillRect(15,34,1,1),cx.fillStyle="rgba(66,0,0,0.945)",cx.fillRect(16,34,1,1),cx.fillStyle="rgba(67,0,0,0.984)",cx.fillRect(17,34,1,1),cx.fillStyle="rgba(69,5,5,1)",cx.fillRect(18,34,1,1),cx.fillStyle="rgba(72,17,16,1)",cx.fillRect(19,34,1,1),cx.fillStyle="rgba(74,21,21,1)",cx.fillRect(20,34,1,1),cx.fillStyle="rgba(78,28,27,1)",cx.fillRect(21,34,1,1),cx.fillStyle="rgba(82,34,33,1)",cx.fillRect(22,34,1,1),cx.fillStyle="rgba(85,43,42,1)",cx.fillRect(23,34,1,1),cx.fillStyle="rgba(87,47,46,1)",cx.fillRect(24,34,1,1),cx.fillStyle="rgba(85,44,44,1)",cx.fillRect(25,34,1,1),cx.fillStyle="rgba(87,47,46,1)",cx.fillRect(26,34,1,1),cx.fillStyle="rgba(86,45,43,1)",cx.fillRect(27,34,1,1),cx.fillStyle="rgba(83,37,36,1)",cx.fillRect(28,34,1,1),cx.fillStyle="rgba(80,30,29,1)",cx.fillRect(29,34,1,1),cx.fillStyle="rgba(76,24,23,1)",cx.fillRect(30,34,1,1),cx.fillStyle="rgba(73,19,18,1)",cx.fillRect(31,34,1,1),cx.fillStyle="rgba(70,12,11,1)",cx.fillRect(32,34,1,1),cx.fillStyle="rgba(68,0,0,1)",cx.fillRect(33,34,1,1),cx.fillStyle="rgba(66,0,0,0.969)",cx.fillRect(34,34,1,1),cx.fillStyle="rgba(66,0,0,0.913)",cx.fillRect(35,34,1,1),cx.fillStyle="rgba(66,0,0,0.819)",cx.fillRect(36,34,1,1),cx.fillStyle="rgba(71,2,3,0.709)",cx.fillRect(37,34,1,1),cx.fillStyle="rgba(76,9,9,0.575)",cx.fillRect(38,34,1,1),cx.fillStyle="rgba(77,11,10,0.425)",cx.fillRect(39,34,1,1),cx.fillStyle="rgba(85,23,23,0.307)",cx.fillRect(40,34,1,1),cx.fillStyle="rgba(80,16,15,0.189)",cx.fillRect(41,34,1,1),cx.fillStyle="rgba(82,19,19,0.071)",cx.fillRect(42,34,1,1),cx.fillStyle="rgba(80,16,16,0)",cx.fillRect(43,34,1,1),cx.fillStyle="rgba(81,16,16,0)",cx.fillRect(44,34,1,1),cx.fillStyle="rgba(83,21,21,0)",cx.fillRect(45,34,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(46,34,1,1),cx.fillStyle="rgba(82,19,18,0)",cx.fillRect(47,34,1,1),cx.fillStyle="rgba(96,40,40,0)",cx.fillRect(48,34,1,1),cx.fillStyle="rgba(101,48,48,0)",cx.fillRect(49,34,1,1),cx.fillStyle="rgba(73,17,17,0.717)",cx.fillRect(50,34,1,1),cx.fillStyle="rgba(97,4,4,1)",cx.fillRect(51,34,1,1),cx.fillStyle="rgba(154,18,16,1)",cx.fillRect(52,34,1,1),cx.fillStyle="rgba(144,16,14,1)",cx.fillRect(53,34,1,1),cx.fillStyle="rgba(150,17,15,1)",cx.fillRect(54,34,1,1),cx.fillStyle="rgba(140,15,14,1)",cx.fillRect(55,34,1,1),cx.fillStyle="rgba(121,9,8,1)",cx.fillRect(56,34,1,1),cx.fillStyle="rgba(75,0,0,1)",cx.fillRect(57,34,1,1),cx.fillStyle="rgba(69,4,4,0.835)",cx.fillRect(58,34,1,1),cx.fillStyle="rgba(86,26,26,0.197)",cx.fillRect(59,34,1,1),cx.fillStyle="rgba(79,13,13,0.008)",cx.fillRect(60,34,1,1),cx.fillStyle="rgba(74,7,7,0)",cx.fillRect(61,34,1,1),cx.fillStyle="rgba(88,27,25,0)",cx.fillRect(62,34,1,1),cx.fillStyle="rgba(94,36,35,0)",cx.fillRect(63,34,1,1),cx.fillStyle="rgba(82,20,20,0)",cx.fillRect(64,34,1,1),cx.fillStyle="rgba(90,34,34,0)",cx.fillRect(65,34,1,1),cx.fillStyle="rgba(102,46,46,0)",cx.fillRect(66,34,1,1),cx.fillStyle="rgba(100,44,44,0)",cx.fillRect(67,34,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(0,35,1,1),cx.fillRect(1,35,1,1),cx.fillRect(2,35,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,35,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,35,1,1),cx.fillStyle="rgba(83,21,20,0)",cx.fillRect(5,35,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,35,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,35,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,35,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,35,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,35,1,1),cx.fillStyle="rgba(89,31,30,0)",cx.fillRect(11,35,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(12,35,1,1),cx.fillStyle="rgba(86,28,27,0)",cx.fillRect(13,35,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(14,35,1,1),cx.fillStyle="rgba(86,27,27,0.031)",cx.fillRect(15,35,1,1),cx.fillStyle="rgba(84,23,23,0.126)",cx.fillRect(16,35,1,1),cx.fillStyle="rgba(77,12,12,0.181)",cx.fillRect(17,35,1,1),cx.fillStyle="rgba(80,17,16,0.276)",cx.fillRect(18,35,1,1),cx.fillStyle="rgba(80,15,15,0.354)",cx.fillRect(19,35,1,1),cx.fillStyle="rgba(78,13,13,0.409)",cx.fillRect(20,35,1,1),cx.fillStyle="rgba(73,6,6,0.488)",cx.fillRect(21,35,1,1),cx.fillStyle="rgba(70,0,0,0.535)",cx.fillRect(22,35,1,1),cx.fillStyle="rgba(68,0,0,0.567)",cx.fillRect(23,35,1,1),cx.fillStyle="rgba(65,0,0,0.575)",cx.fillRect(24,35,1,1),cx.fillStyle="rgba(77,15,14,0.575)",cx.fillRect(25,35,1,1),cx.fillStyle="rgba(66,0,0,0.575)",cx.fillRect(26,35,1,1),cx.fillStyle="rgba(67,0,0,0.567)",cx.fillRect(27,35,1,1),cx.fillStyle="rgba(69,0,0,0.551)",cx.fillRect(28,35,1,1),cx.fillStyle="rgba(71,1,2,0.512)",cx.fillRect(29,35,1,1),cx.fillStyle="rgba(75,8,8,0.441)",cx.fillRect(30,35,1,1),cx.fillStyle="rgba(79,14,14,0.37)",cx.fillRect(31,35,1,1),cx.fillStyle="rgba(83,19,19,0.323)",cx.fillRect(32,35,1,1),cx.fillStyle="rgba(84,22,22,0.228)",cx.fillRect(33,35,1,1),cx.fillStyle="rgba(80,14,15,0.15)",cx.fillRect(34,35,1,1),cx.fillStyle="rgba(86,25,25,0.079)",cx.fillRect(35,35,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,35,1,1),cx.fillStyle="rgba(87,28,29,0)",cx.fillRect(37,35,1,1),cx.fillStyle="rgba(94,38,37,0)",cx.fillRect(38,35,1,1),cx.fillStyle="rgba(83,20,19,0)",cx.fillRect(39,35,1,1);cx.fillStyle="rgba(92,35,34,0)",cx.fillRect(40,35,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(41,35,1,1),cx.fillStyle="rgba(82,19,19,0)",cx.fillRect(42,35,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(43,35,1,1),cx.fillStyle="rgba(77,11,11,0)",cx.fillRect(44,35,1,1),cx.fillStyle="rgba(83,21,21,0)",cx.fillRect(45,35,1,1),cx.fillStyle="rgba(96,41,41,0)",cx.fillRect(46,35,1,1),cx.fillStyle="rgba(84,23,23,0)",cx.fillRect(47,35,1,1),cx.fillStyle="rgba(86,25,25,0)",cx.fillRect(48,35,1,1),cx.fillStyle="rgba(85,23,23,0.142)",cx.fillRect(49,35,1,1),cx.fillStyle="rgba(67,3,3,0.756)",cx.fillRect(50,35,1,1),cx.fillStyle="rgba(63,0,0,1)",cx.fillRect(51,35,1,1),cx.fillStyle="rgba(130,13,11,1)",cx.fillRect(52,35,1,1),cx.fillStyle="rgba(151,17,15,1)",cx.fillRect(53,35,1,1),cx.fillStyle="rgba(106,7,6,1)",cx.fillRect(54,35,1,1),cx.fillStyle="rgba(65,0,0,1)",cx.fillRect(55,35,1,1),cx.fillStyle="rgba(63,6,6,1)",cx.fillRect(56,35,1,1),cx.fillStyle="rgba(78,30,29,1)",cx.fillRect(57,35,1,1),cx.fillStyle="rgba(75,18,18,1)",cx.fillRect(58,35,1,1),cx.fillStyle="rgba(64,0,0,1)",cx.fillRect(59,35,1,1),cx.fillStyle="rgba(67,0,0,0.787)",cx.fillRect(60,35,1,1),cx.fillStyle="rgba(73,5,5,0.37)",cx.fillRect(61,35,1,1),cx.fillStyle="rgba(89,28,27,0)",cx.fillRect(62,35,1,1),cx.fillStyle="rgba(95,37,36,0)",cx.fillRect(63,35,1,1),cx.fillStyle="rgba(82,20,20,0)",cx.fillRect(64,35,1,1),cx.fillStyle="rgba(90,34,34,0)",cx.fillRect(65,35,1,1),cx.fillStyle="rgba(102,46,46,0)",cx.fillRect(66,35,1,1),cx.fillStyle="rgba(100,44,44,0)",cx.fillRect(67,35,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(0,36,1,1),cx.fillRect(1,36,1,1),cx.fillRect(2,36,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,36,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,36,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,36,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,36,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,36,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,36,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,36,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,36,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,36,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,36,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,36,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,36,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,36,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,36,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,36,1,1),cx.fillStyle="rgba(86,26,25,0)",cx.fillRect(18,36,1,1),cx.fillStyle="rgba(87,27,27,0)",cx.fillRect(19,36,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(20,36,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(21,36,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,36,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,36,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,36,1,1),cx.fillStyle="rgba(100,56,55,0)",cx.fillRect(25,36,1,1),cx.fillStyle="rgba(71,9,9,0)",cx.fillRect(26,36,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,36,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,36,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,36,1,1),cx.fillStyle="rgba(81,18,18,0)",cx.fillRect(30,36,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(31,36,1,1),cx.fillStyle="rgba(90,31,31,0)",cx.fillRect(32,36,1,1),cx.fillStyle="rgba(89,31,30,0)",cx.fillRect(33,36,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,36,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,36,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,36,1,1),cx.fillStyle="rgba(86,26,27,0)",cx.fillRect(37,36,1,1),cx.fillStyle="rgba(92,36,35,0)",cx.fillRect(38,36,1,1),cx.fillStyle="rgba(82,19,18,0)",cx.fillRect(39,36,1,1),cx.fillStyle="rgba(91,34,33,0)",cx.fillRect(40,36,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(41,36,1,1),cx.fillStyle="rgba(81,18,18,0)",cx.fillRect(42,36,1,1),cx.fillStyle="rgba(76,9,9,0)",cx.fillRect(43,36,1,1),cx.fillStyle="rgba(91,34,33,0)",cx.fillRect(44,36,1,1),cx.fillStyle="rgba(121,82,81,0)",cx.fillRect(45,36,1,1),cx.fillStyle="rgba(127,91,90,0)",cx.fillRect(46,36,1,1),cx.fillStyle="rgba(84,23,23,0)",cx.fillRect(47,36,1,1),cx.fillStyle="rgba(78,13,13,0.402)",cx.fillRect(48,36,1,1),cx.fillStyle="rgba(54,0,0,0.937)",cx.fillRect(49,36,1,1),cx.fillStyle="rgba(90,39,39,1)",cx.fillRect(50,36,1,1),cx.fillStyle="rgba(104,58,59,1)",cx.fillRect(51,36,1,1),cx.fillStyle="rgba(55,0,0,1)",cx.fillRect(52,36,1,1),cx.fillStyle="rgba(67,0,0,1)",cx.fillRect(53,36,1,1),cx.fillStyle="rgba(59,1,1,1)",cx.fillRect(54,36,1,1),cx.fillStyle="rgba(102,88,86,1)",cx.fillRect(55,36,1,1),cx.fillStyle="rgba(131,148,145,1)",cx.fillRect(56,36,1,1),cx.fillStyle="rgba(138,165,161,1)",cx.fillRect(57,36,1,1),cx.fillStyle="rgba(135,158,154,1)",cx.fillRect(58,36,1,1),cx.fillStyle="rgba(121,126,123,1)",cx.fillRect(59,36,1,1),cx.fillStyle="rgba(91,60,58,1)",cx.fillRect(60,36,1,1),cx.fillStyle="rgba(65,0,0,1)",cx.fillRect(61,36,1,1),cx.fillStyle="rgba(69,2,1,0.748)",cx.fillRect(62,36,1,1),cx.fillStyle="rgba(92,32,32,0.189)",cx.fillRect(63,36,1,1),cx.fillStyle="rgba(82,21,21,0)",cx.fillRect(64,36,1,1),cx.fillStyle="rgba(90,34,34,0)",cx.fillRect(65,36,1,1),cx.fillStyle="rgba(102,46,46,0)",cx.fillRect(66,36,1,1),cx.fillStyle="rgba(100,44,44,0)",cx.fillRect(67,36,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(0,37,1,1),cx.fillRect(1,37,1,1),cx.fillRect(2,37,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,37,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,37,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,37,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,37,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,37,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,37,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,37,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,37,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,37,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,37,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,37,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,37,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,37,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,37,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,37,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,37,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,37,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,37,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,37,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,37,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,37,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,37,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,37,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,37,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,37,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,37,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,37,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,37,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,37,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,37,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,37,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,37,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,37,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,37,1,1),cx.fillStyle="rgba(86,26,27,0)",cx.fillRect(37,37,1,1),cx.fillStyle="rgba(92,36,35,0)",cx.fillRect(38,37,1,1),cx.fillStyle="rgba(82,19,18,0)",cx.fillRect(39,37,1,1),cx.fillStyle="rgba(91,34,33,0)",cx.fillRect(40,37,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(41,37,1,1),cx.fillStyle="rgba(80,16,16,0)",cx.fillRect(42,37,1,1),cx.fillStyle="rgba(107,60,59,0)",cx.fillRect(43,37,1,1),cx.fillStyle="rgba(133,100,99,0)",cx.fillRect(44,37,1,1),cx.fillStyle="rgba(136,106,105,0)",cx.fillRect(45,37,1,1),cx.fillStyle="rgba(128,93,92,0)",cx.fillRect(46,37,1,1),cx.fillStyle="rgba(72,7,7,0.528)",cx.fillRect(47,37,1,1),cx.fillStyle="rgba(56,0,0,1)",cx.fillRect(48,37,1,1),cx.fillStyle="rgba(146,118,119,1)",cx.fillRect(49,37,1,1),cx.fillStyle="rgba(246,242,243,1)",cx.fillRect(50,37,1,1),cx.fillStyle="rgba(255,253,254,1)",cx.fillRect(51,37,1,1),cx.fillStyle="rgba(157,130,131,1)",cx.fillRect(52,37,1,1),cx.fillStyle="rgba(127,99,99,1)",cx.fillRect(53,37,1,1),cx.fillStyle="rgba(120,124,121,1)",cx.fillRect(54,37,1,1),cx.fillStyle="rgba(139,173,168,1)",cx.fillRect(55,37,1,1),cx.fillStyle="rgba(138,165,161,1)",cx.fillRect(56,37,1,1),cx.fillStyle="rgba(136,161,157,1)",cx.fillRect(57,37,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(58,37,1,1),cx.fillStyle="rgba(140,169,165,1)",cx.fillRect(59,37,1,1),cx.fillStyle="rgba(142,174,170,1)",cx.fillRect(60,37,1,1),cx.fillStyle="rgba(125,136,132,1)",cx.fillRect(61,37,1,1),cx.fillStyle="rgba(81,42,41,1)",cx.fillRect(62,37,1,1),cx.fillStyle="rgba(64,0,0,0.953)",cx.fillRect(63,37,1,1),cx.fillStyle="rgba(75,12,12,0.37)",cx.fillRect(64,37,1,1),cx.fillStyle="rgba(91,36,36,0)",cx.fillRect(65,37,1,1),cx.fillStyle="rgba(102,46,46,0)",cx.fillRect(66,37,1,1),cx.fillStyle="rgba(100,44,44,0)",cx.fillRect(67,37,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(0,38,1,1),cx.fillRect(1,38,1,1),cx.fillRect(2,38,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,38,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,38,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,38,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,38,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,38,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,38,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,38,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,38,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,38,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,38,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,38,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,38,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,38,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,38,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,38,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,38,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,38,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,38,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,38,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,38,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,38,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,38,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,38,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,38,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,38,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,38,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,38,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,38,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,38,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,38,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,38,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,38,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,38,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,38,1,1),cx.fillStyle="rgba(86,26,27,0)",cx.fillRect(37,38,1,1),cx.fillStyle="rgba(92,36,35,0)",cx.fillRect(38,38,1,1),cx.fillStyle="rgba(82,19,18,0)",cx.fillRect(39,38,1,1),cx.fillStyle="rgba(90,32,31,0)",cx.fillRect(40,38,1,1),cx.fillStyle="rgba(97,43,42,0)",cx.fillRect(41,38,1,1),cx.fillStyle="rgba(121,80,80,0)",cx.fillRect(42,38,1,1),cx.fillStyle="rgba(139,109,109,0)",cx.fillRect(43,38,1,1),cx.fillStyle="rgba(136,105,105,0)",cx.fillRect(44,38,1,1),cx.fillStyle="rgba(134,103,102,0)",cx.fillRect(45,38,1,1),cx.fillStyle="rgba(92,41,40,0.425)",cx.fillRect(46,38,1,1),cx.fillStyle="rgba(54,0,0,1)",cx.fillRect(47,38,1,1),cx.fillStyle="rgba(174,152,152,1)",cx.fillRect(48,38,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(49,38,1,1),cx.fillStyle="rgba(255,252,254,1)",cx.fillRect(50,38,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(51,38,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(52,38,1,1),cx.fillRect(53,38,1,1),cx.fillStyle="rgba(229,238,237,1)",cx.fillRect(54,38,1,1),cx.fillStyle="rgba(137,160,156,1)",cx.fillRect(55,38,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(56,38,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(57,38,1,1),cx.fillRect(58,38,1,1),cx.fillRect(59,38,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(60,38,1,1),cx.fillStyle="rgba(140,169,165,1)",cx.fillRect(61,38,1,1),cx.fillStyle="rgba(141,171,166,1)",cx.fillRect(62,38,1,1),cx.fillStyle="rgba(100,82,80,1)",cx.fillRect(63,38,1,1),cx.fillStyle="rgba(64,4,3,1)",cx.fillRect(64,38,1,1),cx.fillStyle="rgba(85,28,28,0.37)",cx.fillRect(65,38,1,1),cx.fillStyle="rgba(102,47,47,0)",cx.fillRect(66,38,1,1),cx.fillStyle="rgba(100,44,44,0)",cx.fillRect(67,38,1,1),cx.fillStyle="rgba(106,66,65,0)",cx.fillRect(0,39,1,1),cx.fillStyle="rgba(107,67,66,0)",cx.fillRect(1,39,1,1),cx.fillRect(2,39,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,39,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,39,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,39,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,39,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,39,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,39,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,39,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,39,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,39,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,39,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,39,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,39,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,39,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,39,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,39,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,39,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,39,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,39,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,39,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,39,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,39,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,39,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,39,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,39,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,39,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,39,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,39,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,39,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,39,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,39,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,39,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,39,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,39,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,39,1,1),cx.fillStyle="rgba(86,26,27,0)",cx.fillRect(37,39,1,1),cx.fillStyle="rgba(92,35,34,0)",cx.fillRect(38,39,1,1),cx.fillStyle="rgba(79,14,14,0)",cx.fillRect(39,39,1,1),cx.fillStyle="rgba(96,42,41,0)",cx.fillRect(40,39,1,1),cx.fillStyle="rgba(124,85,85,0)",cx.fillRect(41,39,1,1),cx.fillStyle="rgba(126,87,87,0)",cx.fillRect(42,39,1,1),cx.fillStyle="rgba(123,83,83,0)",cx.fillRect(43,39,1,1),cx.fillStyle="rgba(125,85,86,0)",cx.fillRect(44,39,1,1),cx.fillStyle="rgba(116,73,72,0.181)",cx.fillRect(45,39,1,1),cx.fillStyle="rgba(52,0,0,0.969)",cx.fillRect(46,39,1,1),cx.fillStyle="rgba(154,128,128,1)",cx.fillRect(47,39,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(48,39,1,1),cx.fillStyle="rgba(255,248,252,1)",cx.fillRect(49,39,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(50,39,1,1),cx.fillRect(51,39,1,1),cx.fillRect(52,39,1,1),cx.fillRect(53,39,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(54,39,1,1),cx.fillStyle="rgba(225,229,229,1)",cx.fillRect(55,39,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(56,39,1,1),cx.fillStyle="rgba(134,158,154,1)",cx.fillRect(57,39,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(58,39,1,1),cx.fillRect(59,39,1,1),cx.fillRect(60,39,1,1),cx.fillRect(61,39,1,1),cx.fillStyle="rgba(138,165,161,1)",cx.fillRect(62,39,1,1),cx.fillStyle="rgba(135,158,154,1)",cx.fillRect(63,39,1,1),cx.fillStyle="rgba(68,5,5,1)",cx.fillRect(64,39,1,1),cx.fillStyle="rgba(71,4,4,0.921)",cx.fillRect(65,39,1,1),cx.fillStyle="rgba(100,48,47,0.055)",cx.fillRect(66,39,1,1),cx.fillStyle="rgba(101,47,47,0)",cx.fillRect(67,39,1,1),cx.fillStyle="rgba(104,63,62,0)",cx.fillRect(0,40,1,1),cx.fillRect(1,40,1,1),cx.fillStyle="rgba(107,68,67,0)",cx.fillRect(2,40,1,1),cx.fillStyle="rgba(108,70,69,0)",cx.fillRect(3,40,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,40,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,40,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,40,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,40,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,40,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,40,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,40,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,40,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,40,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,40,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,40,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,40,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,40,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,40,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,40,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,40,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,40,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,40,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,40,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,40,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,40,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,40,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,40,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,40,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,40,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,40,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,40,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,40,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,40,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,40,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,40,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,40,1,1),cx.fillStyle="rgba(79,13,13,0)",cx.fillRect(36,40,1,1),cx.fillStyle="rgba(85,24,25,0)",cx.fillRect(37,40,1,1),cx.fillStyle="rgba(95,41,40,0)",cx.fillRect(38,40,1,1),cx.fillStyle="rgba(93,38,37,0)",cx.fillRect(39,40,1,1),cx.fillStyle="rgba(99,47,46,0)",cx.fillRect(40,40,1,1),cx.fillStyle="rgba(97,43,43,0)",cx.fillRect(41,40,1,1),cx.fillStyle="rgba(96,43,42,0)",cx.fillRect(42,40,1,1),cx.fillRect(43,40,1,1),cx.fillStyle="rgba(99,45,44,0)",cx.fillRect(44,40,1,1),cx.fillStyle="rgba(68,5,5,0.669)",cx.fillRect(45,40,1,1),cx.fillStyle="rgba(92,49,49,1)",cx.fillRect(46,40,1,1),cx.fillStyle="rgba(251,249,250,1)",cx.fillRect(47,40,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(48,40,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(49,40,1,1),cx.fillRect(50,40,1,1),cx.fillRect(51,40,1,1),cx.fillRect(52,40,1,1),cx.fillRect(53,40,1,1),cx.fillStyle="rgba(255,247,250,1)",cx.fillRect(54,40,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(55,40,1,1),cx.fillStyle="rgba(197,207,205,1)",cx.fillRect(56,40,1,1),cx.fillStyle="rgba(126,152,148,1)",cx.fillRect(57,40,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(58,40,1,1),cx.fillRect(59,40,1,1),cx.fillRect(60,40,1,1),cx.fillRect(61,40,1,1),cx.fillStyle="rgba(137,161,157,1)",cx.fillRect(62,40,1,1),cx.fillStyle="rgba(136,161,158,1)",cx.fillRect(63,40,1,1),cx.fillStyle="rgba(88,54,53,1)",cx.fillRect(64,40,1,1),cx.fillStyle="rgba(62,0,0,0.976)",cx.fillRect(65,40,1,1),cx.fillStyle="rgba(98,44,44,0.236)",cx.fillRect(66,40,1,1),cx.fillStyle="rgba(113,65,64,0)",cx.fillRect(67,40,1,1),cx.fillStyle="rgba(208,194,195,0)",cx.fillRect(0,41,1,1),cx.fillStyle="rgba(117,80,80,0)",cx.fillRect(1,41,1,1),cx.fillStyle="rgba(101,59,58,0)",cx.fillRect(2,41,1,1),cx.fillStyle="rgba(108,71,70,0)",cx.fillRect(3,41,1,1),cx.fillStyle="rgba(98,49,49,0)",cx.fillRect(4,41,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,41,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,41,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,41,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,41,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,41,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,41,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,41,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,41,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,41,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,41,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,41,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,41,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,41,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,41,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,41,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,41,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,41,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,41,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,41,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,41,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,41,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,41,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,41,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,41,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,41,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,41,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,41,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,41,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,41,1,1),cx.fillStyle="rgba(80,15,16,0)",cx.fillRect(34,41,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(35,41,1,1),cx.fillStyle="rgba(76,9,9,0)",cx.fillRect(36,41,1,1),cx.fillStyle="rgba(85,23,24,0)",cx.fillRect(37,41,1,1),cx.fillStyle="rgba(101,53,53,0)",cx.fillRect(38,41,1,1),cx.fillStyle="rgba(102,54,54,0)",cx.fillRect(39,41,1,1),cx.fillStyle="rgba(101,53,53,0)",cx.fillRect(40,41,1,1),cx.fillRect(41,41,1,1),cx.fillRect(42,41,1,1),cx.fillStyle="rgba(102,54,54,0)",cx.fillRect(43,41,1,1),cx.fillStyle="rgba(98,49,48,0.15)",cx.fillRect(44,41,1,1),cx.fillStyle="rgba(55,0,0,0.976)";cx.fillRect(45,41,1,1),cx.fillStyle="rgba(182,164,164,1)",cx.fillRect(46,41,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(47,41,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(48,41,1,1),cx.fillRect(49,41,1,1),cx.fillRect(50,41,1,1),cx.fillRect(51,41,1,1),cx.fillRect(52,41,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(53,41,1,1),cx.fillStyle="rgba(249,244,246,1)",cx.fillRect(54,41,1,1),cx.fillStyle="rgba(230,232,233,1)",cx.fillRect(55,41,1,1),cx.fillStyle="rgba(253,251,252,1)",cx.fillRect(56,41,1,1),cx.fillStyle="rgba(148,170,167,1)",cx.fillRect(57,41,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(58,41,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(59,41,1,1),cx.fillRect(60,41,1,1),cx.fillRect(61,41,1,1),cx.fillRect(62,41,1,1),cx.fillStyle="rgba(138,163,159,1)",cx.fillRect(63,41,1,1),cx.fillStyle="rgba(139,169,164,1)",cx.fillRect(64,41,1,1),cx.fillStyle="rgba(86,54,52,1)",cx.fillRect(65,41,1,1),cx.fillStyle="rgba(67,3,3,0.85)",cx.fillRect(66,41,1,1),cx.fillStyle="rgba(101,49,48,0.094)",cx.fillRect(67,41,1,1),cx.fillStyle="rgba(255,255,255,0)",cx.fillRect(0,42,1,1),cx.fillStyle="rgba(220,210,211,0)",cx.fillRect(1,42,1,1),cx.fillStyle="rgba(116,79,77,0)",cx.fillRect(2,42,1,1),cx.fillStyle="rgba(102,62,61,0)",cx.fillRect(3,42,1,1),cx.fillStyle="rgba(98,49,50,0)",cx.fillRect(4,42,1,1),cx.fillStyle="rgba(82,20,19,0)",cx.fillRect(5,42,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,42,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,42,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,42,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,42,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,42,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,42,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,42,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,42,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,42,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,42,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,42,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,42,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,42,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,42,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,42,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,42,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,42,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,42,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,42,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,42,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,42,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,42,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,42,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,42,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,42,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,42,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,42,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(33,42,1,1),cx.fillStyle="rgba(79,14,15,0)",cx.fillRect(34,42,1,1),cx.fillStyle="rgba(84,22,22,0)",cx.fillRect(35,42,1,1),cx.fillStyle="rgba(94,39,38,0)",cx.fillRect(36,42,1,1),cx.fillStyle="rgba(107,60,59,0)",cx.fillRect(37,42,1,1),cx.fillStyle="rgba(110,64,64,0)",cx.fillRect(38,42,1,1),cx.fillStyle="rgba(109,63,63,0)",cx.fillRect(39,42,1,1),cx.fillRect(40,42,1,1),cx.fillRect(41,42,1,1),cx.fillStyle="rgba(109,64,63,0)",cx.fillRect(42,42,1,1),cx.fillStyle="rgba(113,69,68,0)",cx.fillRect(43,42,1,1),cx.fillStyle="rgba(88,30,30,0.425)",cx.fillRect(44,42,1,1),cx.fillStyle="rgba(72,17,17,1)",cx.fillRect(45,42,1,1),cx.fillStyle="rgba(240,233,235,1)",cx.fillRect(46,42,1,1),cx.fillStyle="rgba(255,252,254,1)",cx.fillRect(47,42,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(48,42,1,1),cx.fillRect(49,42,1,1),cx.fillRect(50,42,1,1),cx.fillRect(51,42,1,1),cx.fillRect(52,42,1,1),cx.fillStyle="rgba(255,247,250,1)",cx.fillRect(53,42,1,1),cx.fillStyle="rgba(253,249,252,1)",cx.fillRect(54,42,1,1),cx.fillStyle="rgba(164,182,180,1)",cx.fillRect(55,42,1,1),cx.fillStyle="rgba(241,242,243,1)",cx.fillRect(56,42,1,1),cx.fillStyle="rgba(198,208,207,1)",cx.fillRect(57,42,1,1),cx.fillStyle="rgba(126,153,148,1)",cx.fillRect(58,42,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(59,42,1,1),cx.fillRect(60,42,1,1),cx.fillRect(61,42,1,1),cx.fillRect(62,42,1,1),cx.fillRect(63,42,1,1),cx.fillStyle="rgba(140,168,164,1)",cx.fillRect(64,42,1,1),cx.fillStyle="rgba(122,131,128,1)",cx.fillRect(65,42,1,1),cx.fillStyle="rgba(67,6,6,1)",cx.fillRect(66,42,1,1),cx.fillStyle="rgba(79,18,18,0.52)",cx.fillRect(67,42,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,43,1,1),cx.fillStyle="rgba(251,250,253,0)",cx.fillRect(1,43,1,1),cx.fillStyle="rgba(220,211,213,0)",cx.fillRect(2,43,1,1),cx.fillStyle="rgba(118,81,80,0)",cx.fillRect(3,43,1,1),cx.fillStyle="rgba(92,42,41,0)",cx.fillRect(4,43,1,1),cx.fillStyle="rgba(82,21,19,0)",cx.fillRect(5,43,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(6,43,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,43,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,43,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,43,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,43,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,43,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,43,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,43,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,43,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,43,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,43,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,43,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,43,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,43,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,43,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,43,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,43,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,43,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,43,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,43,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,43,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,43,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,43,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,43,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,43,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,43,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(32,43,1,1),cx.fillStyle="rgba(86,27,26,0)",cx.fillRect(33,43,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(34,43,1,1),cx.fillStyle="rgba(103,52,52,0)",cx.fillRect(35,43,1,1),cx.fillStyle="rgba(132,98,97,0)",cx.fillRect(36,43,1,1),cx.fillStyle="rgba(132,98,98,0)",cx.fillRect(37,43,1,1),cx.fillStyle="rgba(131,97,96,0)",cx.fillRect(38,43,1,1),cx.fillRect(39,43,1,1),cx.fillRect(40,43,1,1),cx.fillStyle="rgba(132,97,96,0)",cx.fillRect(41,43,1,1),cx.fillStyle="rgba(131,96,95,0)",cx.fillRect(42,43,1,1),cx.fillStyle="rgba(131,95,95,0)",cx.fillRect(43,43,1,1),cx.fillStyle="rgba(67,8,8,0.772)",cx.fillRect(44,43,1,1),cx.fillStyle="rgba(116,78,79,1)",cx.fillRect(45,43,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(46,43,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(47,43,1,1),cx.fillRect(48,43,1,1),cx.fillRect(49,43,1,1),cx.fillRect(50,43,1,1),cx.fillRect(51,43,1,1),cx.fillRect(52,43,1,1),cx.fillRect(53,43,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(54,43,1,1),cx.fillStyle="rgba(163,181,178,1)",cx.fillRect(55,43,1,1),cx.fillStyle="rgba(181,195,193,1)",cx.fillRect(56,43,1,1),cx.fillStyle="rgba(229,233,232,1)",cx.fillRect(57,43,1,1),cx.fillStyle="rgba(129,155,150,1)",cx.fillRect(58,43,1,1),cx.fillStyle="rgba(133,157,153,1)",cx.fillRect(59,43,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(60,43,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(61,43,1,1),cx.fillRect(62,43,1,1),cx.fillStyle="rgba(136,161,157,1)",cx.fillRect(63,43,1,1),cx.fillStyle="rgba(138,165,161,1)",cx.fillRect(64,43,1,1),cx.fillStyle="rgba(79,32,31,1)",cx.fillRect(65,43,1,1),cx.fillStyle="rgba(65,0,0,1)",cx.fillRect(66,43,1,1),cx.fillStyle="rgba(74,12,12,0.567)",cx.fillRect(67,43,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,44,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,44,1,1),cx.fillStyle="rgba(251,251,253,0)",cx.fillRect(2,44,1,1),cx.fillStyle="rgba(222,214,215,0)",cx.fillRect(3,44,1,1),cx.fillStyle="rgba(106,60,59,0)",cx.fillRect(4,44,1,1),cx.fillStyle="rgba(74,9,9,0)",cx.fillRect(5,44,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(6,44,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(7,44,1,1),cx.fillStyle="rgba(83,23,23,0)",cx.fillRect(8,44,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,44,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,44,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,44,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,44,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,44,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,44,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,44,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,44,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,44,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,44,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,44,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,44,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,44,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,44,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,44,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,44,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,44,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,44,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,44,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,44,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,44,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,44,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(31,44,1,1),cx.fillStyle="rgba(89,31,30,0)",cx.fillRect(32,44,1,1),cx.fillStyle="rgba(101,49,48,0)",cx.fillRect(33,44,1,1),cx.fillStyle="rgba(120,78,77,0)",cx.fillRect(34,44,1,1),cx.fillStyle="rgba(133,96,95,0)",cx.fillRect(35,44,1,1),cx.fillStyle="rgba(132,95,94,0)",cx.fillRect(36,44,1,1),cx.fillStyle="rgba(131,94,93,0)",cx.fillRect(37,44,1,1),cx.fillRect(38,44,1,1),cx.fillRect(39,44,1,1),cx.fillRect(40,44,1,1),cx.fillStyle="rgba(133,96,95,0)",cx.fillRect(41,44,1,1),cx.fillStyle="rgba(123,80,79,0)",cx.fillRect(42,44,1,1),cx.fillStyle="rgba(86,34,34,0.465)",cx.fillRect(43,44,1,1),cx.fillStyle="rgba(62,13,13,1)",cx.fillRect(44,44,1,1),cx.fillStyle="rgba(213,202,203,1)",cx.fillRect(45,44,1,1),cx.fillStyle="rgba(255,253,254,1)",cx.fillRect(46,44,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(47,44,1,1),cx.fillRect(48,44,1,1),cx.fillRect(49,44,1,1),cx.fillRect(50,44,1,1),cx.fillRect(51,44,1,1),cx.fillRect(52,44,1,1),cx.fillRect(53,44,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(54,44,1,1),cx.fillStyle="rgba(167,184,182,1)",cx.fillRect(55,44,1,1),cx.fillStyle="rgba(141,164,161,1)",cx.fillRect(56,44,1,1),cx.fillStyle="rgba(228,232,232,1)",cx.fillRect(57,44,1,1),cx.fillStyle="rgba(127,152,148,1)",cx.fillRect(58,44,1,1),cx.fillStyle="rgba(165,182,179,1)",cx.fillRect(59,44,1,1),cx.fillStyle="rgba(146,167,164,1)",cx.fillRect(60,44,1,1),cx.fillStyle="rgba(134,159,155,1)",cx.fillRect(61,44,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(62,44,1,1),cx.fillRect(63,44,1,1),cx.fillStyle="rgba(140,170,166,1)",cx.fillRect(64,44,1,1),cx.fillStyle="rgba(87,50,49,1)",cx.fillRect(65,44,1,1),cx.fillStyle="rgba(69,4,4,0.748)",cx.fillRect(66,44,1,1),cx.fillStyle="rgba(86,28,28,0.055)",cx.fillRect(67,44,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,45,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,45,1,1),cx.fillRect(2,45,1,1),cx.fillStyle="rgba(252,252,253,0)",cx.fillRect(3,45,1,1),cx.fillStyle="rgba(215,203,205,0)",cx.fillRect(4,45,1,1),cx.fillStyle="rgba(103,50,50,0)",cx.fillRect(5,45,1,1),cx.fillStyle="rgba(71,5,4,0)",cx.fillRect(6,45,1,1),cx.fillStyle="rgba(72,8,7,0)",cx.fillRect(7,45,1,1),cx.fillStyle="rgba(81,20,20,0)",cx.fillRect(8,45,1,1),cx.fillStyle="rgba(79,15,15,0)",cx.fillRect(9,45,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(10,45,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,45,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,45,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,45,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,45,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,45,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,45,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,45,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,45,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,45,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,45,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,45,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,45,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,45,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,45,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,45,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,45,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,45,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,45,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,45,1,1),cx.fillStyle="rgba(80,17,17,0)",cx.fillRect(30,45,1,1),cx.fillStyle="rgba(83,22,22,0)",cx.fillRect(31,45,1,1),cx.fillStyle="rgba(89,31,31,0)",cx.fillRect(32,45,1,1),cx.fillStyle="rgba(110,64,63,0)",cx.fillRect(33,45,1,1),cx.fillStyle="rgba(112,66,65,0)",cx.fillRect(34,45,1,1),cx.fillStyle="rgba(109,62,62,0)",cx.fillRect(35,45,1,1),cx.fillStyle="rgba(109,62,61,0)",cx.fillRect(36,45,1,1),cx.fillRect(37,45,1,1),cx.fillRect(38,45,1,1),cx.fillRect(39,45,1,1),cx.fillRect(40,45,1,1),cx.fillStyle="rgba(112,65,65,0)",cx.fillRect(41,45,1,1),cx.fillStyle="rgba(97,44,44,0.354)",cx.fillRect(42,45,1,1),cx.fillStyle="rgba(58,0,0,1)",cx.fillRect(43,45,1,1),cx.fillStyle="rgba(125,85,86,1)",cx.fillRect(44,45,1,1),cx.fillStyle="rgba(222,212,212,1)",cx.fillRect(45,45,1,1),cx.fillStyle="rgba(254,250,252,1)",cx.fillRect(46,45,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(47,45,1,1),cx.fillRect(48,45,1,1),cx.fillRect(49,45,1,1),cx.fillRect(50,45,1,1),cx.fillRect(51,45,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(52,45,1,1),cx.fillStyle="rgba(255,247,250,1)",cx.fillRect(53,45,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(54,45,1,1),cx.fillStyle="rgba(156,176,173,1)",cx.fillRect(55,45,1,1),cx.fillStyle="rgba(128,154,150,1)",cx.fillRect(56,45,1,1),cx.fillStyle="rgba(227,231,232,1)",cx.fillRect(57,45,1,1),cx.fillStyle="rgba(162,181,178,1)",cx.fillRect(58,45,1,1),cx.fillStyle="rgba(232,235,235,1)",cx.fillRect(59,45,1,1),cx.fillStyle="rgba(155,175,172,1)",cx.fillRect(60,45,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(61,45,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(62,45,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(63,45,1,1),cx.fillStyle="rgba(142,173,169,1)",cx.fillRect(64,45,1,1),cx.fillStyle="rgba(93,68,66,1)",cx.fillRect(65,45,1,1),cx.fillStyle="rgba(73,10,10,0.717)",cx.fillRect(66,45,1,1),cx.fillStyle="rgba(97,43,43,0)",cx.fillRect(67,45,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,46,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,46,1,1),cx.fillRect(2,46,1,1),cx.fillStyle="rgba(243,239,241,0)",cx.fillRect(3,46,1,1),cx.fillStyle="rgba(248,247,249,0)",cx.fillRect(4,46,1,1),cx.fillStyle="rgba(240,236,238,0)",cx.fillRect(5,46,1,1),cx.fillStyle="rgba(202,184,186,0)",cx.fillRect(6,46,1,1),cx.fillStyle="rgba(146,108,108,0)",cx.fillRect(7,46,1,1),cx.fillStyle="rgba(85,25,25,0)",cx.fillRect(8,46,1,1),cx.fillStyle="rgba(70,2,2,0)",cx.fillRect(9,46,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(10,46,1,1),cx.fillStyle="rgba(88,30,29,0)",cx.fillRect(11,46,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,46,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,46,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,46,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,46,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,46,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,46,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,46,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,46,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,46,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,46,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,46,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,46,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,46,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,46,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,46,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,46,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,46,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,46,1,1),cx.fillStyle="rgba(81,19,19,0)",cx.fillRect(30,46,1,1),cx.fillStyle="rgba(81,20,19,0)",cx.fillRect(31,46,1,1),cx.fillStyle="rgba(75,12,12,0)",cx.fillRect(32,46,1,1),cx.fillStyle="rgba(74,11,10,0)",cx.fillRect(33,46,1,1),cx.fillStyle="rgba(74,10,9,0)",cx.fillRect(34,46,1,1),cx.fillStyle="rgba(74,10,10,0)",cx.fillRect(35,46,1,1),cx.fillRect(36,46,1,1),cx.fillRect(37,46,1,1),cx.fillRect(38,46,1,1),cx.fillRect(39,46,1,1),cx.fillRect(40,46,1,1),cx.fillStyle="rgba(74,11,10,0)",cx.fillRect(41,46,1,1),cx.fillStyle="rgba(71,7,6,0.661)",cx.fillRect(42,46,1,1),cx.fillStyle="rgba(69,0,0,1)",cx.fillRect(43,46,1,1),cx.fillStyle="rgba(57,3,3,1)",cx.fillRect(44,46,1,1),cx.fillStyle="rgba(118,86,86,1)",cx.fillRect(45,46,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(46,46,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(47,46,1,1),cx.fillRect(48,46,1,1),cx.fillRect(49,46,1,1),cx.fillRect(50,46,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(51,46,1,1),cx.fillStyle="rgba(252,247,249,1)",cx.fillRect(52,46,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(53,46,1,1),cx.fillStyle="rgba(244,242,243,1)",cx.fillRect(54,46,1,1),cx.fillStyle="rgba(139,163,159,1)",cx.fillRect(55,46,1,1),cx.fillStyle="rgba(128,154,150,1)",cx.fillRect(56,46,1,1),cx.fillStyle="rgba(231,232,234,1)",cx.fillRect(57,46,1,1),cx.fillStyle="rgba(255,252,255,1)",cx.fillRect(58,46,1,1),cx.fillStyle="rgba(255,253,255,1)",cx.fillRect(59,46,1,1),cx.fillStyle="rgba(161,179,177,1)",cx.fillRect(60,46,1,1),cx.fillStyle="rgba(130,156,151,1)",cx.fillRect(61,46,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(62,46,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(63,46,1,1),cx.fillStyle="rgba(142,173,168,1)",cx.fillRect(64,46,1,1),cx.fillStyle="rgba(92,64,62,1)",cx.fillRect(65,46,1,1),cx.fillStyle="rgba(71,6,5,0.717)",cx.fillRect(66,46,1,1),cx.fillStyle="rgba(89,32,32,0)",cx.fillRect(67,46,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,47,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,47,1,1),cx.fillRect(2,47,1,1),cx.fillRect(3,47,1,1),cx.fillRect(4,47,1,1),cx.fillStyle="rgba(245,243,245,0)",cx.fillRect(5,47,1,1),cx.fillStyle="rgba(251,251,253,0)",cx.fillRect(6,47,1,1),cx.fillStyle="rgba(253,254,255,0)",cx.fillRect(7,47,1,1),cx.fillStyle="rgba(221,211,212,0)",cx.fillRect(8,47,1,1),cx.fillStyle="rgba(135,92,93,0)",cx.fillRect(9,47,1,1),cx.fillStyle="rgba(75,13,12,0)",cx.fillRect(10,47,1,1),cx.fillStyle="rgba(82,23,21,0)",cx.fillRect(11,47,1,1),cx.fillStyle="rgba(78,13,13,0)",cx.fillRect(12,47,1,1),cx.fillStyle="rgba(85,26,25,0)",cx.fillRect(13,47,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,47,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,47,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,47,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,47,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,47,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,47,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,47,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,47,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,47,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,47,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,47,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,47,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,47,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,47,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,47,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,47,1,1),cx.fillStyle="rgba(81,19,19,0)",cx.fillRect(30,47,1,1),cx.fillStyle="rgba(83,23,22,0)",cx.fillRect(31,47,1,1),cx.fillStyle="rgba(77,15,14,0)",cx.fillRect(32,47,1,1),cx.fillStyle="rgba(78,16,15,0)",cx.fillRect(33,47,1,1),cx.fillRect(34,47,1,1),cx.fillRect(35,47,1,1),cx.fillRect(36,47,1,1),cx.fillRect(37,47,1,1),cx.fillRect(38,47,1,1),cx.fillRect(39,47,1,1),cx.fillRect(40,47,1,1),cx.fillStyle="rgba(79,16,15,0)",cx.fillRect(41,47,1,1),cx.fillStyle="rgba(86,26,25,0.071)",cx.fillRect(42,47,1,1),cx.fillStyle="rgba(85,25,25,0.291)",cx.fillRect(43,47,1,1),cx.fillStyle="rgba(59,0,0,0.906)",cx.fillRect(44,47,1,1),cx.fillStyle="rgba(160,131,132,1)",cx.fillRect(45,47,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(46,47,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(47,47,1,1),cx.fillRect(48,47,1,1),cx.fillRect(49,47,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(50,47,1,1),cx.fillStyle="rgba(241,240,241,1)",cx.fillRect(51,47,1,1),cx.fillStyle="rgba(185,198,196,1)",cx.fillRect(52,47,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(53,47,1,1),cx.fillStyle="rgba(220,225,225,1)",cx.fillRect(54,47,1,1),cx.fillStyle="rgba(125,152,147,1)",cx.fillRect(55,47,1,1),cx.fillStyle="rgba(141,164,160,1)",cx.fillRect(56,47,1,1),cx.fillStyle="rgba(246,244,245,1)",cx.fillRect(57,47,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(58,47,1,1),cx.fillRect(59,47,1,1),cx.fillStyle="rgba(153,174,170,1)",cx.fillRect(60,47,1,1),cx.fillStyle="rgba(131,157,152,1)",cx.fillRect(61,47,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(62,47,1,1),cx.fillRect(63,47,1,1),cx.fillStyle="rgba(140,169,164,1)",cx.fillRect(64,47,1,1),cx.fillStyle="rgba(80,33,33,1)",cx.fillRect(65,47,1,1),cx.fillStyle="rgba(79,14,14,0.575)",cx.fillRect(66,47,1,1),cx.fillStyle="rgba(102,49,49,0)",cx.fillRect(67,47,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,48,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,48,1,1),cx.fillRect(2,48,1,1),cx.fillRect(3,48,1,1),cx.fillRect(4,48,1,1);cx.fillRect(5,48,1,1),cx.fillRect(6,48,1,1),cx.fillRect(7,48,1,1),cx.fillStyle="rgba(249,249,251,0)",cx.fillRect(8,48,1,1),cx.fillStyle="rgba(249,248,250,0)",cx.fillRect(9,48,1,1),cx.fillStyle="rgba(198,179,180,0)",cx.fillRect(10,48,1,1),cx.fillStyle="rgba(112,63,63,0)",cx.fillRect(11,48,1,1),cx.fillStyle="rgba(65,0,0,0)",cx.fillRect(12,48,1,1),cx.fillStyle="rgba(82,22,21,0)",cx.fillRect(13,48,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(14,48,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(15,48,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,48,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,48,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,48,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,48,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,48,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,48,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,48,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,48,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,48,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,48,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,48,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,48,1,1),cx.fillStyle="rgba(75,9,9,0)",cx.fillRect(28,48,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(29,48,1,1),cx.fillStyle="rgba(77,13,13,0)",cx.fillRect(30,48,1,1),cx.fillStyle="rgba(72,11,11,0)",cx.fillRect(31,48,1,1),cx.fillStyle="rgba(70,8,8,0)",cx.fillRect(32,48,1,1),cx.fillStyle="rgba(71,9,8,0)",cx.fillRect(33,48,1,1),cx.fillRect(34,48,1,1),cx.fillRect(35,48,1,1),cx.fillRect(36,48,1,1),cx.fillRect(37,48,1,1),cx.fillRect(38,48,1,1),cx.fillRect(39,48,1,1),cx.fillRect(40,48,1,1),cx.fillRect(41,48,1,1),cx.fillStyle="rgba(74,12,12,0)",cx.fillRect(42,48,1,1),cx.fillStyle="rgba(72,10,10,0.079)",cx.fillRect(43,48,1,1),cx.fillStyle="rgba(62,0,0,0.976)",cx.fillRect(44,48,1,1),cx.fillStyle="rgba(104,62,62,1)",cx.fillRect(45,48,1,1),cx.fillStyle="rgba(244,240,241,1)",cx.fillRect(46,48,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(47,48,1,1),cx.fillStyle="rgba(254,247,250,1)",cx.fillRect(48,48,1,1),cx.fillStyle="rgba(255,250,253,1)",cx.fillRect(49,48,1,1),cx.fillStyle="rgba(254,252,254,1)",cx.fillRect(50,48,1,1),cx.fillStyle="rgba(162,181,177,1)",cx.fillRect(51,48,1,1),cx.fillStyle="rgba(179,193,191,1)",cx.fillRect(52,48,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(53,48,1,1),cx.fillStyle="rgba(177,193,190,1)",cx.fillRect(54,48,1,1),cx.fillStyle="rgba(114,143,138,1)",cx.fillRect(55,48,1,1),cx.fillStyle="rgba(197,208,206,1)",cx.fillRect(56,48,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(57,48,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(58,48,1,1),cx.fillStyle="rgba(230,232,232,1)",cx.fillRect(59,48,1,1),cx.fillStyle="rgba(133,158,154,1)",cx.fillRect(60,48,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(61,48,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(62,48,1,1),cx.fillStyle="rgba(139,167,163,1)",cx.fillRect(63,48,1,1),cx.fillStyle="rgba(128,142,139,1)",cx.fillRect(64,48,1,1),cx.fillStyle="rgba(64,3,3,1)",cx.fillRect(65,48,1,1),cx.fillStyle="rgba(90,34,33,0.323)",cx.fillRect(66,48,1,1),cx.fillStyle="rgba(103,52,51,0)",cx.fillRect(67,48,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,49,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,49,1,1),cx.fillRect(2,49,1,1),cx.fillRect(3,49,1,1),cx.fillRect(4,49,1,1),cx.fillRect(5,49,1,1),cx.fillRect(6,49,1,1),cx.fillRect(7,49,1,1),cx.fillRect(8,49,1,1),cx.fillStyle="rgba(244,241,243,0)",cx.fillRect(9,49,1,1),cx.fillStyle="rgba(253,253,255,0)",cx.fillRect(10,49,1,1),cx.fillStyle="rgba(238,233,235,0)",cx.fillRect(11,49,1,1),cx.fillStyle="rgba(166,134,135,0)",cx.fillRect(12,49,1,1),cx.fillStyle="rgba(89,31,30,0)",cx.fillRect(13,49,1,1),cx.fillStyle="rgba(66,0,0,0)",cx.fillRect(14,49,1,1),cx.fillStyle="rgba(84,25,25,0)",cx.fillRect(15,49,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(16,49,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,49,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,49,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,49,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,49,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,49,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,49,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,49,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,49,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,49,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,49,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,49,1,1),cx.fillStyle="rgba(75,9,8,0)",cx.fillRect(28,49,1,1),cx.fillStyle="rgba(76,9,9,0)",cx.fillRect(29,49,1,1),cx.fillStyle="rgba(96,42,42,0)",cx.fillRect(30,49,1,1),cx.fillStyle="rgba(99,49,49,0)",cx.fillRect(31,49,1,1),cx.fillStyle="rgba(99,48,48,0)",cx.fillRect(32,49,1,1),cx.fillRect(33,49,1,1),cx.fillRect(34,49,1,1),cx.fillRect(35,49,1,1),cx.fillRect(36,49,1,1),cx.fillRect(37,49,1,1),cx.fillRect(38,49,1,1),cx.fillRect(39,49,1,1),cx.fillRect(40,49,1,1),cx.fillRect(41,49,1,1),cx.fillStyle="rgba(99,48,47,0)",cx.fillRect(42,49,1,1),cx.fillStyle="rgba(100,50,49,0.024)",cx.fillRect(43,49,1,1),cx.fillStyle="rgba(80,19,19,0.614)",cx.fillRect(44,49,1,1),cx.fillStyle="rgba(60,0,0,1)",cx.fillRect(45,49,1,1),cx.fillStyle="rgba(229,218,219,1)",cx.fillRect(46,49,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(47,49,1,1),cx.fillStyle="rgba(255,249,252,1)",cx.fillRect(48,49,1,1),cx.fillStyle="rgba(236,238,238,1)",cx.fillRect(49,49,1,1),cx.fillStyle="rgba(144,167,162,1)",cx.fillRect(50,49,1,1),cx.fillStyle="rgba(140,163,159,1)",cx.fillRect(51,49,1,1),cx.fillStyle="rgba(249,248,249,1)",cx.fillRect(52,49,1,1),cx.fillStyle="rgba(218,224,223,1)",cx.fillRect(53,49,1,1),cx.fillStyle="rgba(122,149,145,1)",cx.fillRect(54,49,1,1),cx.fillStyle="rgba(187,200,198,1)",cx.fillRect(55,49,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(56,49,1,1),cx.fillStyle="rgba(244,243,244,1)",cx.fillRect(57,49,1,1),cx.fillStyle="rgba(216,223,222,1)",cx.fillRect(58,49,1,1),cx.fillStyle="rgba(148,169,166,1)",cx.fillRect(59,49,1,1),cx.fillStyle="rgba(132,157,152,1)",cx.fillRect(60,49,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(61,49,1,1),cx.fillRect(62,49,1,1),cx.fillStyle="rgba(140,171,167,1)",cx.fillRect(63,49,1,1),cx.fillStyle="rgba(86,51,49,1)",cx.fillRect(64,49,1,1),cx.fillStyle="rgba(71,9,9,0.827)",cx.fillRect(65,49,1,1),cx.fillStyle="rgba(96,42,42,0.039)",cx.fillRect(66,49,1,1),cx.fillStyle="rgba(96,42,42,0)",cx.fillRect(67,49,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,50,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,50,1,1),cx.fillRect(2,50,1,1),cx.fillRect(3,50,1,1),cx.fillRect(4,50,1,1),cx.fillRect(5,50,1,1),cx.fillRect(6,50,1,1),cx.fillRect(7,50,1,1),cx.fillRect(8,50,1,1),cx.fillRect(9,50,1,1),cx.fillRect(10,50,1,1),cx.fillStyle="rgba(246,244,246,0)",cx.fillRect(11,50,1,1),cx.fillStyle="rgba(254,255,255,0)",cx.fillRect(12,50,1,1),cx.fillStyle="rgba(219,207,209,0)",cx.fillRect(13,50,1,1),cx.fillStyle="rgba(139,96,97,0)",cx.fillRect(14,50,1,1),cx.fillStyle="rgba(85,26,26,0)",cx.fillRect(15,50,1,1),cx.fillStyle="rgba(76,13,12,0)",cx.fillRect(16,50,1,1),cx.fillStyle="rgba(78,14,14,0)",cx.fillRect(17,50,1,1),cx.fillStyle="rgba(85,25,24,0)",cx.fillRect(18,50,1,1),cx.fillStyle="rgba(86,26,26,0)",cx.fillRect(19,50,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,50,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,50,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,50,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,50,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,50,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,50,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,50,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,50,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(28,50,1,1),cx.fillStyle="rgba(77,12,12,0)",cx.fillRect(29,50,1,1),cx.fillStyle="rgba(103,52,52,0)",cx.fillRect(30,50,1,1),cx.fillStyle="rgba(105,56,55,0)",cx.fillRect(31,50,1,1),cx.fillStyle="rgba(104,55,54,0)",cx.fillRect(32,50,1,1),cx.fillRect(33,50,1,1),cx.fillRect(34,50,1,1),cx.fillRect(35,50,1,1),cx.fillRect(36,50,1,1),cx.fillRect(37,50,1,1),cx.fillRect(38,50,1,1),cx.fillRect(39,50,1,1),cx.fillRect(40,50,1,1),cx.fillRect(41,50,1,1),cx.fillRect(42,50,1,1),cx.fillStyle="rgba(106,57,56,0)",cx.fillRect(43,50,1,1),cx.fillStyle="rgba(94,38,38,0.11)",cx.fillRect(44,50,1,1),cx.fillStyle="rgba(55,0,0,0.976)",cx.fillRect(45,50,1,1),cx.fillStyle="rgba(182,162,162,1)",cx.fillRect(46,50,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(47,50,1,1),cx.fillStyle="rgba(255,248,251,1)",cx.fillRect(48,50,1,1),cx.fillStyle="rgba(240,238,240,1)",cx.fillRect(49,50,1,1),cx.fillStyle="rgba(202,211,209,1)",cx.fillRect(50,50,1,1),cx.fillStyle="rgba(248,246,248,1)",cx.fillRect(51,50,1,1),cx.fillStyle="rgba(209,217,215,1)",cx.fillRect(52,50,1,1),cx.fillStyle="rgba(145,168,164,1)",cx.fillRect(53,50,1,1),cx.fillStyle="rgba(213,219,219,1)",cx.fillRect(54,50,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(55,50,1,1),cx.fillStyle="rgba(240,240,241,1)",cx.fillRect(56,50,1,1),cx.fillStyle="rgba(140,163,159,1)",cx.fillRect(57,50,1,1),cx.fillStyle="rgba(127,153,149,1)",cx.fillRect(58,50,1,1),cx.fillStyle="rgba(132,157,153,1)",cx.fillRect(59,50,1,1),cx.fillStyle="rgba(137,160,156,1)",cx.fillRect(60,50,1,1),cx.fillStyle="rgba(135,159,155,1)",cx.fillRect(61,50,1,1),cx.fillStyle="rgba(143,175,171,1)",cx.fillRect(62,50,1,1),cx.fillStyle="rgba(119,122,119,1)",cx.fillRect(63,50,1,1),cx.fillStyle="rgba(58,0,0,1)",cx.fillRect(64,50,1,1),cx.fillStyle="rgba(103,52,52,0.26)",cx.fillRect(65,50,1,1),cx.fillStyle="rgba(131,91,92,0)",cx.fillRect(66,50,1,1),cx.fillStyle="rgba(127,86,86,0)",cx.fillRect(67,50,1,1),cx.fillStyle="rgba(248,243,245,0)",cx.fillRect(0,51,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,51,1,1),cx.fillRect(2,51,1,1),cx.fillRect(3,51,1,1),cx.fillRect(4,51,1,1),cx.fillRect(5,51,1,1),cx.fillRect(6,51,1,1),cx.fillRect(7,51,1,1),cx.fillRect(8,51,1,1),cx.fillRect(9,51,1,1),cx.fillRect(10,51,1,1),cx.fillRect(11,51,1,1),cx.fillRect(12,51,1,1),cx.fillStyle="rgba(249,248,250,0)",cx.fillRect(13,51,1,1),cx.fillStyle="rgba(255,255,255,0)",cx.fillRect(14,51,1,1),cx.fillStyle="rgba(205,188,189,0)",cx.fillRect(15,51,1,1),cx.fillStyle="rgba(116,67,67,0)",cx.fillRect(16,51,1,1),cx.fillStyle="rgba(70,3,3,0)",cx.fillRect(17,51,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(18,51,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(19,51,1,1),cx.fillStyle="rgba(84,24,24,0)",cx.fillRect(20,51,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,51,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,51,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,51,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,51,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,51,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,51,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,51,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(28,51,1,1),cx.fillStyle="rgba(93,37,37,0)",cx.fillRect(29,51,1,1),cx.fillStyle="rgba(106,57,57,0)",cx.fillRect(30,51,1,1),cx.fillStyle="rgba(104,53,53,0)",cx.fillRect(31,51,1,1),cx.fillRect(32,51,1,1),cx.fillRect(33,51,1,1),cx.fillRect(34,51,1,1),cx.fillRect(35,51,1,1),cx.fillRect(36,51,1,1),cx.fillRect(37,51,1,1),cx.fillRect(38,51,1,1),cx.fillRect(39,51,1,1),cx.fillRect(40,51,1,1),cx.fillRect(41,51,1,1),cx.fillRect(42,51,1,1),cx.fillRect(43,51,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(44,51,1,1),cx.fillStyle="rgba(76,18,18,0.638)",cx.fillRect(45,51,1,1),cx.fillStyle="rgba(76,28,28,1)",cx.fillRect(46,51,1,1),cx.fillStyle="rgba(227,216,218,1)",cx.fillRect(47,51,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(48,51,1,1),cx.fillStyle="rgba(255,248,252,1)",cx.fillRect(49,51,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(50,51,1,1),cx.fillStyle="rgba(228,231,231,1)",cx.fillRect(51,51,1,1),cx.fillStyle="rgba(190,201,200,1)",cx.fillRect(52,51,1,1),cx.fillStyle="rgba(246,244,246,1)",cx.fillRect(53,51,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(54,51,1,1),cx.fillStyle="rgba(252,249,251,1)",cx.fillRect(55,51,1,1),cx.fillStyle="rgba(160,179,176,1)",cx.fillRect(56,51,1,1),cx.fillStyle="rgba(128,154,149,1)",cx.fillRect(57,51,1,1),cx.fillStyle="rgba(136,160,156,1)",cx.fillRect(58,51,1,1),cx.fillStyle="rgba(136,159,155,1)",cx.fillRect(59,51,1,1),cx.fillStyle="rgba(137,162,158,1)",cx.fillRect(60,51,1,1),cx.fillStyle="rgba(143,175,171,1)",cx.fillRect(61,51,1,1),cx.fillStyle="rgba(124,134,130,1)",cx.fillRect(62,51,1,1),cx.fillStyle="rgba(68,15,15,1)",cx.fillRect(63,51,1,1),cx.fillStyle="rgba(81,23,24,0.646)",cx.fillRect(64,51,1,1),cx.fillStyle="rgba(108,59,59,0)",cx.fillRect(65,51,1,1),cx.fillStyle="rgba(105,55,55,0)",cx.fillRect(66,51,1,1),cx.fillRect(67,51,1,1),cx.fillStyle="rgba(248,243,245,0.063)",cx.fillRect(0,52,1,1),cx.fillStyle="rgba(243,240,242,0)",cx.fillRect(1,52,1,1),cx.fillRect(2,52,1,1),cx.fillRect(3,52,1,1),cx.fillRect(4,52,1,1),cx.fillRect(5,52,1,1),cx.fillRect(6,52,1,1),cx.fillRect(7,52,1,1),cx.fillRect(8,52,1,1),cx.fillRect(9,52,1,1),cx.fillRect(10,52,1,1),cx.fillRect(11,52,1,1),cx.fillRect(12,52,1,1),cx.fillRect(13,52,1,1),cx.fillRect(14,52,1,1),cx.fillStyle="rgba(250,250,252,0)",cx.fillRect(15,52,1,1),cx.fillStyle="rgba(247,245,248,0)",cx.fillRect(16,52,1,1),cx.fillStyle="rgba(189,167,168,0)",cx.fillRect(17,52,1,1),cx.fillStyle="rgba(89,30,30,0)",cx.fillRect(18,52,1,1),cx.fillStyle="rgba(81,19,19,0)",cx.fillRect(19,52,1,1),cx.fillStyle="rgba(84,25,25,0)",cx.fillRect(20,52,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,52,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,52,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,52,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,52,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,52,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,52,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,52,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(28,52,1,1),cx.fillStyle="rgba(102,48,48,0)",cx.fillRect(29,52,1,1),cx.fillStyle="rgba(108,59,59,0)",cx.fillRect(30,52,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(31,52,1,1),cx.fillRect(32,52,1,1),cx.fillRect(33,52,1,1),cx.fillRect(34,52,1,1),cx.fillRect(35,52,1,1),cx.fillRect(36,52,1,1),cx.fillRect(37,52,1,1),cx.fillRect(38,52,1,1),cx.fillRect(39,52,1,1),cx.fillRect(40,52,1,1),cx.fillRect(41,52,1,1),cx.fillRect(42,52,1,1),cx.fillRect(43,52,1,1),cx.fillStyle="rgba(108,58,58,0)",cx.fillRect(44,52,1,1),cx.fillStyle="rgba(107,57,57,0.079)",cx.fillRect(45,52,1,1),cx.fillStyle="rgba(64,3,3,0.811)",cx.fillRect(46,52,1,1),cx.fillStyle="rgba(79,33,33,1)",cx.fillRect(47,52,1,1),cx.fillStyle="rgba(209,196,197,1)",cx.fillRect(48,52,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(49,52,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(50,52,1,1),cx.fillStyle="rgba(255,249,251,1)",cx.fillRect(51,52,1,1),cx.fillStyle="rgba(255,254,255,1)",cx.fillRect(52,52,1,1),cx.fillStyle="rgba(255,255,255,1)",cx.fillRect(53,52,1,1),cx.fillStyle="rgba(245,245,246,1)",cx.fillRect(54,52,1,1),cx.fillStyle="rgba(166,183,180,1)",cx.fillRect(55,52,1,1),cx.fillStyle="rgba(126,153,149,1)",cx.fillRect(56,52,1,1),cx.fillStyle="rgba(137,159,155,1)",cx.fillRect(57,52,1,1),cx.fillStyle="rgba(137,163,159,1)",cx.fillRect(58,52,1,1),cx.fillStyle="rgba(142,174,169,1)",cx.fillRect(59,52,1,1),cx.fillStyle="rgba(138,165,160,1)",cx.fillRect(60,52,1,1),cx.fillStyle="rgba(105,94,92,1)",cx.fillRect(61,52,1,1),cx.fillStyle="rgba(65,5,5,1)",cx.fillRect(62,52,1,1),cx.fillStyle="rgba(73,8,8,0.701)",cx.fillRect(63,52,1,1),cx.fillStyle="rgba(119,74,74,0.055)",cx.fillRect(64,52,1,1),cx.fillStyle="rgba(129,88,88,0)",cx.fillRect(65,52,1,1),cx.fillStyle="rgba(127,85,85,0)",cx.fillRect(66,52,1,1),cx.fillRect(67,52,1,1),cx.fillStyle="rgba(252,246,248,0.402)",cx.fillRect(0,53,1,1),cx.fillStyle="rgba(245,241,243,0.055)",cx.fillRect(1,53,1,1),cx.fillStyle="rgba(245,241,243,0)",cx.fillRect(2,53,1,1),cx.fillRect(3,53,1,1),cx.fillRect(4,53,1,1),cx.fillRect(5,53,1,1),cx.fillRect(6,53,1,1),cx.fillRect(7,53,1,1),cx.fillRect(8,53,1,1),cx.fillRect(9,53,1,1),cx.fillRect(10,53,1,1),cx.fillRect(11,53,1,1),cx.fillRect(12,53,1,1),cx.fillRect(13,53,1,1),cx.fillRect(14,53,1,1),cx.fillRect(15,53,1,1),cx.fillStyle="rgba(246,243,245,0)",cx.fillRect(16,53,1,1),cx.fillStyle="rgba(255,255,255,0)",cx.fillRect(17,53,1,1),cx.fillStyle="rgba(205,186,187,0)",cx.fillRect(18,53,1,1),cx.fillStyle="rgba(91,33,33,0)",cx.fillRect(19,53,1,1),cx.fillStyle="rgba(82,21,20,0)",cx.fillRect(20,53,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,53,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,53,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,53,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,53,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,53,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,53,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,53,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(28,53,1,1),cx.fillStyle="rgba(101,47,47,0)",cx.fillRect(29,53,1,1),cx.fillStyle="rgba(108,59,59,0)",cx.fillRect(30,53,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(31,53,1,1),cx.fillRect(32,53,1,1),cx.fillRect(33,53,1,1),cx.fillRect(34,53,1,1),cx.fillRect(35,53,1,1),cx.fillRect(36,53,1,1),cx.fillRect(37,53,1,1),cx.fillRect(38,53,1,1),cx.fillRect(39,53,1,1),cx.fillRect(40,53,1,1),cx.fillRect(41,53,1,1),cx.fillRect(42,53,1,1),cx.fillRect(43,53,1,1),cx.fillRect(44,53,1,1),cx.fillStyle="rgba(108,60,59,0)",cx.fillRect(45,53,1,1),cx.fillStyle="rgba(91,32,32,0.094)",cx.fillRect(46,53,1,1),cx.fillStyle="rgba(67,3,3,0.717)",cx.fillRect(47,53,1,1),cx.fillStyle="rgba(61,8,8,1)",cx.fillRect(48,53,1,1),cx.fillStyle="rgba(154,125,126,1)",cx.fillRect(49,53,1,1),cx.fillStyle="rgba(227,224,225,1)",cx.fillRect(50,53,1,1),cx.fillStyle="rgba(246,248,249,1)",cx.fillRect(51,53,1,1),cx.fillStyle="rgba(236,245,245,1)",cx.fillRect(52,53,1,1),cx.fillStyle="rgba(201,216,215,1)",cx.fillRect(53,53,1,1),cx.fillStyle="rgba(147,172,168,1)",cx.fillRect(54,53,1,1),cx.fillStyle="rgba(130,158,153,1)",cx.fillRect(55,53,1,1),cx.fillStyle="rgba(139,166,162,1)",cx.fillRect(56,53,1,1),cx.fillStyle="rgba(142,174,170,1)",cx.fillRect(57,53,1,1),cx.fillStyle="rgba(135,159,154,1)",cx.fillRect(58,53,1,1),cx.fillStyle="rgba(102,86,84,1)",cx.fillRect(59,53,1,1),cx.fillStyle="rgba(76,25,25,1)",cx.fillRect(60,53,1,1),cx.fillStyle="rgba(63,0,0,0.953)",cx.fillRect(61,53,1,1),cx.fillStyle="rgba(78,13,13,0.488)",cx.fillRect(62,53,1,1),cx.fillStyle="rgba(93,34,34,0.008)",cx.fillRect(63,53,1,1),cx.fillStyle="rgba(120,74,74,0)",cx.fillRect(64,53,1,1),cx.fillStyle="rgba(126,84,84,0)",cx.fillRect(65,53,1,1),cx.fillStyle="rgba(125,82,82,0)",cx.fillRect(66,53,1,1),cx.fillRect(67,53,1,1),cx.fillStyle="rgba(248,242,245,0.165)",cx.fillRect(0,54,1,1),cx.fillStyle="rgba(245,241,243,0.016)",cx.fillRect(1,54,1,1),cx.fillStyle="rgba(245,241,243,0)",cx.fillRect(2,54,1,1),cx.fillRect(3,54,1,1),cx.fillRect(4,54,1,1),cx.fillRect(5,54,1,1),cx.fillRect(6,54,1,1),cx.fillRect(7,54,1,1),cx.fillRect(8,54,1,1),cx.fillRect(9,54,1,1),cx.fillRect(10,54,1,1),cx.fillRect(11,54,1,1),cx.fillRect(12,54,1,1),cx.fillRect(13,54,1,1),cx.fillRect(14,54,1,1),cx.fillRect(15,54,1,1),cx.fillRect(16,54,1,1),cx.fillStyle="rgba(245,240,243,0)",cx.fillRect(17,54,1,1),cx.fillStyle="rgba(255,255,255,0)",cx.fillRect(18,54,1,1),cx.fillStyle="rgba(175,147,148,0)",cx.fillRect(19,54,1,1),cx.fillStyle="rgba(76,13,13,0)",cx.fillRect(20,54,1,1),cx.fillStyle="rgba(79,16,16,0)",cx.fillRect(21,54,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,54,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,54,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,54,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,54,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,54,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,54,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(28,54,1,1),cx.fillStyle="rgba(101,47,47,0)",cx.fillRect(29,54,1,1),cx.fillStyle="rgba(108,59,59,0)",cx.fillRect(30,54,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(31,54,1,1),cx.fillRect(32,54,1,1),cx.fillRect(33,54,1,1),cx.fillRect(34,54,1,1),cx.fillRect(35,54,1,1),cx.fillRect(36,54,1,1),cx.fillRect(37,54,1,1),cx.fillRect(38,54,1,1),cx.fillRect(39,54,1,1),cx.fillRect(40,54,1,1),cx.fillRect(41,54,1,1),cx.fillRect(42,54,1,1),cx.fillRect(43,54,1,1),cx.fillRect(44,54,1,1),cx.fillStyle="rgba(107,59,58,0)",cx.fillRect(45,54,1,1),cx.fillStyle="rgba(91,34,34,0)",cx.fillRect(46,54,1,1),cx.fillStyle="rgba(88,26,26,0)",cx.fillRect(47,54,1,1),cx.fillStyle="rgba(77,14,14,0.449)",cx.fillRect(48,54,1,1),cx.fillStyle="rgba(56,0,0,0.929)",cx.fillRect(49,54,1,1),cx.fillStyle="rgba(68,14,13,1)",cx.fillRect(50,54,1,1),cx.fillStyle="rgba(85,44,43,1)",cx.fillRect(51,54,1,1),cx.fillStyle="rgba(101,87,85,1)",cx.fillRect(52,54,1,1),cx.fillStyle="rgba(111,117,114,1)",cx.fillRect(53,54,1,1),cx.fillStyle="rgba(125,141,138,1)",cx.fillRect(54,54,1,1),cx.fillStyle="rgba(131,150,146,1)",cx.fillRect(55,54,1,1),cx.fillStyle="rgba(127,140,137,1)",cx.fillRect(56,54,1,1),cx.fillStyle="rgba(107,95,92,1)",cx.fillRect(57,54,1,1),cx.fillStyle="rgba(74,22,21,1)",cx.fillRect(58,54,1,1),cx.fillStyle="rgba(64,0,0,0.898)",cx.fillRect(59,54,1,1),cx.fillStyle="rgba(72,2,2,0.528)",cx.fillRect(60,54,1,1),cx.fillStyle="rgba(82,17,17,0.15)",cx.fillRect(61,54,1,1),cx.fillStyle="rgba(90,28,27,0)",cx.fillRect(62,54,1,1),cx.fillStyle="rgba(92,32,32,0)",cx.fillRect(63,54,1,1),cx.fillStyle="rgba(119,73,73,0)",cx.fillRect(64,54,1,1),cx.fillStyle="rgba(126,84,84,0)",cx.fillRect(65,54,1,1),cx.fillStyle="rgba(125,82,82,0)",cx.fillRect(66,54,1,1),cx.fillRect(67,54,1,1),cx.fillStyle="rgba(244,240,242,0)",cx.fillRect(0,55,1,1),cx.fillRect(1,55,1,1),cx.fillRect(2,55,1,1),cx.fillRect(3,55,1,1),cx.fillRect(4,55,1,1),cx.fillRect(5,55,1,1),cx.fillRect(6,55,1,1),cx.fillRect(7,55,1,1),cx.fillRect(8,55,1,1);cx.fillRect(9,55,1,1),cx.fillRect(10,55,1,1),cx.fillRect(11,55,1,1),cx.fillRect(12,55,1,1),cx.fillRect(13,55,1,1),cx.fillRect(14,55,1,1),cx.fillRect(15,55,1,1),cx.fillRect(16,55,1,1),cx.fillRect(17,55,1,1),cx.fillStyle="rgba(251,249,251,0)",cx.fillRect(18,55,1,1),cx.fillStyle="rgba(213,197,199,0)",cx.fillRect(19,55,1,1),cx.fillStyle="rgba(80,18,18,0)",cx.fillRect(20,55,1,1),cx.fillStyle="rgba(79,16,15,0)",cx.fillRect(21,55,1,1),cx.fillStyle="rgba(75,8,8,0)",cx.fillRect(22,55,1,1),cx.fillStyle="rgba(73,6,5,0)",cx.fillRect(23,55,1,1),cx.fillStyle="rgba(67,0,0,0)",cx.fillRect(24,55,1,1),cx.fillStyle="rgba(98,53,52,0)",cx.fillRect(25,55,1,1),cx.fillStyle="rgba(71,8,8,0)",cx.fillRect(26,55,1,1),cx.fillStyle="rgba(72,2,2,0)",cx.fillRect(27,55,1,1),cx.fillStyle="rgba(76,10,10,0)",cx.fillRect(28,55,1,1),cx.fillStyle="rgba(101,47,47,0)",cx.fillRect(29,55,1,1),cx.fillStyle="rgba(108,59,59,0)",cx.fillRect(30,55,1,1),cx.fillStyle="rgba(107,57,57,0)",cx.fillRect(31,55,1,1),cx.fillRect(32,55,1,1),cx.fillRect(33,55,1,1),cx.fillRect(34,55,1,1),cx.fillRect(35,55,1,1),cx.fillRect(36,55,1,1),cx.fillRect(37,55,1,1),cx.fillRect(38,55,1,1),cx.fillRect(39,55,1,1),cx.fillRect(40,55,1,1),cx.fillRect(41,55,1,1),cx.fillRect(42,55,1,1),cx.fillRect(43,55,1,1),cx.fillRect(44,55,1,1),cx.fillStyle="rgba(107,59,58,0)",cx.fillRect(45,55,1,1),cx.fillStyle="rgba(91,33,33,0)",cx.fillRect(46,55,1,1),cx.fillStyle="rgba(86,25,25,0)",cx.fillRect(47,55,1,1),cx.fillStyle="rgba(86,27,27,0)",cx.fillRect(48,55,1,1),cx.fillStyle="rgba(87,26,25,0.118)",cx.fillRect(49,55,1,1),cx.fillStyle="rgba(75,8,8,0.402)",cx.fillRect(50,55,1,1),cx.fillStyle="rgba(73,7,7,0.614)",cx.fillRect(51,55,1,1),cx.fillStyle="rgba(66,0,0,0.858)",cx.fillRect(52,55,1,1),cx.fillStyle="rgba(66,0,0,0.984)",cx.fillRect(53,55,1,1),cx.fillStyle="rgba(68,5,5,1)",cx.fillRect(54,55,1,1),cx.fillStyle="rgba(71,8,8,1)",cx.fillRect(55,55,1,1),cx.fillStyle="rgba(67,2,2,1)",cx.fillRect(56,55,1,1),cx.fillStyle="rgba(66,0,0,0.898)",cx.fillRect(57,55,1,1),cx.fillStyle="rgba(72,2,3,0.551)",cx.fillRect(58,55,1,1),cx.fillStyle="rgba(84,20,20,0.102)",cx.fillRect(59,55,1,1),cx.fillStyle="rgba(78,12,12,0)",cx.fillRect(60,55,1,1),cx.fillStyle="rgba(83,19,19,0)",cx.fillRect(61,55,1,1),cx.fillStyle="rgba(88,26,26,0)",cx.fillRect(62,55,1,1),cx.fillStyle="rgba(92,32,32,0)",cx.fillRect(63,55,1,1),cx.fillStyle="rgba(119,73,73,0)",cx.fillRect(64,55,1,1),cx.fillStyle="rgba(126,84,84,0)",cx.fillRect(65,55,1,1),cx.fillStyle="rgba(125,82,82,0)",cx.fillRect(66,55,1,1),cx.fillRect(67,55,1,1);
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
    partitionDiv.prepend("<label>Partition filter <a title=\"Hit enter to activate the selected partition\" id=\"partitionFilterHelp\">[?]</span>: </label>");

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

// Used to in cases where jQuery caches the selector at the begining of the script.
function triggerEvent(ev, el){
    "use strict";

    var event = document.createEvent('HTMLEvents');
    event.initEvent(ev, true, true);
    el.dispatchEvent(event);

}


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
