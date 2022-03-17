/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {
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
            console.log('Accounting Period' + accountPeriod)
            return accountPeriod;
        }

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(context) {
            var curRec = context.currentRecord;
            if (curRec.type == 'customrecord_ats_mis_revenue') {
                var month = curRec.getText('custrecord_ats_mis_month')
                console.log('Month ' + month)
                var year = curRec.getText('custrecord_ats_mis_year')
                console.log('Year ' + year)
                var monthFinal = month.substring(0, 3);
                var period = monthFinal + " " + year
                console.log(lookForAccPeriod(period))
                var acctPeriod = lookForAccPeriod(period)
                curRec.setValue({
                    fieldId: 'custrecord_ats_accounting_period',
                    value: acctPeriod
                })

            }
            if (curRec.type == 'customrecord_ats_mis_statistic') {
                console.log('Statistic record')
                var misParent = curRec.getText({
                    fieldId: 'custrecord_ats_sta_mis_parent'
                })
                var prop = curRec.getValue('custrecord_ats_sta_property')
                if(misParent) {
                    if (prop != '') {
                        curRec.setText({
                            fieldId: 'custrecord_ats_sta_property',
                            text: misParent
                        })
                    }
                }
                var month = curRec.getText('custrecord_ats_sta_month')
                console.log('Month ' + month)
                var year = curRec.getText('custrecord_ats_sta_year')
                console.log('Year ' + year)
                var monthFinal = month.substring(0, 3);
                var period = monthFinal + " " + year
                console.log(lookForAccPeriod(period))
                var acctPeriod = lookForAccPeriod(period)
                curRec.setValue({
                    fieldId: 'custrecord_ats_sta_accounting_period',
                    value: acctPeriod
                })


            }
            if (curRec.type == 'customrecord_ats_mis_expense') {
                console.log('Expense record')

                    var month = curRec.getText('custrecord_ats_mis_exp_months')
                    console.log('Month ' + month)
                    var year = curRec.getText('custrecord_ats_mis_exp_year')
                    console.log('Year ' + year)
                    var monthFinal = month.substring(0, 3);
                    var period = monthFinal + " " + year
                    console.log(lookForAccPeriod(period))
                    var acctPeriod = lookForAccPeriod(period)
                    curRec.setValue({
                        fieldId: 'custrecord_ats_exp_accounting_period',
                        value: acctPeriod
                    })


            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(context) {
            var curRec = context.currentRecord;
            var getField = context.fieldId
            if (curRec.type == 'customrecord_ats_mis_statistics') {
                console.log('Revenue record')
                if (getField == 'custrecord_ats_mis_month' || getField == 'custrecord_ats_mis_year') {
                    var month = curRec.getText('custrecord_ats_mis_month')
                    console.log('Month ' + month)
                    var year = curRec.getText('custrecord_ats_mis_year')
                    console.log('Year ' + year)
                    var monthFinal = month.substring(0, 3);
                    var period = monthFinal + " " + year
                    console.log(lookForAccPeriod(period))
                    var acctPeriod = lookForAccPeriod(period)
                    curRec.setValue({
                        fieldId: 'custrecord_ats_accounting_period',
                        value: acctPeriod
                    })

                }
            }
            if (curRec.type == 'customrecord_ats_mis_statistic') {
                console.log('Statistic record')
                if (getField == 'custrecord_ats_sta_month' || getField == 'custrecord_ats_sta_year') {
                    var month = curRec.getText('custrecord_ats_sta_month')
                    console.log('Month ' + month)
                    var year = curRec.getText('custrecord_ats_sta_year')
                    console.log('Year ' + year)
                    var monthFinal = month.substring(0, 3);
                    var period = monthFinal + " " + year
                    console.log(lookForAccPeriod(period))
                    var acctPeriod = lookForAccPeriod(period)
                    curRec.setValue({
                        fieldId: 'custrecord_ats_sta_accounting_period',
                        value: acctPeriod
                    })

                }


            }
            if (curRec.type == 'customrecord_ats_mis_expense') {
                console.log('Expense record')
                if (getField == 'custrecord_ats_mis_exp_months' || getField == 'custrecord_ats_mis_exp_year') {
                    var month = curRec.getText('custrecord_ats_mis_exp_months')
                    console.log('Month ' + month)
                    var year = curRec.getText('custrecord_ats_mis_exp_year')
                    console.log('Year ' + year)
                    var monthFinal = month.substring(0, 3);
                    var period = monthFinal + " " + year
                    console.log(lookForAccPeriod(period))
                    var acctPeriod = lookForAccPeriod(period)
                    curRec.setValue({
                        fieldId: 'custrecord_ats_exp_accounting_period',
                        value: acctPeriod
                    })

                }
            }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
        };

    });
