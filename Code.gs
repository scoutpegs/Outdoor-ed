const SPREADSHEET_ID = "PUT_YOUR_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Pins";

function out_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(){return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);}
function getRows_(){
  const sh=sheet_(), values=sh.getDataRange().getValues();
  if(values.length<2)return[];
  const h=values[0].map(String);
  return values.slice(1).filter(r=>r.some(v=>v!=="")).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o});
}
function doGet(e){
  try{
    const action=e.parameter.action||"listPins";
    if(action==="listPins")return out_({ok:true,pins:getRows_()});
    return out_({ok:false,error:"Unknown action"});
  }catch(err){return out_({ok:false,error:String(err)})}
}
function doPost(e){
  try{
    const body=JSON.parse(e.postData.contents||"{}"), sh=sheet_();
    if(body.action==="addPin"){
      sh.appendRow([body.id||Utilities.getUuid(),body.created_at||new Date().toISOString(),body.url||"",body.title||"",body.author||"Anonymous",body.author_id||"",body.category||"idea"]);
      return out_({ok:true});
    }
    if(body.action==="deletePin"){
      const values=sh.getDataRange().getValues(),h=values[0].map(String),idCol=h.indexOf("id"),authorCol=h.indexOf("author_id");
      for(let i=1;i<values.length;i++){
        if(String(values[i][idCol])===String(body.id)){
          if(String(values[i][authorCol])!==String(body.author_id))return out_({ok:false,error:"You can only delete pins you added."});
          sh.deleteRow(i+1);return out_({ok:true});
        }
      }
      return out_({ok:false,error:"Pin not found"});
    }
    return out_({ok:false,error:"Unknown action"});
  }catch(err){return out_({ok:false,error:String(err)})}
}