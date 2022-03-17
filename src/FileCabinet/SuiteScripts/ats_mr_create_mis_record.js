/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search, runtime) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            var locationArr = [];
            var scriptObj = runtime.getCurrentScript()
            var year = scriptObj.getParameter({
                name: 'custscript_ats_year'
            })
            var yearName;
            var filters = new Array();
            filters[0] = search.createFilter({
                name: 'internalID',
                operator: search.Operator.IS,
                values: year
            });
            var columns = new Array();
            columns[0] = search.createColumn({
                name: 'name'
            });
            var mySearch = search.create({
                type: 'customlist_ats_year',
                filters: filters,
                columns: columns
            })
            var result = mySearch.run();
            result.each(function (row) {


                 yearName = row.getValue({
                    name: 'name'
                })


                return true
            })

            var searchAllLocation = search.load({
                id: 'customsearch_final_ats_sta_actuals_2'
            })
            searchAllLocation.filters.push(search.createFilter({
                name:'periodname',
                join: 'accountingperiod',
                operator: 'contains',
                values: yearName
            }));
            searchAllLocation.run().each(function (result) {
                var propertyName = result.getValue({
                    name: 'internalid',
                    join: 'location',
                    summary: "GROUP"
                })
                locationArr.push(propertyName)
                return true;
            });
            log.audit('Get input ', locationArr)
            return locationArr;
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (context) => {
            var locationWithInvoice = context.value;
           // log.debug(locationWithInvoice)
            var scriptObj = runtime.getCurrentScript()
            var year = scriptObj.getParameter({
                name: 'custscript_ats_year'
            })
         //   log.debug('year ', year)
            var misParentId;
            var existingParentMis = []
           // log.debug('exisiting MIS parent ',existingParentMis )
            var misParentSearchObj = search.load({
                id: 'customsearch_ats_exisiting_parent'
            })
            misParentSearchObj.filters.push(search.createFilter({
                name: 'custrecord_ats_year',
                operator: 'anyof',
                values: year
            }));
            misParentSearchObj.run().each(function (result) {

                var exisitngParent = result.getValue({
                    name: 'internalid',
                    join: 'CUSTRECORD_ATS_PROPERTY'
                })

                existingParentMis.push(exisitngParent)
                return true;
            });
           // log.audit('existing MIS Rec', existingParentMis)
            function lookForAccPeriod(period) {
                var accountPeriod;
                var accountingperiodSearchObj = search.load({
                    id: 'customsearch_ats_accounting_period'
                })
                accountingperiodSearchObj.filters.push(search.createFilter({
                    name: 'periodname',
                    operator: 'contains',
                    values: period
                }));
                accountingperiodSearchObj.run().each(function (result) {

                    accountPeriod = result.getValue({
                        name: 'internalid',
                        summary: 'GROUP'
                    })


                    return true;
                });
                log.debug('Accounting Period' + accountPeriod)
                return accountPeriod;
            }

            function createMISParent(property, year) {
                var misParentRec = record.create({
                    type: 'customrecord_mis_report',
                    isDynamic: true
                })
                misParentRec.setValue({
                    fieldId: 'custrecord_ats_property',
                    value: property
                })
                misParentRec.setValue({
                    fieldId: 'custrecord_ats_year',
                    value: year
                })
                var year = misParentRec.getText('custrecord_ats_year')
                var propertyName = misParentRec.getText('custrecord_ats_property')
                misParentRec.setValue({
                    fieldId: 'name',
                    value: propertyName + ' ' + year
                })
                var misParentId = misParentRec.save()
                return misParentId
            }

            function createStatistic(misParentId, month, year,location, numofdays) {
                var statisticRec = record.create({
                    type: 'customrecord_ats_mis_statistic',
                    isDynamic: true
                })
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_mis_parent',
                    value: misParentId
                })
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_num_of_days',
                    value: numofdays
                })
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_property',
                    value: location
                })
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_month',
                    value: month
                })
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_year',
                    value: year
                })
                var month = statisticRec.getText('custrecord_ats_sta_month')

                var year = statisticRec.getText('custrecord_ats_sta_year')

                var monthFinal = month.substring(0, 3);
                var period = monthFinal + " " + year

                var acctPeriod = lookForAccPeriod(period)
                statisticRec.setValue({
                    fieldId: 'custrecord_ats_sta_accounting_period',
                    value: acctPeriod
                })
                var name = statisticRec.getText('custrecord_ats_sta_property') + ' ' + month + ' ' + year
                statisticRec.setValue({
                    fieldId: 'name',
                    value: name
                })
                var statisticId = statisticRec.save()
                log.debug('Statistic record has been created ', statisticId)
            }

            function createRevenue(misParentId, month, year,location,numofdays) {
                var curRec = record.create({
                    type: 'customrecord_ats_mis_revenue',
                    isDynamic: true
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_parent',
                    value: misParentId
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_property',
                    value: location
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_num_of_days',
                    value: numofdays
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_month',
                    value: month
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_year',
                    value: year
                })
                var month = curRec.getText('custrecord_ats_mis_month')

                var year = curRec.getText('custrecord_ats_mis_year')

                var monthFinal = month.substring(0, 3);
                var period = monthFinal + " " + year

                var acctPeriod = lookForAccPeriod(period)
                curRec.setValue({
                    fieldId: 'custrecord_ats_accounting_period',
                    value: acctPeriod
                })
                var name = curRec.getText('custrecord_ats_mis_property') + ' ' + month + ' ' + year
                curRec.setValue({
                    fieldId: 'name',
                    value: name
                })
                var recIdRevenue = curRec.save()
                log.debug('Revenue created', recIdRevenue)

            }

            function createExpense(misParentId, month, year,location, numofdays) {
                var curRec = record.create({
                    type: 'customrecord_ats_mis_expense',
                    isDynamic: true
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_rev_parent',
                    value: misParentId
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_rev_property',
                    value: location
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_exp_num_of_days',
                    value: numofdays
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_exp_months',
                    value: month
                })
                curRec.setValue({
                    fieldId: 'custrecord_ats_mis_exp_year',
                    value: year
                })
                var month = curRec.getText('custrecord_ats_mis_exp_months')

                var year = curRec.getText('custrecord_ats_mis_exp_year')

                var monthFinal = month.substring(0, 3);
                var period = monthFinal + " " + year

                var acctPeriod = lookForAccPeriod(period)
                curRec.setValue({
                    fieldId: 'custrecord_ats_exp_accounting_period',
                    value: acctPeriod
                })
                var name = curRec.getText('custrecord_ats_mis_rev_property') + ' ' + month + ' ' + year
                curRec.setValue({
                    fieldId: 'name',
                    value: name
                })
                var expenseId = curRec.save()
                log.debug('Revenue created', expenseId)

            }

            existingParentMis.includes(locationWithInvoice)
            var isExisting = existingParentMis.includes(locationWithInvoice)
            log.debug('is existing', isExisting + ' ' + locationWithInvoice)
            if (isExisting == false) {
          log.audit('creating mis record')
                    misParentId = createMISParent(locationWithInvoice,year)
                    log.debug('Mis Parent created', misParentId)
                    if (misParentId) {
                        for (var i = 1; i <= 12; i++) {
                            var numofdays;
                            switch(parseInt(i)) {
                                case 1:
                                    numofdays = 31
                                    break;
                                case 2:
                                    numofdays = 28
                                case 3:
                                    numofdays = 31
                                    break;
                                case 4:
                                    numofdays = 30
                                case 5:
                                    numofdays = 31
                                    break;
                                case 6:
                                    numofdays = 30
                                case 7:
                                    numofdays = 31
                                    break;
                                case 8:
                                    numofdays = 31
                                case 9:
                                    numofdays = 30
                                    break;
                                case 10:
                                    numofdays = 31
                                case 11:
                                    numofdays = 30
                                    break;
                                case 12:
                                    numofdays = 31
                                    // code block
                                    break;
                                default:
                                // code block
                            }
                            log.debug('Num of days', numofdays)
                            if(numofdays){
                                createStatistic(misParentId, i, year , locationWithInvoice,numofdays)
                                createRevenue(misParentId, i, year, locationWithInvoice, numofdays)
                                createExpense(misParentId, i, year, locationWithInvoice, numofdays)
                            }



                    }
               }
            }else{
                log.audit('This location is existing already ', locationWithInvoice)
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
