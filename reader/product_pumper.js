'use strict';
const readline = require('readline');
const fs = require('fs');
const process = require('process');
const extract_fields = require('./utilities').extract_fields;
const AmazonProductDB = require('./table_definition').AmazonProductDB;
const LineReader = require('./reader').LineReader;
const db_server = "qinnan.dev";
let amazonProductDB = new AmazonProductDB(`postgres://nan:12345@${db_server}:5432/cs6400_project`);
let lineReader = new LineReader("../raw_data/meta_Electronics.json");

const statistic = {
    old_count:0,
    count:0,
    duplicated_product:0
}

function convert_image_url(url){
    return url;
}

// 60 (second) / 0.25 (second/request) * 50 (parallel) = 12000 (request/minute) = 200 (request/second)
setInterval(()=>{
    let speed = statistic.count - statistic.old_count;
    statistic.old_count = statistic.count;
    console.log(`=== status: current ${statistic.count}, speed ${speed} (request/second), duplicated product : ${statistic.duplicated_product}, current time ${new Date().toString()} ====`);
}, 1000);


function store_product(product){
    amazonProductDB.product.build(product).save()
    .then(_=>{
        let images = [];
        let avoid_dupl = new Set();
        for(let i = 0; i < product.image.length; i++){ // image can contains duplicated.
            if(avoid_dupl.has(product.image[i])){
                continue;
            }
            avoid_dupl.add(product.image[i]);
            images.push({asin: product.asin, url: convert_image_url(product.image[i])});
        }
        amazonProductDB.image.bulkCreate(images)
        .catch(err => {
            console.log(err.message);
            console.log(product);
        });
        
        if(product.category == null){
            return;
        }
        for(let i = 0; i < product.category.length; i++){
            amazonProductDB.upsert_category(product.category[i]).then(item => {
                amazonProductDB.pc_mapping.build({product_asin: product.asin, category_id: item.id}).save()
                .catch(err => {
                    console.log(err.message)
                });
            })
            .catch(_ => { // error can happen when two tasks to create the same category, the failed one just retry.
                amazonProductDB.upsert_category(product.category[i]).then(item => {
                    amazonProductDB.pc_mapping.build({product_asin: product.asin, category_id: item.id}).save()
                    .catch(err => {
                        console.log(err.message)
                    });
                })
                .catch(err => {
                    console.log(err.message)
                });
            });
        }
    })
    .catch(err =>{
        if(err.message == "value too long for type character varying(255)"){
            return;
        }
        if(err.message == "Validation error"){
            statistic.duplicated_product++;
            return;
        }
        console.log('------------------------------------------')
        console.log(err.message);
        console.log(err);
        console.log(product);
    });
}

lineReader.setLineHanlder((line, end)=>{
    setTimeout(()=>{
        end();
    },150);
    let data = JSON.parse(line);
    let product = extract_fields(
        data, 
        ["title", "image", "brand", "asin", "main_cat"], 
        ["description", "price", "feature", "category"]);
    if(product == null || product.image.length == 0){
        return;
    }
    if(product.description != undefined){
        if(product.description.length != 0){
            product.description = product.description[0];
        }else{
            product.description = "";
        }
    }
    statistic.count++;
    store_product(product);
});

/*lineReader.setCloseHandler(()=>{
    console.log(count);
    console.log("=== status: job finished. bye bye. ===");
});*/

lineReader.run(50);
