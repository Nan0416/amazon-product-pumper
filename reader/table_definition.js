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

    sync(table_names){
        let tables = [];
        let map = new Map();

        map.set('product', this.product);
        map.set('category', this.category);
        map.set('pc_mapping', this.pc_mapping);
        map.set('image', this.image);
        map.set('user', this.user);
        map.set('review', this.review);

        if(table_names == null){
            console.log("overwrite database.")
            return this.db.sync({force: true});
        }
        for(let i = 0; i < table_names.length; i++){
            if(map.has(table_names[i])){
                console.log(`overwrite ${table_names[i]}`);
                tables.push(map.get(table_names[i]));
            }
        }

        let pro = new Promise((resolve, reject)=>{
            resolve();
        });
        let temp = pro;
        for(let i = 0; i < tables.length; i++){
            temp = temp.then(()=>{
                return tables[i].sync({force: true});
            });
        }
        return pro;
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
            summary:{
                type: sequelize.TEXT,
                field: 'summary',
                allowNull: false,
            },
            text:{
                type: sequelize.TEXT,
                field: 'text',
                allowNull: true,
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