/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'N/url'],
 /**
  * @param{currentRecord} currentRecord
  */
 function(currentRecord, url) {

function pageInit(context){
   
	log.audit('init test', 't')
    var arrTemp = window.location.href.split('?');
    var urlParams = new URLSearchParams(arrTemp[1]);
	//alert(window.location.href.indexOf('account'));
    console.log(window.location.href.indexOf('account'))
    if (window.location.href.indexOf('account') != -1){
        console.log(JSON.parse(decodeURIComponent(urlParams.get('account'))))
        console.log(JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('account')))))
        context.currentRecord.setValue({
            fieldId: 'custrecord_ats_account',
            value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('account')))),
            ignoreFieldChange: true
        });
    } 
    else
    {
        context.currentRecord.setValue({
            fieldId: 'custrecord_ats_account',
            value: '',
            ignoreFieldChange: true
        });
    }
    
}
     
function saveRecord(scriptContext){ 
        var objThisRecord = scriptContext.currentRecord; 
        var objParametersToProcess = {};
  		var arrTemp = window.location.href.split('?');
        var urlParams = new URLSearchParams(arrTemp[1]);
        if (window.location.href.indexOf('subsidiary') != -1){
            objParametersToProcess['subsidiary'] = urlParams.get('subsidiary');
         }
         if (window.location.href.indexOf('startdate') != -1){
            objParametersToProcess['startdate'] = urlParams.get('startdate')
        }

        if (window.location.href.indexOf('enddate') != -1){
            objParametersToProcess['enddate'] = urlParams.get('enddate');
        }

        if (window.location.href.indexOf('location') != -1){
            objParametersToProcess['location'] = urlParams.get('location');
        }

        if (window.location.href.indexOf('storeType') != -1){
            objParametersToProcess['storeType'] =  urlParams.get('storeType');
        }
    
        if (window.location.href.indexOf('consolidateExchange') != -1){
            objParametersToProcess['consolidateExchange'] = urlParams.get('consolidateExchange');
        }  
  		

        //Account Values
        objParametersToProcess['account'] = encodeURIComponent(JSON.stringify(objThisRecord.getValue({
            fieldId: 'custrecord_ats_account'
        })));
   // alert(JSON.stringify(objParametersToProcess));
    var testURL = url.resolveScript({
            scriptId: 259,
            deploymentId: 1,
            params: objParametersToProcess
    });
    window.opener.location.href = testURL;
    window.close();
}
     return {
         saveRecord: saveRecord,
        pageInit : pageInit
     };
     
 });
 