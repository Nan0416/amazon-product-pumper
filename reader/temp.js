let table = [];
for(let i = 0; i < 10; i++){
    table.push(new Promise((resolve, reject)=>{
        if(i != 5){
            resolve(i * 10);
        }else{
            reject(i * 100);
        }
    }));
}
let pro = new Promise((resolve, reject)=>{
    setTimeout(()=>{
        resolve(-1);
    },1000)
});
let temp = pro;
for(let i = 0; i < table.length; i++){
    temp = temp.then((v)=>{
        console.log(v);
        return table[i];
    });
}
temp.catch(err => {
    console.log("err " + err);
})
const bcrypt = require('bcrypt');
bcrypt.hash("12345", 10, console.log);
