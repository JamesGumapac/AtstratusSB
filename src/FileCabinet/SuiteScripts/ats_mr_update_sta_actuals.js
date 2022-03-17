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
                id: 'customsearch_ats_mis_sta_period_search'
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
            var roomSold = 0;
            var bedSold = 0
            var bedSoldTotal = 0;
            var roomSoldTotal = 0
            var averageRoomRateGP = 0
            var averageRoomRateFB = 0
            var averageRoomRateHB = 0
            var averageRoomRateBB = 0
            var averageRoomRateDR = 0
            var revRoomsGP = 0
            var revRoomsFB = 0
            var revRoomsHB = 0
            var revRoomsBB = 0
            var revRoomsDR = 0
            var revId;


            let searchResult = JSON.parse(context.value);
            //log.debug('Search Result', searchResult)
            //  let period = searchResult.values.custrecord_ats_sta_accounting_period.text;

            let id = searchResult.values.internalid.value;
            let property = searchResult.values.custrecord_ats_sta_property.value


            var accountPeriod = searchResult.values.custrecord_ats_sta_accounting_period.text
            // log.audit(`MIS ID:  ${id} | PROPERTY: ${property} | ACCOUNTING PERIOD: ${accountPeriod}`)

            var periodFinal = accountPeriod.substring(accountPeriod.length - 8, accountPeriod.length)
            var invoiceSearchObj = search.load({
                id: 'customsearch_final_ats_sta_actuals'
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
            log.debug('Search Result Count', searchResult)
            if (searchResultCount > 0) {

                var misRec = record.load({
                    type: 'customrecord_ats_mis_statistic',
                    id: id,
                    isDynamic: true
                });
                var misRecYear = misRec.getValue('custrecord_ats_sta_year')
                var misRecMonth = misRec.getValue('custrecord_ats_sta_month')
                var misProperty = misRec.getValue('custrecord_ats_sta_property')
                var revRecSearhObj = search.load({
                    id: 'customsearch_ats_rev_search_for_sta_updt'
                })
                revRecSearhObj.filters.push(search.createFilter({
                    name: 'custrecord_ats_mis_month',
                    operator: 'anyof',
                    values: misRecMonth
                }));
                revRecSearhObj.filters.push(search.createFilter({
                    name: 'custrecord_ats_mis_year',
                    operator: 'anyof',
                    values: misRecYear
                }));
                revRecSearhObj.filters.push(search.createFilter({
                    name: 'custrecord_ats_mis_property',
                    operator: 'anyof',
                    values: misProperty
                }));

                var revRecSearhObjCount = revRecSearhObj.runPaged().count;
                if (revRecSearhObjCount > 0) {
                    revRecSearhObj.run().each(function (result) {
                        revId = result.id
                        revRoomsGP = result.getValue({
                            name: 'custrecord32'
                        })
                        revRoomsBB = result.getValue({
                            name: 'custrecord41'
                        })
                        revRoomsDR = result.getValue({
                            name: 'custrecord44'
                        })
                        revRoomsFB = result.getValue({
                            name: 'custrecord35'
                        })
                        revRoomsHB = result.getValue({
                            name: 'custrecord38'
                        })
                        return true;
                    });
                }

                invoiceSearchObj.run().each(function (result) {
                    var accountingPeriod = result.getValue({
                        name: 'periodname',
                        join: 'accountingPeriod',
                        summary: 'GROUP'
                    })
                    //  log.debug('Accounting Period', accountingPeriod)


                    roomSold = result.getValue({
                        name: 'custcol_at_room_nights',
                        summary: "SUM"
                    })
                    log.debug('Room Sold', roomSold)
                    roomSoldTotal += parseInt(roomSold)
                    log.debug('RoomSold', roomSold)
                    bedSold = result.getValue({
                        name: 'formulanumeric',
                        summary: 'SUM'
                    })
                    log.debug('bedsold', bedSold)
                    bedSoldTotal += parseInt(bedSold)
                    log.debug('BedSold', bedSold)
                    var revCategory = result.getText({
                        name: 'custrecord_ats_revenue_category',
                        join: 'account',
                        summary: 'GROUP'
                    })
                    log.debug('Rev Category', revCategory)

                    //    log.debug('MIS REC', misRec)

                    if (revCategory.includes('GP') === true) {
                        log.debug('GP')
                        misRec.setValue({
                            fieldId: 'custrecord2',
                            value: roomSold
                        })
                        misRec.setValue({
                            fieldId: 'custrecord12',
                            value: bedSold
                        })

                        averageRoomRateGP = revRoomsGP / roomSold
                        try {
                            if (averageRoomRateGP > 0) {
                                log.audit('Average room rate GP', averageRoomRateGP)
                                misRec.setValue({
                                    fieldId: 'custrecord_ats_sta_average_room_rate',
                                    value: averageRoomRateGP.toFixed(2)
                                })

                            }
                        } catch (e) {
                            log.error(e.message)
                        }



                    }
                    if (revCategory.includes('FB') === true) {
                        log.debug('FB')
                        misRec.setValue({
                            fieldId: 'custrecord4',
                            value: roomSold
                        })
                        misRec.setValue({
                            fieldId: 'custrecord14',
                            value: bedSold
                        })
                        averageRoomRateFB = revRoomsFB / roomSold
                        try {
                            if (averageRoomRateFB > 0) {
                                log.audit('Average room rate FB', averageRoomRateFB)
                                misRec.setValue({
                                    fieldId: 'custrecord255',
                                    value: averageRoomRateFB.toFixed(2)
                                })

                            }
                        } catch (e) {
                            log.error(e.message)
                        }

                    }
                    if (revCategory.includes('HB') === true) {
                        log.debug('HB')
                        misRec.setValue({
                            fieldId: 'custrecord6',
                            value: roomSold
                        })
                        misRec.setValue({
                            fieldId: 'custrecord16',
                            value: bedSold
                        })
                        averageRoomRateHB = revRoomsHB / roomSold
                        try {
                            if (averageRoomRateHB > 0) {
                                log.audit('Average room rate HB', averageRoomRateHB)
                                misRec.setValue({
                                    fieldId: 'custrecord256',
                                    value: averageRoomRateHB.toFixed(2)
                                })

                            }
                        } catch (e) {
                            log.error(e.message)
                        }

                    }
                    if (revCategory.includes('BB') === true) {
                        log.debug('BB')
                        misRec.setValue({
                            fieldId: 'custrecord8',
                            value: roomSold
                        })
                        misRec.setValue({
                            fieldId: 'custrecord18',
                            value: bedSold
                        })
                        averageRoomRateBB = revRoomsBB / roomSold
                        try {
                            if (averageRoomRateBB > 0) {
                                log.audit('Average room rate BB', averageRoomRateBB)
                                misRec.setValue({
                                    fieldId: 'custrecord257',
                                    value: averageRoomRateBB.toFixed(2)
                                })

                            }
                        } catch (e) {
                            log.error(e.message)
                        }

                    }
                    if (revCategory.includes('DR') === true) {
                        log.debug('DR')
                        misRec.setValue({
                            fieldId: 'custrecord10',
                            value: roomSold
                        })
                        misRec.setValue({
                            fieldId: 'custrecord20',
                            value: bedSold
                        })
                        averageRoomRateDR = revRoomsDR / roomSold
                        try {
                            if (averageRoomRateDR > 0) {
                                log.audit('Average room rate DR', averageRoomRateDR)
                                misRec.setValue({
                                    fieldId: 'custrecord258',
                                    value: averageRoomRateDR.toFixed(2)
                                })
                            }
                        } catch (e) {
                            log.error(e.message)
                        }


                    }


                    return true;

                });


                log.debug('Room Sold Total', roomSoldTotal)
                log.debug('Bed Sold Total', bedSoldTotal)
                misRec.setValue({
                    fieldId: 'custrecord_ats_sta_room_sold',
                    value: roomSoldTotal
                })

                misRec.setValue({
                    fieldId: 'custrecord_ats_sta_bed_sold',
                    value: bedSoldTotal
                })
                // misRec.save({
                //     ignoreMandatoryFields: true
                // });
                //Set Room Occupany Actual
                var roomSoldActual = 0
                var roomsAvailableActual = 0
                roomSoldActual = misRec.getValue('custrecord_ats_sta_room_sold')
                roomsAvailableActual = misRec.getValue('custrecord_ats_sta_rooms_available')

                try {
                    var roomOccupancyActual = 0.00;
                    var roomOccupancyBduge = 0.00;
                    var roomOccupancyForecast = 0.00;
                    roomOccupancyActual = (roomSoldActual / roomsAvailableActual) * 100
                    //   log.audit('Room occupancy', roomOccupancyActual)
                    if (roomOccupancyActual != null) {
                        misRec.setValue({
                            fieldId: 'custrecord_ats_sta_room_occupancy',
                            value: roomOccupancyActual.toFixed(2)
                        })
                    }

                    // set Room Occupancy Budget
                    var roomSoldBudget = 0
                    var roomsAvailableBudget = 0
                    roomSoldBudget = misRec.getValue('custrecord85')
                    roomsAvailableBudget = misRec.getValue('custrecord84')
                    roomOccupancyBduget = (roomSoldBudget / roomsAvailableBudget) * 100
                    log.debug('Room occupancy Budget', roomOccupancyBduget)
                    if (roomOccupancyBduget != null) {
                        misRec.setValue({
                            fieldId: 'custrecord245',
                            value: roomOccupancyBduget.toFixed(2)
                        })
                    }
                    // set value for forecast room occupancy
                    var roomSoldForecast = 0
                    var roomsAvailableForecast = 0
                    roomSoldForecast = misRec.getValue('custrecord243')
                    roomsAvailableForecast = misRec.getValue('custrecord252')
                    roomOccupancyForecast = (roomSoldForecast / roomsAvailableForecast) * 100
                    log.debug('Room occupancy', roomOccupancyForecast)
                    if (roomOccupancyForecast != null) {
                        misRec.setValue({
                            fieldId: 'custrecord246',
                            value: roomOccupancyForecast.toFixed(2)
                        })
                    }


                } catch (e) {
                    log.error(e.message, id)
                }

                log.debug('AAAMis rec', misRec)
                var staId
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
