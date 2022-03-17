/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
 define(['N/url', 'N/currentRecord', 'N/format', 'N/search','N/record', 'N/https'],
 function (url, currentRecord, format ,search, record, https) {

     const scriptId = 259;
     const deploymentId = 1;
     const SEARCH_ID = 'customsearch_ats_consumption_cogs_3';
     const SEARCHFORSUBPROP = 'customsearch_ats_cogsreport_subproperty';
     const mapReduceId = 'customscript_ats_mr_generate_cogs_report';
     const mapReduceDeployment = 'customdeploy_ats_mr_generate_cogs_report'

     function fieldChanged(context) {
         console.log('outside ');

         var strFieldIdChanged = context.fieldId;
         var objThisRecord = context.currentRecord;

         // Subsidiary Field
         if (strFieldIdChanged == 'custpage_subsidiary_filter') {

             resolveScriptWithParameters(objThisRecord, 'SUBSIDIARYCHANGED');

         }

         if (strFieldIdChanged == 'custpage_location_filter') {
             resolveScriptWithParameters(objThisRecord, 'PROPERTYCHANGED');
         }

         if (strFieldIdChanged == 'custpage_account_filter') {
             resolveScriptWithParameters(objThisRecord, 'ACCOUNTCHANGED');
         }


         if (context.fieldId == 'custpage_pageid') {
             var pageId = context.getValue({
                 fieldId: 'custpage_pageid'
             });

             pageId = parseInt(pageId.split('_')[1]);

             document.location = url.resolveScript({
                 scriptId: getParameterFromURL('script'),
                 deploymentId: getParameterFromURL('deploy'),
                 params: {
                     'page': pageId
                 }
             });
         }
     }


     function pageInit(context) {
         //sets Consolidate to True by Default
         context.currentRecord.setValue({
             fieldId: 'custpage_consolidatewithsubprop_filter',
             value: true,
             ignoreFieldChange: true
         });

         var arrTemp = window.location.href.split('?');
         var urlParams = new URLSearchParams(arrTemp[1]);
         if (window.location.href.indexOf('subsidiary') != -1) {

             var property = context.currentRecord.getField({
                 fieldId: 'custpage_location_filter'
             })
             property.isDisabled = false
             //alert(arrTemp[arrTemp.length-1]);
             context.currentRecord.setValue({
                 fieldId: 'custpage_subsidiary_filter',
                 value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('subsidiary')))),
                 ignoreFieldChange: true
             });
         }else{
             var property = context.currentRecord.getField({
                 fieldId: 'custpage_location_filter'
             })
             property.isDisabled = true
         }
         if (window.location.href.indexOf('startdate') != -1) {
             context.currentRecord.setValue({
                 fieldId: 'custpage_startdate_filter',
                 value: new Date(JSON.parse(decodeURIComponent(urlParams.get('startdate')))),
                 ignoreFieldChange: true
             });
         }

         if (window.location.href.indexOf('enddate') != -1) {

             context.currentRecord.setValue({
                 fieldId: 'custpage_enddate_filter',
                 value: new Date(JSON.parse(decodeURIComponent(urlParams.get('enddate')))),
                 ignoreFieldChange: true
             });
         }

         if (window.location.href.indexOf('location') != -1) {

             context.currentRecord.setValue({
                 fieldId: 'custpage_location_filter',
                 value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('location')))),
                 ignoreFieldChange: true
             });
         }

         if (window.location.href.indexOf('storeType') != -1) {
             context.currentRecord.setValue({
                 fieldId: 'custpage_storetype_filter',
                 value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('storeType')))),
                 ignoreFieldChange: true
             });
         }

         if (window.location.href.indexOf('account') != -1) {
             context.currentRecord.setValue({
                 fieldId: 'custpage_account_filter',
                 value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('account')))),
                 ignoreFieldChange: true
             });
         }

         if (window.location.href.indexOf('consolidateSubProp') != -1) {
             context.currentRecord.setValue({
                 fieldId: 'custpage_consolidatewithsubprop_filter',
                 value: JSON.parse(decodeURIComponent(decodeURIComponent(urlParams.get('consolidateSubProp')))),
                 ignoreFieldChange: true
             });
         }
         // const queryString = window.location.search;
         // console.log(queryString);
         // const urlParams = new URLSearchParams(queryString);
         // const product = urlParams.get('product')

         // try{

         //     if (context.parameters.subsidiary) {

         //         var subRawHolder =  JSON.parse(context.parameters.subsidiary);
         //         var subHolder =  JSON.parse(subRawHolder);
         //         console.log('yes');
         //         var objThisRecord = context.currentRecord;

         //         objThisRecord.setValue({
         //                 fieldId: 'custpage_subsidiary_filter',
         //                 value: subHolder
         //         });
         //     }
         // }
         // catch(e){}
     }

     function clearFilter() {
         resolveScriptWithParameters('', 'CLEARFILTER')
         // document.location = url.resolveScript({
         //      scriptId: getParameterFromURL('script'),
         //      deploymentId: getParameterFromURL('deploy')
         //    });
     }

     function redirectToAccountPage() {
         var objThisRecord = currentRecord.get();

         resolveScriptWithParameters(objThisRecord, 'ACCOUNTPAGE');

     }

     function getParameterFromURL(param) {
         var query = window.location.search.substring(1);
         var vars = query.split("&");
         for (var i = 0; i < vars.length; i++) {
             var pair = vars[i].split("=");
             if (pair[0] == param) {
                 return decodeURIComponent(pair[1]);
             }
         }
         return (false);
     }

     // Multiple Purpose Function with different Calls
     function resolveScriptWithParameters(currRec, checkAction, csvContent) {

         // Start of Field Processing
         var objParametersToProcess = {};

         if (currRec) {
             var fromDate = currRec.getText({
                 fieldId: 'custpage_startdate_filter'
             });
             var toDate = currRec.getText({
                 fieldId: 'custpage_enddate_filter'
             });
             var subsidiary = currRec.getValue({
                 fieldId: 'custpage_subsidiary_filter'
             });
             var location = currRec.getValue({
                 fieldId: 'custpage_location_filter'
             });
             var storeType = currRec.getValue({
                 fieldId: 'custpage_storetype_filter'
             });
             console.log('Getting Store Type value' + storeType)
             var account = currRec.getValue({
                 fieldId: 'custpage_account_filter'
             });
             var consolidateSubProp = currRec.getValue({
                 fieldId: 'custpage_consolidatewithsubprop_filter'
             });

             //Generate CSV - call for generateReportToCSV - Checks values to pass for Search
             if (checkAction == 'GETVALUES') {
                 (fromDate && fromDate != '' && toDate && toDate != '' )? (objParametersToProcess['trandate'] = [fromDate,toDate]) : false;
                 subsidiary && subsidiary != '' ? (objParametersToProcess['subsidiary'] = subsidiary) : false;
                 location && location != '' ? (objParametersToProcess['location'] = location) : false;
                 (account && account != '') ? (objParametersToProcess['accountmain'] = account) : false;
                 storeType && storeType != '' ? (objParametersToProcess['custbody_ats_store_type'] = storeType) : false;
                 consolidateSubProp && consolidateSubProp != '' ? (objParametersToProcess['consolidateSubProp'] = consolidateSubProp) : false;

                 return objParametersToProcess;
             }
             //Ternary Value Checkers
             (fromDate && fromDate != '') ? (objParametersToProcess['startdate'] = encodeURIComponent(JSON.stringify(fromDate))) : false;
             toDate && toDate != '' ? (objParametersToProcess['enddate'] = encodeURIComponent(JSON.stringify(toDate))) : false;
             subsidiary && subsidiary != '' ? (objParametersToProcess['subsidiary'] = encodeURIComponent(JSON.stringify(subsidiary))) : false;
             location && location != '' ? (objParametersToProcess['location'] = encodeURIComponent(JSON.stringify(location))) : false;
             (storeType && storeType != '') ? (objParametersToProcess['storeType'] = encodeURIComponent(JSON.stringify(storeType))) : false;
             (account && account != '') ? (objParametersToProcess['account'] = encodeURIComponent(JSON.stringify(account))) : false;
             consolidateSubProp && consolidateSubProp != '' ? (objParametersToProcess['consolidateSubProp'] = encodeURIComponent(JSON.stringify(consolidateSubProp))) : false;

             if (checkAction == 'SUBSIDIARYCHANGED') {
                 delete objParametersToProcess.location;
                 delete objParametersToProcess.storeType;
                 delete objParametersToProcess.consolidateSubProp;
                 delete objParametersToProcess.account;
             }
         }


         if (checkAction == 'CLEARFILTER') {
             objParametersToProcess = {};
         }
         if (checkAction == 'ACCOUNTPAGE') {
             var output = url.resolveRecord({
                 recordType: 'customrecord_ats_account_page',
                 recordId: 1,
                 isEditMode: true,
                 params: objParametersToProcess
             });
             window.open(output, 'Account Selection', 'width=900,height=1200');
             return;
         }

         // Final Part of Generate CSV - Calls Restlet and send Email
         if (checkAction == 'SENDEMAIL') {
             //requestREstlet
             objParametersToProcess['sendEmail'] = 'T';
             var suitletURL = url.resolveScript({
                 scriptId: scriptId,
                 deploymentId: deploymentId,
                 params: objParametersToProcess
             });
             var headersTest = { "Content-Type": "plain/text" };
             var response = https.post({
                 url : suitletURL,
                 headers : headersTest,
                 body : encodeURIComponent(csvContent)
             });
             //alert(JSON.stringify(response));
             return JSON.stringify(response);
         }

         if (checkAction == 'TRIGGERMRVIASLET') {
             //requestREstlet
             objParametersToProcess['getFieldsForProcessing'] = JSON.stringify(csvContent);
             //objParametersToProcess['triggerMR'] = 'T';

             var suitletURL = url.resolveScript({
                 scriptId: scriptId,
                 deploymentId: deploymentId,
                 params: objParametersToProcess
             });
             var headersTest = { "Content-Type": "plain/text" };
             var response = https.post({
                 url : suitletURL,
                 headers : headersTest,
                 body : ''
             });



             return JSON.stringify(response);
         }


         document.location = url.resolveScript({
             scriptId: scriptId,
             deploymentId: deploymentId,
             params: objParametersToProcess
         });

     }

     function generateReportToCSV(){
         var objThisRecord = currentRecord.get();
         var getFieldsForProcessing = resolveScriptWithParameters(objThisRecord,'GETVALUES');
         // Processes Property Selected and Consolidate Sub Prop
         console.log('consolidateSubProp: ' + JSON.stringify(getFieldsForProcessing['consolidateSubProp']))
         if (getFieldsForProcessing['location']){
             getFieldsForProcessing['location'] = callSubProperties(getFieldsForProcessing['location'] , getFieldsForProcessing['consolidateSubProp']);
         }
         console.log(getFieldsForProcessing['location'])
         var mainCogsSearchResult = runMainCogsSearch(SEARCH_ID, getFieldsForProcessing);
         var retrieveSearchCount = mainCogsSearchResult[1];

         //ends execution if no results
         if (retrieveSearchCount == 0){
             return alert('Total search result is 0, no report will be generated. ');
         } else if (retrieveSearchCount > 1){

             alert('Total search result is greater than 4000, report will be generated on the file cabinet. ')
            // Call Suitelet to generate task

             console.log('fieldsforProcessing :'+ JSON.stringify(getFieldsForProcessing));
             resolveScriptWithParameters('', 'TRIGGERMRVIASLET', getFieldsForProcessing)
             return null;
         }

         var retrieveSearchResults = mainCogsSearchResult[0].run();


         var results = new Array();
         var accountsTotalResults = new Array();
         var propertiesTotalResults = new Array();



         var mainCSVtoRender = '';
         retrieveSearchResults.each(function(resultHolder) {

             var accountmain = resultHolder.getText({
                 name: 'accountmain',
                 summary: 'GROUP'
             })

             var subsidiary = resultHolder.getValue({
                 name: 'subsidiarynohierarchy',
                 summary: 'GROUP'
             })

             var property = resultHolder.getText({
                 name: 'location',
                 summary: 'GROUP'
             })

             var internalid = resultHolder.getValue({
                 name: 'internalid',
                 summary: 'GROUP'
             })


             var vehicle = resultHolder.getValue({
                 name: 'custbody_ats_vehicle_num',
                 summary: 'GROUP'
             })



             var trandate = resultHolder.getValue({
                 name: 'trandate',
                 summary: 'GROUP'
             })


             var tranid = resultHolder.getValue({
                 name: 'tranid',
                 summary: 'GROUP'
             })

             var item = resultHolder.getText({
                 name: 'item',
                 summary: 'GROUP'
             })

             var itemclass = resultHolder.getText({
                 name: 'class',
                 summary: 'GROUP'
             })

             var itemqty = resultHolder.getValue({
                 name: 'quantityuom',
                 summary: 'GROUP'
             })

             var formulacol = resultHolder.getValue({
                 name: 'formulanumeric',
                 summary: 'SUM'
             })

             var amount = resultHolder.getValue({
                 name: 'amount',
                 summary: 'SUM'
             });


             results.push({
                 "accountmain": accountmain,
                 "subsidiary": subsidiary,
                 "property": property,
                 "vehicle" :vehicle,
                 "trandate": trandate,
                 "tranid": tranid,
                 "item": item,
                 "itemclass": itemclass,
                 "itemqty": itemqty,
                 "formulacol": formulacol,
                 "amount": parseFloat(amount)
             });

             return true;
         });
         // function to add same object keys amount
         function addSameProperty(results){
             var holder = {};
             results.forEach(function(res) {
                 if (holder.hasOwnProperty(res.property)) {
                     holder[res.property] = holder[res.property] + res.amount;
                 } else {
                     holder[res.property] = res.amount;
                 }
             });
             return holder
         }
         var propHolder = addSameProperty(results)
         console.log('Holder of Results' + JSON.stringify(propHolder))
         var objResults = [];
         //trim the property name to main Parent Property Only
         for (var prop in propHolder) {
             objResults.push({ property: prop, amount: propHolder[prop] });
         }
         // console.log('Objresults' +  JSON.stringify(objResults))
         // var objPropResults = []; //New results Holder
         // var finalPropRes = addSameProperty(objResults) //Trim down the results to parent property only and sum the subproperty amount
         // //push the results into an array for processing
         // for (var prop in finalPropRes) {
         //     objPropResults.push({ property: prop, amount: finalPropRes[prop] });
         // }
         // console.log('objPropResults' +  JSON.stringify(objPropResults))
         //   console.log('Final Res length' + objPropResults.length)

         //add Account total
         var accountHolder = {};

         results.forEach(function(res) {
             if (accountHolder.hasOwnProperty(res.accountmain)) {
                 accountHolder[res.accountmain] = accountHolder[res.accountmain] + res.amount;
             } else {
                 accountHolder[res.accountmain] = res.amount;
             }
         });
          console.log('accountHolder Holder' + JSON.stringify(accountHolder))

         //add the accountHolder total results in Object

         var accountTotal = [];
         //trim the property name to main Parent Property Only
         for (var prop in accountHolder) {
             accountTotal.push({ accountmain : prop, amount: accountHolder[prop] });
         }
         console.log('Account Total List', JSON.stringify(accountTotal))
         //add the total of the properties in the Results
         if(accountTotal.length > 0){
             for (var i = 0; i < accountTotal.length; i++) {
                 var total = 'Total for ' + accountTotal[i].accountmain + ' '
                 console.log(' TOTAL Amount for Account ' + accountTotal[i].accountmain)
                 accountsTotalResults.push({
                     "accountmain": ' ',
                     "subsidiary": ' ',
                     "property": ' ',
                     "vehicle" :' ',
                     "trandate": ' ',
                     "tranid":  ' ',
                     "item":  ' ',
                     "itemclass":  ' ',
                     "itemqty": ' ',
                     "formulacol":  total,
                     "amount": accountTotal[i].amount
                 });
             }

         }
         if(objResults.length > 0){
             for (var i = 0; i < objResults.length; i++) {
                 var total = 'Total for ' + objResults[i].property
                 console.log(objResults[i].amount)
                 propertiesTotalResults.push({
                     "accountmain": ' ',
                     "subsidiary": ' ',
                     "property": ' ',
                     "vehicle" :' ',
                     "trandate": ' ',
                     "tranid":  ' ',
                     "item":  '',
                     "itemclass":  ' ',
                     "itemqty": ' ',
                     "formulacol": total,
                     "amount": objResults[i].amount
                 });
             }
         }


         var intLineCount = results.length;
         var tempPropertyHolder = '';
         var tempAccountHolder = '';
         var accountCounter = 0;
         // Main LOOP for Display
         //console.log('JSON ARRAY HOLDER results' + JSON.stringify(results) )
        //  console.log(JSON.stringify(accountsTotalResults))
        //  console.log(JSON.stringify(propertiesTotalResults));
        //  console.log(propertiesTotalResults);
         for(var i = 0; i < intLineCount; i++) {

            if(i==0){
                tempAccountHolder = results[i]['accountmain'];
            } else{

                // For Account Total Change
                if (tempAccountHolder != results[i]['accountmain'] && (accountCounter != accountsTotalResults.length)){
                    tempAccountHolder = results[i]['accountmain'];
                    Object.keys(accountsTotalResults[accountCounter]).forEach((function (objKey) {
                        if (objKey == 'amount'){
                            mainCSVtoRender += formatNumber(accountsTotalResults[accountCounter][objKey]) + ',';
                        }
                        else{
                            mainCSVtoRender += '"' + accountsTotalResults[accountCounter][objKey] +'"'  + ','
                        }

                    }));
                    mainCSVtoRender +=  '\r\n';
                    mainCSVtoRender +=  '\r\n';
                    accountCounter++;
                }
            }

             Object.keys(results[i]).forEach((function (objKey) {
                 //check if its the last part of the Array
                 if (objKey == 'amount' || objKey == 'formulacol' ){
                     mainCSVtoRender += formatNumber(results[i][objKey]) + ',';
                   //  mainCSVtoRender += results[i][objKey];
                 }
                 else{
                     mainCSVtoRender += '"'+results[i][objKey]+'"'  + ','
                 }

             }));
             mainCSVtoRender +=  '\r\n';
             //for testing
         }

        // Inserts the last part of the CSV for total of Accounts
        mainCSVtoRender +=' , , , , , , , , , ' + accountsTotalResults[accountCounter]['formulacol'] +','+ formatNumber(accountsTotalResults[accountCounter]['amount']) + '\r\n';
        mainCSVtoRender +='\r\n';

        // Inserts the Properties as last part of the Code

        for (var i = 0; i < propertiesTotalResults.length; i++){
            Object.keys(propertiesTotalResults[i]).forEach((function (objKey) {
                if (objKey == 'amount'){
                    mainCSVtoRender += formatNumber(propertiesTotalResults[i][objKey]) + ',';
                }
                else{
                    mainCSVtoRender += '"'+propertiesTotalResults[i][objKey]+'"'  + ','
                }

            }));
            mainCSVtoRender +=  '\r\n';
        }
        // End Property



         mainCSVtoRender = 'COGS / EXPENSE ACCOUNT, Subsidiary ,Property Name, Vehicle Number, Transaction Date, Transaction Reference, Item, Item Class, Quantity, Sum of Item Cost, Sum of Amount\r\n' + mainCSVtoRender;
         var csvContent = "data:text/csv;charset=utf-8," + mainCSVtoRender;

         csvContent = encodeURI(csvContent);
         var link = document.createElement("a");
         link.setAttribute("href",csvContent);
         link.setAttribute("download", "COGS_IA_Report_" + ".csv");
         document.body.appendChild(link); // Required for FF
         link.click();
         console.log('before resolving on SENDEMAIL')
         var a = resolveScriptWithParameters(objThisRecord, "SENDEMAIL", mainCSVtoRender);
         console.log('after resolving on SENDEMAIL' + ' - ' + JSON.stringify(a) )
     }



     function runMainCogsSearch(searchId, paramsToProcess) {

         // Skips Consolidate Exchange Object
         var consoExchValue = paramsToProcess.consolidateSubProp;
         delete paramsToProcess.consolidateSubProp;

         var searchObj = search.load({
             id: searchId
         });

         // Pushes Parameter values - LOOP - For Each
         Object.keys(paramsToProcess).forEach(function (searchFilterName) {


             console.log(searchFilterName, JSON.stringify( searchObj[searchFilterName]));
             //If Else - For Operator assignment of Filters - For Date

             if (searchFilterName == 'trandate') {
                 searchObj.filters.push(search.createFilter({
                     name: searchFilterName,
                     operator: 'within',
                     values: paramsToProcess[searchFilterName]
                 }));
             }  else {
                 searchObj.filters.push(search.createFilter({
                     name: searchFilterName,
                     operator: 'anyof',
                     values: paramsToProcess[searchFilterName]
                 }));

             }
         });
         console.log(searchObj.filters);



         var checkCount = searchObj.runPaged().count;
         alert('test inside check count = ' + JSON.stringify(checkCount));


         return [searchObj, checkCount];
     }

     function callSubProperties(parentProperty, consolidateSubProp){

         var returnValue = parentProperty;
         // Gets Parent with Subproperty
         if (consolidateSubProp){
             // return Property results along with sub property
             var subPropertySearch = search.load({
                 id: SEARCHFORSUBPROP
             });

             (parentProperty && JSON.stringify(parentProperty) != '[]') ? (subPropertySearch.filters.push(search.createFilter({
                 name: "custrecord_ats_cogsreport_parentproperty",
                 operator: 'anyof',
                 values: parentProperty
             }))) : false;
             subPropertySearch.run().each(function (result) {

                 var subPropId = result.id;
                 //push to property filter

                 returnValue.push(subPropId);


                 return true;
             });

             console.log(consolidateSubProp + ' ' + returnValue)
         }
         // Returns Parent only
         else{
             console.log(consolidateSubProp + ' ' + returnValue)
         }

         return returnValue;
     }

     function formatNumber(num){

         var ReturnNum = Number(num).toString();
         var valSplit = ReturnNum.split('.')
         nReturnNum = valSplit[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ((valSplit[1])?('.' + valSplit[1]):'');

         if (ReturnNum.indexOf(',') >= 0) {
             ReturnNum = '"' + ReturnNum + '"';
         }


         return ReturnNum;
     }

     return {
         fieldChanged : fieldChanged,
         pageInit : pageInit,
         clearFilter : clearFilter,
         redirectToAccountPage : redirectToAccountPage,
         generateReportToCSV : generateReportToCSV,
         runMainCogsSearch : runMainCogsSearch

     };

 });