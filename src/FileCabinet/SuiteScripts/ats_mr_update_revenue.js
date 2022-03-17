/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
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
            var mainprortySearch = search.load({
                id: 'customsearch_ats_mis_revenue_acc_period'
            })
            return mainprortySearch
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
            var roomsActualTotal = 0;
            var extrasTotal = 0;
            var grossRevenue = 0

            let searchResult = JSON.parse(context.value);
            //log.debug('Search Result', searchResult)
            //  let period = searchResult.values.custrecord_ats_sta_accounting_period.text;

            let id = searchResult.values.internalid.value;
            let property = searchResult.values.custrecord_ats_mis_property.value


            var accountPeriod = searchResult.values.custrecord_ats_accounting_period.text
         //   log.audit(`MIS ID:  ${id} | PROPERTY: ${property} | ACCOUNTING PERIOD: ${accountPeriod}`)

            var periodFinal = accountPeriod.substring(accountPeriod.length - 8, accountPeriod.length)
            var invoiceSearchObj = search.load({
                id: 'customsearch_final_ats_rev_actuals'
            })
            invoiceSearchObj.filters.push(search.createFilter({
                name: "periodname",
                join: "accountingPeriod",
                operator: 'contains',
                values: periodFinal.toString()
            }));
            invoiceSearchObj.filters.push(search.createFilter({
                name: "location",
                operator: 'anyof',
                values: parseInt(property)
            }));

            var searchResultCount = invoiceSearchObj.runPaged().count;
          //  log.debug('Search Result Count', searchResult)
            if (searchResultCount > 0) {

                var misRec = record.load({
                    type: 'customrecord_ats_mis_revenue',
                    id: id,
                    isDynamic: true
                });

                invoiceSearchObj.run().each(function (result) {

                    var accountingPeriod = result.getValue({
                        name: 'periodname',
                        join: 'accountingPeriod',
                        summary: 'GROUP'
                    })


                    var amount = result.getValue({
                        name: 'amount',
                        summary: "SUM"
                    })


                    var revCategory = result.getText({
                        name: 'custrecord_ats_revenue_category',
                        join: 'account',
                        summary: 'GROUP'
                    })
                    log.debug(`APeriod: ${accountingPeriod} | revCategory: ${revCategory} | amount: ${amount}`)



                    if (revCategory.includes('GP') === true) {
                        log.debug('GP')
                        misRec.setValue({
                            fieldId: 'custrecord32',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)


                    }
                    if (revCategory.includes('FB') === true) {
                        log.debug('FB')
                        misRec.setValue({
                            fieldId: 'custrecord35',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)
                    }
                    if (revCategory.includes('HB') === true) {
                        log.debug('HB')
                        misRec.setValue({
                            fieldId: 'custrecord38',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)
                    }
                    if (revCategory.includes('BB') === true) {
                        log.debug('BB')
                        misRec.setValue({
                            fieldId: 'custrecord41',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('DR') === true) {
                        log.debug('DR')
                        misRec.setValue({
                            fieldId: 'custrecord44',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Room Other') === true) {
                        log.debug('Room Other')
                        misRec.setValue({
                            fieldId: 'custrecord47',
                            value: amount
                        })
                        roomsActualTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Food') === true) {
                        log.debug('Food')
                        misRec.setValue({
                            fieldId: 'custrecord50',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Bar') === true) {
                        log.debug('Bar')
                        misRec.setValue({
                            fieldId: 'custrecord53',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Extras') === true) {
                        log.debug('Extras')
                        misRec.setValue({
                            fieldId: 'custrecord59',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Curio Shop') === true) {
                        log.debug('Curio Shop')
                        misRec.setValue({
                            fieldId: 'custrecord62',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Flights and Transfers') === true) {
                        log.debug('Flights and Transfers')
                        misRec.setValue({
                            fieldId: 'custrecord65',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Park & Conservancy fees') === true) {
                        log.debug('Park & Conservancy fees')
                        misRec.setValue({
                            fieldId: 'custrecord68',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Activities & Excursions') === true) {
                        log.debug('Activities & Excursions')
                        misRec.setValue({
                            fieldId: 'custrecord56',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Spa') === true) {
                        log.debug('Spa')
                        misRec.setValue({
                            fieldId: 'custrecord71',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Shanga') === true) {
                        log.debug('Shanga')
                        misRec.setValue({
                            fieldId: 'custrecord74',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Conferences') === true) {
                        log.debug('Conferences')
                        misRec.setValue({
                            fieldId: 'custrecord77',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }
                    if (revCategory.includes('Tour Sales') === true) {
                        log.debug('Tour Sales')
                        misRec.setValue({
                            fieldId: 'custrecord80',
                            value: amount
                        })
                        extrasTotal += parseFloat(amount)

                    }



                    return true;

                });
                 grossRevenue = roomsActualTotal + extrasTotal;
                 log.debug('Gross Revenue')
                try {
                    misRec.setValue({
                        fieldId: 'custrecord_ats_rev_room',
                        value: roomsActualTotal
                    })

                    misRec.setValue({
                        fieldId: 'custrecord_ats_rev_extras',
                        value: extrasTotal
                    })
                    misRec.setValue({
                        fieldId: 'custrecord_ats_rev_gross_revenue',
                        value: grossRevenue
                    })
                } catch (e) {
                    log.error(e.message, id)
                }


                log.debug(`Extras and Rooms Total`, `${roomsActualTotal} , ${extrasTotal}`  )
                if (misRec) {
                    try {
                        staId = misRec.save({
                            ignoreMandatoryFields: true
                        });
                    } catch (e) {
                        log.error(e.message, id)
                    }


                }
                log.audit(' Statisitc Record updated ', staId)
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
        const reduce = (context) => {
            var reduceValue = JSON.parse(context.value)
            log.audit('Reduce ', reduceValue)
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
