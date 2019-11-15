function has_null(...values){
    for (let i=0; i < values.length; i++){
        if(values[i] === null){
            return true;
        }
    }
    return false;
}
function get_value(from, key){
    if(from[key] === null || from[key] === undefined){
        return null;
    }
    return from[key];
}

function extract_fields(data, mandatory_fields, optional_fields){
    let result = {};
    for(let i = 0; i < mandatory_fields.length; i++){
        let temp = get_value(data, mandatory_fields[i]);
        if(temp == null){
            return null;
        }
        result[mandatory_fields[i]] = temp;
    }
    for(let i = 0; i < optional_fields.length; i++){
        let temp = get_value(data, optional_fields[i]);
        if(temp == null){
            continue;
        }
        result[optional_fields[i]] = temp;
    }
    return result;
}

module.exports = {
    extract_fields: extract_fields
}