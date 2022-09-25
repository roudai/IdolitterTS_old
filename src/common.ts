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
    id = this.dataSheet.getRange(2, 6, lastRow - 1, 1).getValues();
    for (let i = 0; i < id.length; i++) {
      id[i][0] = id[i][0].replace(/[\s\t\n,\.~!@#\$%\^&\*\(\)\+\-=\{\}\[\]:;"'<>?\\\/\|]/g, "");
    }
    dataSheet.getRange(2, 6, lastRow - 1).setValues(id);
}

function idBackup(dataSheet: any, lastRow: number) {
    // 削除アカウントを一旦ダミーアカウントに置き換え
    const twitterStatus = dataSheet.getRange(2,14,lastRow,1).getValues()
    for(let i = 0; i < lastRow ; i = i + 1){
        if(twitterStatus[i] != ""){
            let id = dataSheet.getRange(i + 2, 6).getValue();
            dataSheet.getRange(i + 2,15).setValue(id);
            dataSheet.getRange(i + 2,6).setValue("idol_itter");
        }
    }
}

function idUndo(dataSheet: any, lastRow: number) {
    // 置き換えたダミーアカウントを戻す
    const dummyID = dataSheet.getRange(2,15,lastRow,1).getValues()
    for(let i = 0; i < lastRow ; i = i + 1){
        if(dummyID[i] != ""){
            let id = dataSheet.getRange(i + 2, 15).getValue();
            dataSheet.getRange(i + 2,6).setValue(id);
            dataSheet.getRange(i + 2,15).setValue(null);
        }
    }
}