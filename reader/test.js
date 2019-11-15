
'use strict'
const AmazonProductDB = require('./table_definition').AmazonProductDB;
let am = new AmazonProductDB("postgres://nan:12345@localhost:5432/cs6400_project");
am.upsert_category("hellssso")
.then((temp) => {
    console.log(temp);
})
.catch(err => {
    console.log(err);
})
