/**
 *    Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/search', 'N/runtime','N/format','N/query','N/record'],

    function (search, runtime,format,query, record) {

        function isValueValid(value)
        {
            var isNotNull = false;
            if( typeof(value) == 'boolean')
            {
                value = value.toString();
            }
            if (value != null && value !== '' && value != 'null' &&
                value != undefined && value != 'undefined')
            {
                isNotNull = true;
            }
            return isNotNull;
        }

        /**
         * Makes a saved search call and returns all result items in JSON array
         * @param searchObj Search object from which search needs to be performed
         * @param callback callback function if any to which search item needs to be given
         * @param callbackResultObj search Collector, only mutable object (like array and object)
         * @returns {*} Array of search result in JSON format
         */
        function getSearchResultInJSON(searchObj, callback, callbackResultObj) {
            //if callback and callbackResultObj are undefined, default behaviour is 1 result -> 1 object
            if (callback == undefined || callback == '') {
                callback = searchResultToJson;
            }
            if (callbackResultObj == undefined) {
                callbackResultObj = []; // initialize as array
            }

            var search_page_count = 1000;

            if(searchObj)
            {
                var myPagedData = searchObj.runPaged({
                    pageSize: search_page_count
                });

                myPagedData.pageRanges.forEach(function (pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        //get json of result
                        callback(result,callbackResultObj);
                    });
                });
            }
            return callbackResultObj;
        }

        /**
         * Converts Search result to JSON object
         * @param searchResult each search result object
         * @returns {Array} JSON equivalent of search object
         */
        function searchResultToJson(searchResult, searchResults) {
            var resultObj = {};

            var columnsArray = searchResult.columns;
            var columnKeys =[];
            for (var j in columnsArray) {
                var columnObj = JSON.parse(JSON.stringify(columnsArray[j]));
                var column = columnObj.name;
                var columnSummary = columnObj.summary;
                var columnLabel = columnObj.label;
                var columnJoin = columnObj.join;
                var columnType = columnObj.type;

                if (column == 'formulanumeric' || column == 'formuladate' || column == 'formulatext') {
                    var columnValue = searchResult.getValue(columnsArray[j]);
                    resultObj[columnLabel] = columnValue;
                }
                else {
                    var columnValue = searchResult.getValue({
                        name: column,
                        summary: columnSummary,
                        join: columnJoin
                    });
                    if(columnKeys.indexOf(column) != -1)
                    {
                        columnKeys.push(columnLabel);
                        resultObj[columnLabel] = columnValue;
                    }
                    else
                    {
                        columnKeys.push(column);
                        resultObj[column] = columnValue;
                    }
                    if (columnType == 'select' || column == 'unit'  || typeof columnObj == 'object') {
                        if(columnValue!= '')
                        {
                            var columnText = searchResult.getText({
                                name: column,
                                summary: columnSummary,
                                join: columnJoin
                            });
                            var colName = column + "Text";
                            resultObj[colName] = columnText;
                        }
                        else
                        {
                            var colName = column + "Text";
                            resultObj[colName] = '';
                        }
                    }
                }

                resultObj['id'] = searchResult.id;
                resultObj['recordType'] = searchResult.recordType;
            }

            searchResults.push(resultObj);
        }

        function getSubsidiaryLocationsNQuery(workcenterLocs)
        {
            var user = runtime.getCurrentUser();
            var userSubsId = user.subsidiary;
            var userRoleId = user.role;
            var userLocation=user.location;
            var roleSubsArray = [];
            var arrLocation = [];
            if(isValueValid(userRoleId))
            {
                roleSubsArray = getRoleSubsidiariesNQuery(userRoleId);
            }
            var locationFilters = [];
            var subsQuery = query.create({
                type: query.Type.LOCATION
            });
            if(roleSubsArray.length > 0) {
                locationFilters.push(subsQuery.createCondition({
                    fieldId: 'subsidiary.id',
                    operator: query.Operator.ANY_OF,
                    values : roleSubsArray
                }));
            }
            else if(isValueValid(userSubsId))
            {
                locationFilters.push(subsQuery.createCondition({
                    fieldId: 'subsidiary.id',
                    operator: query.Operator.ANY_OF,
                    values : userSubsId
                }));
            }

            if (userLocation != null && userLocation != '') {
                locationFilters.push(subsQuery.createCondition({
                    fieldId: 'id',
                    operator: query.Operator.EQUAL,
                    values: userLocation
                }));
            }
            else
            {
                locationFilters.push(subsQuery.createCondition({
                    fieldId: 'id',
                    operator: query.Operator.ANY_OF,
                    values: workcenterLocs
                }));
            }
            var locationQuery = getLocationList();
            locationFilters.push(locationQuery.condition);
            locationQuery.condition = locationQuery.and(locationFilters);
            var locations = runQueryInSuiteQL(locationQuery);
            for(var j = 0; j<locations.length; j++)
            {
                var objLocation = {};
                objLocation['id'] = locations[j]['id'];
                objLocation['name'] = locations[j]['name'];
                arrLocation.push(objLocation);
            }
            return arrLocation;
        }

        function getRoleSubsidiariesNQuery(roleId)
        {
            var arrRoleSubsId=[];
            var roleResults=[];
            var roleQueryConditions = [];
            var roleQuery = query.create({
                type: query.Type.ROLE
            });
            roleQueryConditions.push(roleQuery.createCondition({
                fieldId: 'isinactive',
                operator: query.Operator.IS,
                values: false
            }));
            roleQueryConditions.push(roleQuery.createCondition({
                fieldId: 'id',
                operator: query.Operator.EQUAL,
                values: roleId
            }));
            roleQuery.condition= roleQuery.and(roleQueryConditions);
            roleQuery.columns = [
                roleQuery.createColumn({
                    fieldId: 'name'
                }),
                roleQuery.createColumn({
                    fieldId: 'effectivesubsidiaries'
                })
            ];
            roleResults = runQueryInSuiteQL(roleQuery);
            for(var k=0;k<roleResults.length;k++) {
                var roleSubsId=roleResults[k]['effectivesubsidiaries'];
                if(roleSubsId != '')
                {
                    arrRoleSubsId.push(parseInt(roleSubsId));
                }
            }
            return arrRoleSubsId;
        }

        function getUserLocation(userLocation)
        {
            var arrLocation = [];
            var locationFilters = [];
            var userLocationQuery = query.create({
                type: query.Type.LOCATION
            });
            if(userLocation!=null && userLocation!='') {
                locationFilters.push(userLocationQuery.createCondition({
                    fieldId: 'id',
                    operator: query.Operator.EQUAL,
                    values: userLocation
                }));
            }
            var locationQuery = getLocationList();
            locationFilters.push(locationQuery.condition);
            locationQuery.condition = locationQuery.and(locationFilters);
            var locations = runQueryInSuiteQL(locationQuery);
            for(var j = 0; j<locations.length; j++) {
                var objLocation = {};
                objLocation['id'] = locations[j]['id'];
                objLocation['name'] = locations[j]['name'];
                arrLocation.push(objLocation);
            }
            return arrLocation;
        }

        function getAllLocations(workcenterLocs)
        {
            var arrLocation = [];
            var locationFilters = [];
            var allLocationsQuery = query.create({
                type: query.Type.LOCATION
            });
            if(workcenterLocs!=null && workcenterLocs!='') {
                locationFilters.push(allLocationsQuery.createCondition({
                    fieldId: 'id',
                    operator: query.Operator.ANY_OF,
                    values: workcenterLocs
                }));
            }
            var locationQuery = getLocationList();
            locationFilters.push(locationQuery.condition);
            locationQuery.condition = locationQuery.and(locationFilters);
            var locationList = runQueryInSuiteQL(locationQuery);
            if(locationList==null || locationList=='') return arrLocation;
            for (var i = 0; i <locationList.length; i++) {
                var objLocation = {};
                objLocation['id'] = locationList[i]['id'];
                objLocation['name'] = locationList[i]['name'];
                arrLocation.push(objLocation);
            }
            return arrLocation;
        }

        function getWorkCenterLocationsNQuery() {
            var workCenterLocationQuery = getWorkCenterLocationDetails();
            var workCenterResult = runQueryInSuiteQL(workCenterLocationQuery);
            var wcLocations = [];
            if (workCenterResult == null || workCenterResult == '') return wcLocations;
            for (var i = 0; i < workCenterResult.length; i++) {
                if (isValueValid(workCenterResult[i]['custentity_mfgmob_wclocation']))
                    wcLocations.push(parseInt(workCenterResult[i]['custentity_mfgmob_wclocation']));
            }
            return wcLocations;
        }

        function getCurrentUserLanguage()
        {
            var user = runtime.getCurrentUser();
            return user.getPreference({
                name :'LANGUAGE'
            });
        }

        function isSubsidiaryEnabled()
        {
            var isSubsEnabled = runtime.isFeatureInEffect({
                feature : 'subsidiaries'
            });

            return isSubsEnabled;
        }

        function getLocations()
        {
            var roleLocations = [];
            var user = runtime.getCurrentUser();
            var userLocation = (user.location==0)?'':user.location;
            var subs = isSubsidiaryEnabled();

            var wcLocations = getWorkCenterLocationsNQuery();

            log.audit('Work Center Locations', wcLocations);

            if (!isValueValid(wcLocations) || wcLocations.length==0) return roleLocations;

            if (isValueValid(userLocation) && wcLocations.indexOf(userLocation)==-1) return roleLocations;

            if(subs==true) {
                roleLocations = getSubsidiaryLocationsNQuery(wcLocations);
            }
            else {
                if (isValueValid(userLocation)) {
                    roleLocations = getUserLocation(userLocation);
                }
            }
            if(roleLocations.length==0) {
                // for non oneoworld account case when no location is configured, show all location
                roleLocations = getAllLocations(wcLocations);
            }

            log.audit('roleLocations', roleLocations);

            return roleLocations;
        }

        function isIndexFound(array, item) {
            for (var i = 0; i < array.length; i++) {

                if (array[i]['id'] == item) {
                    return true;
                }
            }
            return false;
        }

        function getWorkCenterId(name) {
            var wcId;
            var workCenterQueryConditions = [];
            var workCenterLocationQuery = query.create({
                type: query.Type.ENTITY_GROUP
            });
            workCenterQueryConditions.push(
                workCenterLocationQuery.createCondition({
                    fieldId: 'groupname',
                    operator: query.Operator.IS,
                    values: name
                })
            );
            workCenterLocationQuery.condition = workCenterLocationQuery.and(workCenterQueryConditions);
            workCenterLocationQuery.columns = [
                workCenterLocationQuery.createColumn({
                    fieldId: 'id'
                })
            ];
            var workCenterResult = runQueryInSuiteQL(workCenterLocationQuery);
            if(workCenterResult.length>0)
                wcId = workCenterResult[0].id;
            return wcId;
        }

        function getAllWorkCenters() {
            var workCenterQueryConditions = [];
            var workCenterLocationQuery = query.create({
                type: query.Type.ENTITY_GROUP
            });
            /*workCenterQueryConditions.push(
                    workCenterLocationQuery.createCondition({
                        fieldId: 'grouptypename',
                        operator: query.Operator.IS,
                        values: "Employee"
                    })
            );
            workCenterLocationQuery.condition = workCenterLocationQuery.and(workCenterQueryConditions);*/
            workCenterLocationQuery.columns = [
                workCenterLocationQuery.createColumn({
                    fieldId: 'id'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'groupname'
                })
            ];
            workCenterLocationQuery.sort = [
                workCenterLocationQuery.createSort({
                    column: workCenterLocationQuery.columns[0],
                    ascending: true
                })
            ];
            var workCenterResult = runQueryInSuiteQL(workCenterLocationQuery);
            return workCenterResult;
        }

        function getShiftList() {
            var shiftResults=[];
            var shiftQueryConditions = [];
            var shiftQuery = query.create({
                type: 'customrecord_mfgmob_shift'
            });
            shiftQueryConditions.push(
                shiftQuery.createCondition({
                    fieldId: 'isinactive',
                    operator: query.Operator.IS,
                    values: false
                })
            );
            shiftQuery.condition = shiftQuery.and(shiftQueryConditions);
            shiftQuery.columns = [
                shiftQuery.createColumn({
                    fieldId: 'id'
                }),
                shiftQuery.createColumn({
                    fieldId: 'name'
                }),
            ];
            shiftQuery.sort = [
                shiftQuery.createSort({
                    column: shiftQuery.columns[0],
                    ascending: true
                })
            ];
            shiftResults = runQueryInSuiteQL(shiftQuery);
            return shiftResults;
        }

        function getWorkCenters(dataObject)
        {
            var workCenterQueryConditions = [];
            var workCenterLocationQuery = query.create({
                type: query.Type.ENTITY_GROUP
            });
            /*workCenterQueryConditions.push(
                    workCenterLocationQuery.createCondition({
                        fieldId: 'grouptypename',
                        operator: query.Operator.IS,
                        values: "Employee"
                    })
            );*/
            workCenterQueryConditions.push(
                workCenterLocationQuery.createCondition({
                    fieldId: 'custentity_mfgmob_wclocation',
                    operator: query.Operator.EQUAL,
                    values: dataObject.locationId
                })
            );
            if(dataObject.enteredWorkCenter) {
                workCenterQueryConditions.push(
                    workCenterLocationQuery.createCondition({
                        fieldId: 'groupname',
                        operator: query.Operator.IS,
                        values: dataObject.enteredWorkCenter
                    })
                );
            }
            if(dataObject.workCenterId) {
                workCenterQueryConditions.push(
                    workCenterLocationQuery.createCondition({
                        fieldId: 'id',
                        operator: query.Operator.EQUAL,
                        values: dataObject.workCenterId
                    })
                );
            }
            workCenterLocationQuery.condition = workCenterLocationQuery.and(workCenterQueryConditions);
            workCenterLocationQuery.columns = [
                workCenterLocationQuery.createColumn({
                    fieldId: 'id'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'groupname'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'grouptypename'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wclocation'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wclocation.name'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcassemblybin'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcassemblybin.binnumber'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcstagingbin'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcstagingbin.binnumber'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcprodinvstatus'
                })
            ];
            log.debug('workCenterLocationQuery',workCenterLocationQuery);
            workCenterLocationQuery.sort = [
                workCenterLocationQuery.createSort({
                    column: workCenterLocationQuery.columns[0],
                    ascending: true
                })
            ];
            var workCenterResult = runQueryInSuiteQL(workCenterLocationQuery);
            return workCenterResult;
        }

        function parseDateString(initialFormattedDateString)
        {
            var parsedDateStringAsRawDateObject = format.parse({
                value: initialFormattedDateString,
                type: format.Type.DATETIMETZ
            });

            return parsedDateStringAsRawDateObject;
        }

        function getFormattedDateString(parsedDateStringAsRawDateObject)
        {
            var formattedDateString = format.format({
                value: parsedDateStringAsRawDateObject,
                type: format.Type.DATETIMETZ
            });

            return formattedDateString;
        }

        function getWorkCenterLocationInRoutingStep(workCenter){
            var queryConditions = [];
            var location = '';
            var groupQuery= query.create({
                type: query.Type.ENTITY_GROUP
            });
            queryConditions.push(groupQuery.createCondition({
                fieldId: 'groupname',
                operator: query.Operator.IS,
                values: workCenter
            }));
            groupQuery.condition = groupQuery.and(queryConditions);
            groupQuery.columns = [
                groupQuery.createColumn({
                    fieldId : 'custentity_mfgmob_wclocation'
                })
            ];

            var groupQueryQL = groupQuery.toSuiteQL();
            var resultSuiteQL = groupQueryQL.run();
            var groupLocation = [];
            if(resultSuiteQL != null || resultSuiteQL != ''){
                var groupResults = resultSuiteQL.results;
                var groupColumns = resultSuiteQL.columns;
                for(var group in groupResults){
                    var groupResult = groupResults[group];
                    var groupValues = groupResult.values;
                    var groupList = {};
                    for(var groupDetail in groupColumns){
                        var groupColumn = groupColumns[groupDetail]['fieldId'];
                        groupList[groupColumn] = groupValues[groupDetail];
                    }
                    groupLocation.push(groupList);
                }

                if(groupLocation!= null || groupLocation.length !==0){
                    var workCenterLocation =  groupLocation[0]['custentity_mfgmob_wclocation'];
                    if(isValueValid(workCenterLocation))
                    {
                        location = record.load({
                            type: record.Type.LOCATION,
                            id: workCenterLocation
                        });
                    }
                }

            }

            return location;
        }

        function getWorkCenterLocationDetails() {
            var workCenterQueryConditions = [];
            var workCenterLocationQuery = query.create({
                type: query.Type.ENTITY_GROUP
            });
            /*workCenterQueryConditions.push(workCenterLocationQuery.createCondition({
                fieldId: 'grouptypename',
                operator: query.Operator.IS,
                values: "Employee"
            }));
            workCenterLocationQuery.condition = workCenterLocationQuery.and(workCenterQueryConditions);*/
            workCenterLocationQuery.columns = [
                workCenterLocationQuery.createColumn({
                    fieldId: 'id'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'groupname'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'grouptypename'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wclocation'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcprodinvstatus'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcassemblybin'
                }),
                workCenterLocationQuery.createColumn({
                    fieldId: 'custentity_mfgmob_wcstagingbin'
                })
            ];
            return workCenterLocationQuery;
        }

        function runQueryInSuiteQL(queryToExecute) {
            var runQueryResult = [];
            var queryToExecuteSuiteQL = queryToExecute.toSuiteQL();
            var resultSuiteQL = queryToExecuteSuiteQL.run();
            if (resultSuiteQL != null || resultSuiteQL != '') {
                var results = resultSuiteQL.results;
                var columns = resultSuiteQL.columns;
                for (var result in results) {
                    var result = results[result];
                    var values = result.values;
                    var valuesList = {};
                    for (var detail in columns) {
                        var column = columns[detail]['fieldId'];
                        valuesList[column] = values[detail];
                    }
                    runQueryResult.push(valuesList);
                }
            }
            log.debug('runQueryResult',runQueryResult);
            return runQueryResult;
        }

        function getLocationList() {
            var locationQueryConditions = [];
            var locationQuery = query.create({
                type: query.Type.LOCATION
            });
            locationQueryConditions.push(locationQuery.createCondition({
                fieldId: 'isinactive',
                operator: query.Operator.IS,
                values: false
            }));
            locationQuery.condition = locationQuery.and(locationQueryConditions);
            locationQuery.columns = [
                locationQuery.createColumn({
                    fieldId: 'id'
                }),
                locationQuery.createColumn({
                    fieldId: 'name'
                })
            ];
            return locationQuery;
        }
        function getSerializedItemList(){
            var serializedItemQueryConditions = [];
            var serializedItemQuery = query.create({
                type: query.Type.ITEM
            });
            serializedItemQueryConditions.push(serializedItemQuery.createCondition({
                fieldId: 'isserialitem',
                operator: query.Operator.IS,
                values: true
            }));
            serializedItemQuery.condition = serializedItemQuery.and(serializedItemQueryConditions);
            serializedItemQuery.columns = [
                serializedItemQuery.createColumn({
                    fieldId: 'itemid'
                }),
                serializedItemQuery.createColumn({
                    fieldId: 'id'
                })
            ];
            return serializedItemQuery;
        }
        function getSQLQueryResults(queryString,columns){
            var resultSet = query.runSuiteQL({
                query: queryString,
            });
            var results= resultSet.results;
            var outputResults = [];
            for (var row in results) {
                var result = results[row];
                var keyList = {};
                var values = result.values;
                for (var col in columns) {
                    var colName = columns[col];
                    keyList[colName] = values[col];
                }
                outputResults.push(keyList);
            }
            log.debug('outputResults',outputResults);
            return outputResults;
        }


        function checkIfItemIsSerialized(item){
            var isSerialized = false;
            var serializedItemQuery = getSerializedItemList();
            var serializedItemList = runQueryInSuiteQL(serializedItemQuery);
            for(var i=0;i<serializedItemList.length;i++){
                if(serializedItemList[i].id == item)
                    isSerialized =true;
            }
            return isSerialized;
        }

        function getSerialNumbersAssociatedToWork(workDetails) {
            var serialNumberQueryConditions = [];
            var serialNumberQuery = query.create({
                type: 'CUSTOMRECORD_MFGMOB_PRODUCTION_SERIALNOS'
            });
            serialNumberQueryConditions.push(serialNumberQuery.createCondition({
                fieldId: 'custrecord_mfgmob_prodserial_workid',
                operator: query.Operator.ANY_OF,
                values: workDetails.workId
            }));
            serialNumberQuery.condition = serialNumberQuery.and(serialNumberQueryConditions);
            serialNumberQuery.columns = [
                serialNumberQuery.createColumn({
                    fieldId: 'name'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'id'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'custrecord_mfgmob_prodserial_selected'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'custrecord_mfgmob_prodserial_processed'
                })
            ];
            serialNumberQuery.sort = [
                serialNumberQuery.createSort({
                    column: serialNumberQuery.columns[1],
                    ascending: false
                })
            ];
            return serialNumberQuery;
        }

        function getProductionSerialNumberIntenalId(serialNumber) {
            var serialNumberQueryConditions = [];
            var serialNumberQuery = query.create({
                type: 'CUSTOMRECORD_MFGMOB_PRODUCTION_SERIALNOS'
            });
            serialNumberQueryConditions.push(serialNumberQuery.createCondition({
                fieldId: 'name',
                operator: query.Operator.IS,
                values: serialNumber
            }));
            serialNumberQuery.condition = serialNumberQuery.and(serialNumberQueryConditions);
            serialNumberQuery.columns = [
                serialNumberQuery.createColumn({
                    fieldId: 'id'
                })
            ];
            var serialNumberQueryResult = runQueryInSuiteQL(serialNumberQuery);
            var serialNumberInternalId = serialNumberQueryResult[0].id;
            return serialNumberInternalId;

        }
        function getUnselectedSerialNumberQuery(serialNumberDetails) {
            var serialNumberFilters = [];
            var userLocationQuery = query.create({
                type: 'CUSTOMRECORD_MFGMOB_PRODUCTION_SERIALNOS'
            });
            serialNumberFilters.push(userLocationQuery.createCondition({
                fieldId: 'custrecord_mfgmob_prodserial_selected',
                operator: query.Operator.IS,
                values: false
            }));
            serialNumberFilters.push(userLocationQuery.createCondition({
                fieldId: 'custrecord_mfgmob_prodserial_processed',
                operator: query.Operator.IS,
                values: false
            }));
            var serialNumberQuery = getSerialNumbersAssociatedToWork({workId: serialNumberDetails.workId});
            log.debug(serialNumberQuery);
            serialNumberFilters.push(serialNumberQuery.condition);
            serialNumberQuery.condition = serialNumberQuery.and(serialNumberFilters);
            return serialNumberQuery;
        }

        function getConsumptionSerialNumbersAssociatedToWork(workDetails){
            var serialNumberQueryConditions = [];
            var serialNumberQuery = query.create({
                type: 'CUSTOMRECORD_MFGMOB_CONSUMPTION_SERIALNO'
            });
            serialNumberQueryConditions.push(serialNumberQuery.createCondition({
                fieldId: 'custrecord_mfgmob_conserial_workid',
                operator: query.Operator.ANY_OF,
                values: workDetails.workId
            }));
            serialNumberQueryConditions.push(serialNumberQuery.createCondition({
                fieldId: 'custrecord_mfgmob_consserial_component',
                operator: query.Operator.ANY_OF,
                values: workDetails.component
            }));
            serialNumberQuery.condition = serialNumberQuery.and(serialNumberQueryConditions);
            serialNumberQuery.columns = [
                serialNumberQuery.createColumn({
                    fieldId: 'name'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'id'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'custrecord_mfgmob_conserial_processed'
                }),
                serialNumberQuery.createColumn({
                    fieldId: 'custrecord_mfgmob_conserial_selected'
                })
            ];
            serialNumberQuery.sort = [
                serialNumberQuery.createSort({
                    column: serialNumberQuery.columns[1],
                    ascending: false
                })
            ];
            return serialNumberQuery;
        }

        function getUnselectedConsumptionSerialNumberQuery(serialNumberDetails) {
            var serialNumberFilters = [];
            var userLocationQuery = query.create({
                type: 'CUSTOMRECORD_MFGMOB_CONSUMPTION_SERIALNO'
            });
            serialNumberFilters.push(userLocationQuery.createCondition({
                fieldId: 'custrecord_mfgmob_conserial_selected',
                operator: query.Operator.IS,
                values: false
            }));
            serialNumberFilters.push(userLocationQuery.createCondition({
                fieldId: 'custrecord_mfgmob_conserial_processed',
                operator: query.Operator.IS,
                values: false
            }));
            var serialNumberQuery = getConsumptionSerialNumbersAssociatedToWork({workId: serialNumberDetails.workId, component: serialNumberDetails.component});
            log.debug(serialNumberQuery);
            serialNumberFilters.push(serialNumberQuery.condition);
            serialNumberQuery.condition = serialNumberQuery.and(serialNumberFilters);
            return serialNumberQuery;
        }

        return {
            isValueValid: isValueValid,
            getSearchResultInJSON:getSearchResultInJSON,
            getCurrentUserLanguage:getCurrentUserLanguage,
            getLocations:getLocations,
            isIndexFound:isIndexFound,
            getWorkCenterId: getWorkCenterId,
            getAllWorkCenters:getAllWorkCenters,
            getShiftList:getShiftList,
            getWorkCenters:getWorkCenters,
            parseDateString:parseDateString,
            getFormattedDateString:getFormattedDateString,
            isSubsidiaryEnabled:isSubsidiaryEnabled,
            getUserLocation:getUserLocation,
            getAllLocations:getAllLocations,
            getWorkCenterLocationInRoutingStep: getWorkCenterLocationInRoutingStep,
            getSerializedItemList: getSerializedItemList,
            runQueryInSuiteQL: runQueryInSuiteQL,
            getSQLQueryResults:getSQLQueryResults,
            checkIfItemIsSerialized: checkIfItemIsSerialized,
            getSerialNumbersAssociatedToWork: getSerialNumbersAssociatedToWork,
            getProductionSerialNumberIntenalId: getProductionSerialNumberIntenalId,
            getUnselectedSerialNumberQuery: getUnselectedSerialNumberQuery,
            getConsumptionSerialNumbersAssociatedToWork: getConsumptionSerialNumbersAssociatedToWork,
            getUnselectedConsumptionSerialNumberQuery: getUnselectedConsumptionSerialNumberQuery

        };

    });

