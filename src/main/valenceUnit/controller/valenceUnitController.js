'use strict';

function* validateValenceSyntax (next){
    var rawQuery = this.valQuery;
    var formattedQuery = ValenceUnitUtils.toTokenArray(rawQuery);
    if(isValidQuery(formattedQuery)){
        this.valQuery = formattedQuery;
        //TODO 
        yield next;
    }else{
        
    }
}

function isValidQuery(query){
    return true; // TODO: code method
}

module.exports = validateValenceSyntax;