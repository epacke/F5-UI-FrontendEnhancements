var walk = require("walk");
var fs = require("fs");

const MAIN_FILE = "./main.js";


var walker;

function buildScript(){
    return new Promise(function(resolve, reject){

    })
}

function getFile(path){
    return new Promise(function(resolve, reject){
        fs.readFile(path, 'utf8', function (err, data) {
            if(err){
                reject("Unable to read file: " + path);
            } else {
                resolve(data);
            }
        });
    })
}

var fileContent = "";
var allFileReads = [];

getFile(MAIN_FILE).then(data => {
    fileContent += data;

    walker = walk.walk("./Functions/", null);

    walker.on("file", function (root, fileStats, next) {
    
        allFileReads.push(
            getFile(root + "/" + fileStats.name)
                .then(data => {
                    fileContent += "\n" + data;
                })
        );
        next();  
    });
    
    walker.on("end", function () {
        Promise.all(allFileReads).then(function(){

            fs.writeFile("./F5-UI-Enhancements.js", fileContent, function(err) {
                if(err) {
                    return console.log(err);
                }
            }); 


        })    
    });

});



