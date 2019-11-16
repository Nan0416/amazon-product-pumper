#!/usr/bin/env node
'use strict'
const AmazonProductDB = require('./table_definition').AmazonProductDB;
const server = "localhost"
let am = new AmazonProductDB(`postgres://nan:12345@${server}:5432/cs6400_project`);
am.sync(["review", "user"])
.then((_)=>{
    console.log("Done");
    process.exit(0);
})
.catch(err =>{
    console.log(err.message);
    process.exit(0);
});