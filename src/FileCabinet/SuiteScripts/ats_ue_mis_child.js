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
                var doubleOccupancyForecast = (bedSoldForecast / roomSoldForecast)
                log.debug('Double occupancy forecast', doubleOccupancyForecast)
                rec.setValue({
                    fieldId: 'custrecord248',
                    value: doubleOccupancyForecast.toFixed(2)
                })

                //Set Value Double Occupancy Budget
                var bedSoldBudget = rec.getValue('custrecord86')
                var roomSoldBudget = rec.getValue('custrecord85')
                var doubleOccupancyBudget = Math.floor((bedSoldBudget / roomSoldBudget) * 100)
                log.debug('Double occupancy budget', doubleOccupancyBudget)
                if (doubleOccupancyBudget) {
                    rec.setValue({
                        fieldId: 'custrecord254',
                        value: doubleOccupancyBudget
                    })
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
