/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    /**
     * @param{record} record
     */
    (record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (context) => {
            var rec = context.newRecord
            log.debug(rec.type)
            if (rec.type == 'customrecord_ats_mis_statistic') {
                try {


                    var numOfdays = rec.getValue('custrecord_ats_sta_num_of_days')
                    var numOfRoomsActual = rec.getValue('custrecord_ats_sta_num_of_rooms')
                    if (numOfRoomsActual > 0) {
                        var roomsActual = parseInt(numOfdays) * parseInt(numOfRoomsActual)
                        rec.setValue({
                            fieldId: 'custrecord_ats_sta_rooms_available',
                            value: roomsActual
                        })
                    }
                    var numOfRoomsBudget = rec.getValue('custrecord253')
                    if (numOfRoomsBudget > 0) {
                        var roomsActual = parseInt(numOfdays) * parseInt(numOfRoomsBudget)
                        rec.setValue({
                            fieldId: 'custrecord84',
                            value: roomsActual
                        })
                    }
                    var numOfRoomsForecast = rec.getValue('custrecord251')
                    if (numOfRoomsForecast > 0) {
                        var roomsForecast = parseInt(numOfdays) * parseInt(numOfRoomsForecast)
                        rec.setValue({
                            fieldId: 'custrecord252',
                            value: roomsForecast
                        })
                    }
                    //rooms budget computation
                    var budgetRoomsGP = rec.getValue('custrecord22')
                    var budgetRoomsFB = rec.getValue('custrecord23')
                    var budgetRoomsHB = rec.getValue('custrecord24')
                    var budgetRoomsBB = rec.getValue('custrecord25')
                    var budgetRoomsDR = rec.getValue('custrecord26')
                    var roomSoldBudget = parseInt(budgetRoomsGP) + parseInt(budgetRoomsFB) + parseInt(budgetRoomsHB) + parseInt(budgetRoomsBB) + parseInt(budgetRoomsDR)
                    log.debug('Rooms Sold Budget ', roomSoldBudget)
                    rec.setValue({
                        fieldId: 'custrecord85', //rooms sold budget
                        value: roomSoldBudget
                    })
                    // beds budget computation
                    var budgetBedsGP = rec.getValue('custrecord27')
                    var budgetBedsFB = rec.getValue('custrecord28')
                    var budgetBedsHB = rec.getValue('custrecord29')
                    var budgetBedsBB = rec.getValue('custrecord30')
                    var budgetBedsDR = rec.getValue('custrecord31')
                    var bedSoldBudget = parseInt(budgetBedsGP) + parseInt(budgetBedsFB) + parseInt(budgetBedsHB) + parseInt(budgetBedsBB) + parseInt(budgetBedsDR)
                    log.debug('Bed Sold Budget ', bedSoldBudget)

                    rec.setValue({
                        fieldId: 'custrecord86', //bed sold budget
                        value: bedSoldBudget
                    })

                    //rooms forecast computation
                    var forecastRoomsGP = rec.getValue('custrecord3')
                    var forecastRoomsFB = rec.getValue('custrecord5')
                    var forecastRoomsHB = rec.getValue('custrecord7')
                    var forecastRoomsBB = rec.getValue('custrecord9')
                    var forecastRoomsDR = rec.getValue('custrecord11')
                    var forecastRoomsSold = parseInt(forecastRoomsGP) + parseInt(forecastRoomsFB) + parseInt(forecastRoomsHB) + parseInt(forecastRoomsBB) + parseInt(forecastRoomsDR)
                    log.debug('Forecast room sold  ', forecastRoomsSold)
                    rec.setValue({
                        fieldId: 'custrecord243', //forecast roomsold budget
                        value: forecastRoomsSold
                    })
                    // beds forecast computation
                    var forecastBedsGP = rec.getValue('custrecord13')
                    var forecastBedsFB = rec.getValue('custrecord15')
                    var forecastBedsHB = rec.getValue('custrecord17')
                    var forecastBedsBB = rec.getValue('custrecord19')
                    var forecastBedsDR = rec.getValue('custrecord21')
                    var forecastBeds = parseInt(forecastBedsGP) + parseInt(forecastBedsFB) + parseInt(forecastBedsHB) + parseInt(forecastBedsBB) + parseInt(forecastBedsDR)
                    log.debug('Forecast Bed Sold ', forecastBeds)

                    rec.setValue({
                        fieldId: 'custrecord244', //Forecast bed sold budget
                        value: forecastBeds
                    })


                    //Set Value Double Occupancy
                    var bedSoldActual = rec.getValue('custrecord_ats_sta_bed_sold')
                    var roomSoldActual = rec.getValue('custrecord_ats_sta_room_sold')
                    var doubleOccupancyActual = (bedSoldActual / roomSoldActual)
                    log.debug('Double occupancy actual', doubleOccupancyActual)
                    if (doubleOccupancyActual) {
                        rec.setValue({
                            fieldId: 'custrecord_ats_sta_double_occupancy',
                            value: doubleOccupancyActual.toFixed(2)
                        })
                    }
                    //Set Value Double Occupancy Forecast
                    var bedSoldForecast = rec.getValue('custrecord244')
                    var roomSoldForecast = rec.getValue('custrecord243')
                    log.audit('bedSoldForecast', bedSoldForecast)
                    log.audit('roomSoldForecast', roomSoldForecast)
                    var doubleOccupancyForecast = 0;
                     doubleOccupancyForecast = (bedSoldForecast / roomSoldForecast)
                    log.audit('Double occupancy forecast', doubleOccupancyForecast)
                    rec.setValue({
                        fieldId: 'custrecord254',
                        value: doubleOccupancyForecast.toFixed(2)
                    })

                    //Set Value Double Occupancy Budget
                    var bedSoldBudget = rec.getValue('custrecord86')
                    var roomSoldBudget = rec.getValue('custrecord85')
                    var doubleOccupancyBudget = (bedSoldBudget / roomSoldBudget)
                    log.audit('Double occupancy budget', doubleOccupancyBudget)
                    if (doubleOccupancyBudget) {
                        rec.setValue({
                            fieldId: 'custrecord247',
                            value: doubleOccupancyBudget.toFixed(2)
                        })
                    }

                    // set Room Occupancy Budget
                    var roomSoldBudget = 0
                    var roomsAvailableBudget = 0
                    roomSoldBudget = rec.getValue('custrecord85')
                    roomsAvailableBudget = rec.getValue('custrecord84')
                    roomOccupancyBduget = (roomSoldBudget / roomsAvailableBudget) * 100
                    log.debug('Room occupancy Budget', roomOccupancyBduget)
                    if (roomOccupancyBduget != null) {
                        rec.setValue({
                            fieldId: 'custrecord245',
                            value: roomOccupancyBduget.toFixed(2)
                        })
                    }
                    // set value for forecast room occupancy
                    var roomSoldForecast = 0
                    var roomsAvailableForecast = 0
                    roomSoldForecast = rec.getValue('custrecord243')
                    roomsAvailableForecast = rec.getValue('custrecord252')
                    roomOccupancyForecast = (roomSoldForecast / roomsAvailableForecast) * 100
                    log.debug('Room occupancy', roomOccupancyForecast)
                    if (roomOccupancyForecast != null) {
                        rec.setValue({
                            fieldId: 'custrecord246',
                            value: roomOccupancyForecast.toFixed(2)
                        })
                    }
                } catch (e) {
                    log.error(e.message , rec.id)
                }
            }
            if (rec.type == 'customrecord_ats_mis_revenue') {
                //budget computation
                let budget = true;
                let forecast = true
                try {
                    if (budget === true) {
                        let roomsGP = 0
                        let roomsFB = 0
                        let roomsHB = 0
                        let roomsBB = 0
                        let roomsDR = 0
                        let roomOther = 0
                        let food = 0
                        let bar = 0
                        let extras = 0
                        let curioShop = 0
                        let flightsAndTransfers = 0
                        let parkAndConservancyFees = 0
                        let activitiesAndExcursions = 0
                        let spa = 0
                        let shanga = 0
                        let conferences = 0
                        let tourSales = 0

                        roomsGP = rec.getValue('custrecord34')
                        roomsFB = rec.getValue('custrecord36')
                        roomsHB = rec.getValue('custrecord39')
                        roomsBB = rec.getValue('custrecord42')
                        roomsDR = rec.getValue('custrecord45')
                        let roomsBudgetTotal = (roomsGP + roomsFB + roomsBB + roomsDR + roomsHB)
                        log.debug('roomsBudgetTotal', roomsBudgetTotal)
                        rec.setValue({
                            fieldId: 'custrecord_ats_rev_room_budget',
                            value: roomsBudgetTotal
                        })

                        roomOther = rec.getValue('custrecord48')
                        food = rec.getValue('custrecord51')
                        bar = rec.getValue('custrecord54')
                        extras = rec.getValue('custrecord60')
                        curioShop = rec.getValue('custrecord63')
                        flightsAndTransfers = rec.getValue('custrecord66')
                        parkAndConservancyFees = rec.getValue('custrecord69')
                        activitiesAndExcursions = rec.getValue('custrecord57')
                        spa = rec.getValue('custrecord72')
                        shanga = rec.getValue('custrecord75')
                        conferences = rec.getValue('custrecord78')
                        tourSales = rec.getValue('custrecord81')
                        let extrasTotalBudget = 0;
                        extrasTotalBudget = (roomOther + food + bar + extras + curioShop + flightsAndTransfers + parkAndConservancyFees + activitiesAndExcursions + spa + shanga + conferences + tourSales)
                        log.debug('extrasTotalBudget', extrasTotalBudget)
                        if (extrasTotalBudget > 0) {
                            rec.setValue({
                                fieldId: 'custrecord_ats_rev_extras_budget',
                                value: extrasTotalBudget
                            })
                        }
                        var grossRevenueBudget = extrasTotalBudget + roomsBudgetTotal;
                        log.debug('grossRevenueBudget', grossRevenueBudget)
                        if (grossRevenueBudget > 0) {
                            rec.setValue({
                                fieldId: 'custrecord_ats_rev_gross_revenue_budget',
                                value: grossRevenueBudget
                            })
                        }
                    }
                    //forecast computation
                    if (forecast === true) {
                        let roomsGP = 0
                        let roomsFB = 0
                        let roomsHB = 0
                        let roomsBB = 0
                        let roomsDR = 0
                        let roomOther = 0
                        let food = 0
                        let bar = 0
                        let extras = 0
                        let curioShop = 0
                        let flightsAndTransfers = 0
                        let parkAndConservancyFees = 0
                        let activitiesAndExcursions = 0
                        let spa = 0
                        let shanga = 0
                        let conferences = 0
                        let tourSales = 0

                        roomsGP = rec.getValue('custrecord33')
                        roomsFB = rec.getValue('custrecord37')
                        roomsHB = rec.getValue('custrecord40')
                        roomsBB = rec.getValue('custrecord43')
                        roomsDR = rec.getValue('custrecord46')
                        let roomsForecastTotal = (roomsGP + roomsFB + roomsBB + roomsDR + roomsHB)
                        if (roomsForecastTotal > 0) {
                            rec.setValue({
                                fieldId: 'custrecord294',
                                value: roomsForecastTotal.toFixed(2)
                            })
                        }
                        roomOther = rec.getValue('custrecord49')
                        food = rec.getValue('custrecord52')
                        bar = rec.getValue('custrecord55')
                        extras = rec.getValue('custrecord61')
                        curioShop = rec.getValue('custrecord64')
                        flightsAndTransfers = rec.getValue('custrecord67')
                        parkAndConservancyFees = rec.getValue('custrecord70')
                        activitiesAndExcursions = rec.getValue('custrecord58')
                        spa = rec.getValue('custrecord73')
                        shanga = rec.getValue('custrecord76')
                        conferences = rec.getValue('custrecord79')
                        tourSales = rec.getValue('custrecord82')
                        let extrasTotalForecast = 0;
                        extrasTotalForecast = (roomOther + food + bar + extras + curioShop + flightsAndTransfers + parkAndConservancyFees + activitiesAndExcursions + spa + shanga + conferences + tourSales)
                        if (extrasTotalForecast > 0) {
                            rec.setValue({
                                fieldId: 'custrecord295',
                                value: extrasTotalForecast.toFixed(2)
                            })
                        }
                        var grossRevenueForeCast = extrasTotalForecast + roomsForecastTotal;
                        if (grossRevenueForeCast > 0) {
                            rec.setValue({
                                fieldId: 'custrecord296',
                                value: grossRevenueForeCast
                            })
                        }
                    }

                } catch (e) {
                    log.error(e.message, rec.id)
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (context) => {


        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
