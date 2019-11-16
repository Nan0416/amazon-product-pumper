const LineByLineReader = require('line-by-line')
const lr = new LineByLineReader("../raw_data/Electronics.json");
const AmazonProductDB = require('./table_definition').AmazonProductDB;
const db_server = "localhost";
const amazonProductDB = new AmazonProductDB(`postgres://nan:12345@${db_server}:5432/cs6400_project`);
const hash_password = "$2b$10$.KQSliWjRWtU41QKh2L9iebW0EyQVcTfTZ/UYqe8b.ktk7gVyDdea";  // password "12345"

const statistic = {
    count:0,
    good_review: 0,
    bad_review:0, // missing field.
    bad_asin: 0, // missing corresponding product.
    dupl:0 // duplicated (asin, userid)
}
setInterval(() => {
    console.log(`=== total: ${statistic.count}, good: ${statistic.good_review}, bad: ${statistic.bad_review}, dupl: ${statistic.dupl}, bad asin: ${statistic.bad_asin} @ ${new Date().toString()}`);
}, 1000);

function extract_data(review){
    if(!review.verified || review.asin == null || 
        review.overall == null || review.reviewerName == null || 
        review.summary == null){
        return null;
    }
    let data = {
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

function upsert_user(username){
    // first check if the user existed,
    return amazonProductDB.user.findAll({
        attributes:['id', 'username'],
        where:{username: username}
    })
    .then(data =>{
        if(data.length == 0){
            return amazonProductDB.user.build({username: username, hash_password: hash_password}).save()
            .then(item =>{
                return new Promise((resolve, reject)=>{
                    resolve(item.dataValues);
                });
            })
            .catch(err => {
                return new Promise((resolve, reject) =>{
                    reject(err);
                });
            });
        }else{
            return new Promise((resolve, reject)=>{
                resolve(data[0].dataValues);
            });
        }
    });
}
lr.on("line",(line)=>{
    lr.pause();
    statistic.count++;
    let review = extract_data(JSON.parse(line));
    if(review == null){
        statistic.bad_review++;
        lr.resume();
    }else{
        upsert_user(review.username)
        .then(user => {
            review.user_id = user.id;
            return amazonProductDB.review.build(review).save()
        })
        .then(_ =>{
            statistic.good_review++;
            lr.resume();
        })
        .catch(err=>{
            if(err.message == 'insert or update on table "review" violates foreign key constraint "review_product_asin_fkey"'){
                statistic.bad_asin++;
            }else if(err.message == "Validation error"){
                statistic.dupl++;
            }
            lr.resume();
        });
    }
});
