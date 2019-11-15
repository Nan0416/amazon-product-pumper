'use strict'
const sequelize = require('sequelize'); // depends on pg.

class AmazonProductDB{
    /**
     *  product: product,
     *  category: category,
     *  pc_mapping: pc_mapping,
     *  image: image,
     *  user: user,
     *  review: review,
     */
    
    constructor(connection_string){
        this.db = new sequelize(connection_string,{
            logging: false,
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            }
        });
        this.init();
    }

    sync(callback){
        this.db.sync({force: true}).then(()=>{
            callback(null, true);
        }).catch(err =>{
            callback(err);
        });
    }


    upsert_category(category){ // return promise.
        return this.category.findAll({
            attributes:["id", "name"],
            where:{name: category}
        })
        .then(data =>{
            if(data.length == 0){
                return this.category.build({name: category}).save()
                .then(item =>{
                    return new Promise((resolve, reject)=>{
                        resolve(item.dataValues);
                    });
                })
            }else{
                return new Promise((resolve, reject)=>{
                    resolve(data[0].dataValues);
                });
            }
        });
    }
    
    init(){ // table defintion.
        this.product = this.db.define('product', {
            asin: {
                type: sequelize.CHAR(10),
                field: "asin",
                primaryKey: true,
            },
            title: {
                type: sequelize.STRING,
                field: "title",
                allowNull: false,
            },
            brand:{
                type: sequelize.STRING(127),
                field: "brand",
                allowNull: false,
            },
            main_cat:{
                type: sequelize.STRING(127),
                field: "main_cat",
                allowNull: false,
            },
            description:{
                type: sequelize.TEXT,
                field: "description",
                allowNull: true,
            }
        },{
            underscored: true,
        });
    
        this.category = this.db.define('category_lookup', {
            name:{
                type: sequelize.STRING(127),
                field: "name",
                allowNull: false,
                unique: true,
            }
        }, {
            //https://sequelize.org/master/manual/models-definition.html#configuration
            timestamps: false,
            freezeTableName: true,
            underscored: true,
        });
    
        this.pc_mapping = this.db.define('product_category_mapping', {
            product_asin:{
                type: sequelize.CHAR(10),
                field: "product_asin",
                allowNull: false,
                unique: 'product_category_index',
                references: {
                    model: this.product,
                    key: 'asin',
                    // This declares when to check the foreign key constraint. PostgreSQL only.
                    deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
                }
            },
            category_id:{
                type: sequelize.INTEGER,
                field: "category_id",
                allowNull: false,
                unique: 'product_category_index',
                references: {
                    model: this.category,
                    key: 'id',
                    // This declares when to check the foreign key constraint. PostgreSQL only.
                    deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
                }
            }
        },{
            timestamps: false,
            freezeTableName: true,
            underscored: true,
        });
    
        this.image = this.db.define('image', {
            url:{
                type: sequelize.STRING(2083),
                field:"image_url",
                allowNull: false,
                unique: 'product_image_url_index'
            },
            asin:{
                type: sequelize.CHAR(10),
                field: "product_asin",
                allowNull: false,
                unique: 'product_image_url_index',
                references: {
                    model: this.product,
                    key: 'asin',
                    // This declares when to check the foreign key constraint. PostgreSQL only.
                    deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
                }
            }
        },{
            timestamps: false,
            underscored: true,
        });
    
        this.user = this.db.define('user', {
            username:{
                type: sequelize.STRING(127),
                field:"username",
                allowNull: false,
                unique: true,
            },
            hash_password:{
                type: sequelize.CHAR(60), // using bcrypt to hash password, return a fixed 60 length hash value.
                field:"hash_password",
                allowNull: false
            }
        },{
            underscored: true,
        });
    
        this.review = this.db.define('review', {
            rating:{
                type: sequelize.DOUBLE,
                field: 'rating',
                allowNull: false,
            },
            product_asin:{
                type: sequelize.CHAR(10),
                field: "product_asin",
                allowNull: false,
                unique: 'product_user_review_index',
                references: {
                    model: this.product,
                    key: 'asin',
                    // This declares when to check the foreign key constraint. PostgreSQL only.
                    deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
                }
            },
            user_id:{
                type: sequelize.INTEGER,
                field:"user_id",
                allowNull: false,
                unique: 'product_user_review_index',
                references: {
                    model: this.user,
                    key: 'id',
                    // This declares when to check the foreign key constraint. PostgreSQL only.
                    deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
                }
            }
        },{
            timestamps: false,
            freezeTableName: true,
            underscored: true,
        });
    }
}


module.exports.AmazonProductDB = AmazonProductDB;