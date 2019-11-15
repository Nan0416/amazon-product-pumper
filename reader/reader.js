
const readline = require('readline');
const EventEmitter = require('events');
const fs = require('fs');
const lineByLine = require('n-readlines');

class Scheduler{
    constructor(){
        this.event = new EventEmitter();
        this.max_task = 0;
        this.stop = false;
    }
    setTask(task){
        this.event.on('next', ()=>{
            task(()=>{
                if(!this.stop){
                    this.event.emit('next');
                }
            });
        });
    }
   
    runTask(max_task){
        while(max_task > 0 && !this.stop){
            this.event.emit('next');
            max_task--;
        }
    }
    stopTask(){
        this.stop = true;
    }
}


class LineReader{
    constructor(filename){
        this.liner = new lineByLine(filename);
        this.scheduler = new Scheduler();
    }
    setLineHanlder(lineHandler){
        this.scheduler.setTask((end)=>{
            let line = this.liner.next();
            if(line == null){
                this.scheduler.stopTask();
            }else{
                lineHandler(line, end);
            }
        });
    }
    run(maxTask){
        this.scheduler.runTask(maxTask);
    }
}
module.exports.LineReader = LineReader;