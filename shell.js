const readline = require('readline');
const path = require("path");
const fs = require('fs');
const childProcess = require('child_process');

// globals
let cwd = path.dirname(__filename);
let spawnedProcesses = [];
let fgIndex = -1;


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: cwd + ">",
});

rl.prompt();

function cdFunction(_path){
    if( _path == null){
        return;
    }
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
        const newProcess = childProcess.spawn(fileLocation, args);
        spawnedProcesses.push(newProcess);
        console.log(`Child process spawned with PID ${newProcess.pid}`)
        // use this to get output of spawned processes in same terminal window
        // newProcess.stdout.pipe(process.stdout);
    }
}

function fgFunction(pid){
    //sending foreground process to background
    if(fgIndex !==-1){
        spawnedProcesses[fgIndex].stdout.unpipe(process.stdout);
    }

    //checking for required process

    const index = spawnedProcesses.findIndex((proc) => {
        return proc.pid == pid
    })
    fgIndex = index;
    if(index !== -1){
        //bringing process to foreground
        spawnedProcesses[index].stdout.pipe(process.stdout);
    }
    else{
        console.log(`No spawned process with PID : ${pid}`)
        rl.prompt();
    }
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
        case "fg": fgFunction(args[0]);
                    break;
        case "exit": process.exit()
                    break;
        default: executeBinary(command, args);
                rl.prompt();
    }
}

rl.on("line", onLineInput);
rl.on("SIGINT", ()=>{
    if(fgIndex!==-1){
        //killing the current process
        spawnedProcesses[fgIndex].kill()
    
        //removing child process for spwaned processes
        spawnedProcesses.splice(fgIndex, 1);
    
        //updating current process index
        fgIndex = -1;
    }
    rl.prompt();
})
rl.on("SIGTSTP", ()=>{
    if(fgIndex!==-1){
        //sending current process to background
        spawnedProcesses[fgIndex].stdout.unpipe(process.stdout);
        //printing process PID
        console.log(spawnedProcesses[fgIndex].pid);
        rl.prompt();
    }
});