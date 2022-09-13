const readline = require('readline');
const path = require("path");
const fs = require('fs');
const childProcess = require('child_process');

// globals
let cwd = path.dirname(__filename);
let spawnedProcesses = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: cwd + ">",
});

rl.prompt();

function cdFunction(_path){
    let newPath;
    if(path.isAbsolute(_path)) {
        newPath = _path;
    } else {
        newPath = path.join(cwd, _path);
        if(!fs.existsSync(newPath)) {
            console.log("The system cannot find the path specified.\n");
            return;
        }
    }
    rl.setPrompt(newPath + ">");
    cwd = newPath;
}

function pwdFunction(){
    console.log(`${cwd}`);
}

function lsFunction(pathString){
    const _path = pathString || cwd;
    fs.readdirSync(_path).forEach((file)=>{
        console.log(file);
    });
}

function executeBinary(pathToBinary, args){
    if(!pathToBinary) return;
    const isAbsolutePath = path.isAbsolute(pathToBinary);
    let fileLocation = "";
    if(isAbsolutePath){ 
        fileLocation=pathToBinary;
    } else {
        fileLocation = path.join(cwd, pathToBinary);
    }
    // check if file exists
    const binaryFound = fs.existsSync(fileLocation);
    if(!binaryFound) {
        console.log(`'${pathToBinary}' is not recognized as an internal or external command,operable program or batch file.\n`);
        return;
    } else {
        const newProcess = childProcess.spawn(fileLocation, args, {
            detached: true,
        }).unref();
        spawnedProcesses.push(newProcess);
        // use this to get output of spawned processes in same terminal window
        // newProcess.stdout.pipe(process.stdout);
    }
}

function fgFunction(args){
    // not implemented, did not understand the question
    console.log(spawnedProcesses.map(e=>e.pid));
}

function onLineInput(value){
    const sanitizedValue = value.trim();
    const arr=sanitizedValue.split(" ");

    const command = arr[0].toLowerCase();
    const args = arr.slice(1);
    
    switch(command) {
        case "cd": cdFunction(args[0]);
                   rl.prompt();
                   break;
        case "pwd": pwdFunction();
                    rl.prompt();
                    break;
        case "ls": lsFunction(args[0]);
                    rl.prompt();
                    break;
        case "fg": fgFunction(args);
                    rl.prompt();
                    break;
        default: executeBinary(command, args);
                 rl.prompt();
    }
}

rl.on("line", onLineInput);
rl.on("SIGINT", ()=>{
    process.exit();
})
rl.on("SIGTSTP", ()=>{
    // not working on windows, could not implement as foreground/background process question not clear
});