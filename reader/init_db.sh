#!/usr/bin/env node
'use strict'
const AmazonProductDB = require('./table_definition').AmazonProductDB;
const server = "qinnan.dev"
let am = new AmazonProductDB(`postgres://nan:12345@${server}:5432/cs6400_project`);
am.sync((err, result)=>{
    if(err != null){
        console.log(err.message);
    }else{
        console.log("Success!");
    }
    process.exit(0);
})
