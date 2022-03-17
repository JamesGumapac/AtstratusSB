/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(
    ['N/record', 'N/runtime', 'N/search', 'N/render', 'N/file'],

    function (record, runtime, search, render, file ) {
        function getInputData() {
            var searchId = runtime.getCurrentScript().getParameter("custscript_ats_mrcogs_ss");

            var paramsToProcess = JSON.parse(runtime.getCurrentScript().getParameter("custscript_ats_cogs_config_report"));
            log.audit('paramsToProcess', paramsToProcess)
            //var consoExchValue = paramsToProcess.consolidateSubProp;
            //delete paramsToProcess.consolidateSubProp;

            var searchObj = search.load({
                id: searchId
            });

            // Pushes Parameter values - LOOP - For Each
            Object.keys(paramsToProcess).forEach(function (searchFilterName) {



                //If Else - For Operator assignment of Filters - For Date

                if (searchFilterName == 'trandate') {
                    searchObj.filters.push(search.createFilter({
                        name: searchFilterName,
                        operator: 'within',
                        values: paramsToProcess[searchFilterName]
                    }));
                } else {
                    searchObj.filters.push(search.createFilter({
                        name: searchFilterName,
                        operator: 'anyof',
                        values: paramsToProcess[searchFilterName]
                    }));

                }
            });

            if (isDefinedNotNullNotEmpty(searchId)) {
                return searchObj;
                //return
            }
            return null;
        }

        function map(context) {
                //log.audit('map context', JSON.stringify(context));
                var mapResults = context.value;
                var objHolder =  JSON.parse(context.value);

                mapResults = objHolder.values;
                var acctId = mapResults["GROUP(accountmain)"].value;
                var results = {};

                var accountmain = mapResults["GROUP(accountmain)"].text;
                var subsidiary = mapResults["GROUP(subsidiarynohierarchy)"];
                var property = mapResults["GROUP(location)"].text;
                var internalid = mapResults["GROUP(internalid)"].value;
                var vehicle = mapResults["GROUP(custbody_ats_vehicle_num)"];
                var trandate = mapResults["GROUP(trandate)"];
                var tranid = mapResults["GROUP(tranid)"];

                var item = mapResults["GROUP(item)"].text;

                var itemclass = mapResults["GROUP(class)"].text;

                var itemqty = mapResults["GROUP(quantityuom)"];

                var formulacol = mapResults["SUM(formulanumeric)"];

                var amount = mapResults["SUM(amount)"]


                results = {
                    "accountmain": accountmain,
                    "subsidiary": subsidiary,
                    "property": property,
                    "vehicle": vehicle,
                    "trandate": trandate,
                    "tranid": tranid,
                    "item": item,
                    "itemclass": itemclass,
                    "itemqty": itemqty,
                    "formulacol": formulacol,
                    "amount": parseFloat(amount)
                };

                //log.audit('CKEY' + context.key, results)
                context.write({
                    key:  acctId,
                    value: results
                });
        }

        function reduce(context) {


            // log.audit('reduce context', JSON.stringify(context));
            var mapResults = context.values;
         //   log.audit('mapResults1', JSON.stringify(mapResults));
            var objHolder =  JSON.parse(context.values[0]);
            //mapResults = objHolder.values;
           // log.audit('mapResults2', JSON.stringify(mapResults));
            var results = {};


            log.audit('reduce CKEY' + context.key, mapResults)
            context.write({
                key: 'ACCTID'+ context.key,
                value: mapResults
            });
        }

            function summarize(context) {

            log.debug('context whole summarixze', JSON.stringify(context));
            var lineResults = new Array();
            var resultsPerAcct = {};

            var accountsTotalResults = new Array();
            var propertiesTotalResults = new Array();
            var mainCSVtoRender = '';
                // Get each Key Val Pair
            context.output.iterator().each(function(key, value) {

                // if (carBrands.indexOf(car1)){
                //
                // }
                log.debug('whole key value :' +key, JSON.stringify(JSON.parse(value)));

                lineResults.push(JSON.parse(value));


                return true;
            });







                mainCSVtoRender = 'COGS / EXPENSE ACCOUNT, Subsidiary ,Property Name, Vehicle Number, Transaction Date, Transaction Reference, Item, Item Class, Quantity, Sum of Item Cost, Sum of Amount\r\n' + mainCSVtoRender;
                var csvContent =   mainCSVtoRender;
                //"data:text/csv;charset=utf-8," +
                //log.audit('mainCSVtoRender',csvContent)


                var fileXLSXML = file.create({
                    name: 'ATS TEST GENFILE' + '.csv',
                    fileType: file.Type.CSV,
                    contents: csvContent
                })
                fileXLSXML.folder = 40904;
                var fileId = fileXLSXML.save();

                log.audit('fILE ID LOCATION ',fileId)
                // var mapKeys =[];
            //     context.mapSummary.keys.iterator().each(function (key){
            //         mapKeys.push(key);
            //
            //     });
            //
            //     log.debug({
            //         title: 'Map stage keys',
            //         details: mapKeys
            //     });
            log.debug('Concurrency', context.concurrency);
            log.debug('Yields', context.yields);
            log.debug('Usage', context.usage);
        }

        function isDefinedNotNullNotEmpty(obj) {
            return typeof obj != 'undefined' && obj != null && obj != ''
                && obj.length > 0;
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Stage: ' + stage + ' failed', e);

            var subject = 'Script: ' + runtime.getCurrentScript().id;
            var body = 'An error occurred with the following information:\n'
                + 'Error code: '
                + e.name
                + '\n'
                + 'Error msg: '
                + e.message;
            log.error('subject: ' + subject, body);
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
            getInputData: getInputData,
             map : map,
             reduce: reduce,
            summarize: summarize
        };

    });
