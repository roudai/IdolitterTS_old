function nameGroupMatch(name, group) {
    name = String(name);
    group = String(group);

    if(name.match(group)){
        return true;
    }else if(name.match(group.replace(" ","").replace("　",""))){
        return true;
    }else if(name.replace(" ","").replace("　","").match(group)){
        return true;
    }
    return false;
    }
  
function getNum_100(i, lastRow){
    if(lastRow - i - 1 >= 100 || lastRow % 100 == 1){
        return 100;
    }else if(lastRow % 100 == 0){
        return 99;
    }else{
        return lastRow % 100 - 1;
    }
}

function getNum_10(i, j, lastRow){
    if(lastRow - i - j >= 10 || lastRow % 10 == 1){
        return 10;
    }else if(lastRow % 10 == 0){
        return 9;
    }else{
        return lastRow % 10 - 1;
    }
}

function idFix(dataSheet: any, lastRow: number){
    let id: any[] = new Array();
    for (var i = 1; i <= lastRow - 1; i = i + 1) {
        id.push([dataSheet.getRange(i + 1, 6).getValue().trim()]);
    }
    dataSheet.getRange(2, 6, lastRow - 1).setValues(id);
}