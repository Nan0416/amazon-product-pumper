const LineByLineReader = require('line-by-line');
const fs = require('fs');
const AmazonProductDB = require('./amazon_db').AmazonProductDB;
const server = require('./config').server_addr;
const amazonProductDB = new AmazonProductDB(`postgres://nan:12345@${server}:5432/cs6400_project`);
const hash_password = "$2b$10$.KQSliWjRWtU41QKh2L9iebW0EyQVcTfTZ/UYqe8b.ktk7gVyDdea";  // password "12345"
const review_pumper_record_file = '.review_pumper_count.txt';


const statistic = {
    status: 0,
    count:0,
    good_review: 0,
    bad_review:0, // missing field.
    bad_asin: 0, // missing corresponding product.
    dupl:0 // duplicated (asin, userid)
}
setInterval(() => {
    console.log(`=== total: ${statistic.count}, good: ${statistic.good_review}, bad: ${statistic.bad_review}, dupl: ${statistic.dupl}, bad asin: ${statistic.bad_asin} @ ${new Date().toString()} ${statistic.status == 0? "waiting": "running"} ===`);
}, 2000);

process.on('SIGINT', () => {
    console.log("Saving Record");
    fs.writeFile(review_pumper_record_file, statistic.count, (err)=>{
        process.exit(0);
    })
});


function extract_data(review){
    if(!review.verified || review.asin == null || 
        review.overall == null || review.reviewerName == null || 
        review.summary == null){
        return null;
    }
    let data = {
        reviewer_id: review.reviewerID,
        product_asin:review.asin,
        rating:review.overall,
        username: review.reviewerName,
        summary:review.summary
    };
    if(review.reviewText != null){
        data.text = review.reviewText;
    }
    return data;
}

function upsert_user(user){
    // first check if the user existed,
    return amazonProductDB.user2.findOne({
        attributes:['id', 'username'],
        where:{id: user.id}
    })
    .then(data =>{
        if(data == null){
            return amazonProductDB.user2.build({
                id: user.id, 
                username: user.username, 
                hash_password: hash_password})
            .save()
            .then(item =>{
                return new Promise((resolve, reject)=>{
                    resolve(item.dataValues);
                });
            })
        }else{
            return new Promise((resolve, reject)=>{
                resolve(data.dataValues);
            });
        }
    });
}

function start_at_line(lr, start_line){
    lr.on("line",(line)=>{
        lr.pause();
        statistic.count++;
        if(start_line > statistic.count){
            statistic.status = 0;
            lr.resume();
            return;
        }
        statistic.status = 1;
        let review = extract_data(JSON.parse(line));
        if(review == null){
            statistic.bad_review++;
            lr.resume();
        }else{
    
            upsert_user({
                id: review.reviewer_id,
                username:review.username
            })
            .then(d => {
                return amazonProductDB.review2.build(review).save()
            })
            .then(d =>{
                statistic.good_review++;
                lr.resume();
            })
            .catch(err=>{
                if(err.message == 'insert or update on table "review2" violates foreign key constraint "review2_product_asin_fkey"'){
                    statistic.bad_asin++;
                }else if(err.message == "Validation error"){
                    statistic.dupl++;
                }else{
                    console.log(err.message);
                }
                lr.resume();
            });
        }
    });
}


fs.readFile(review_pumper_record_file, (err, data) => {
    let start_line = 0;
    if(err == null){
        start_line = parseInt(data);
    }
    console.log(`start pumping at ${start_line} lines.`);
    start_at_line(new LineByLineReader("../raw_data/Electronics.json"), start_line);
});



