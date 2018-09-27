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