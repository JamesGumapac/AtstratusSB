/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50;
var SEARCH_ID = 'customsearch_ats_consumption_cogs_3';
const PROPERTYSEARCH = 'customsearch273';
const PROPERTYSEARCHPARENT = 'customsearch_ats_cogsreport_property'
var COSGACCOUNTSEARCH = 'customsearch_cogsaccount_search';
var STORETYPESEARCH = 'customsearch_ats_property_search';
const COGSFOLDER = 161256; //COGS Folder
const DEFAULTEMAILSENDER = '15039';
const mapReduceId = 'customscript_ats_mr_generate_cogs_report';
const mapReduceDeployment = 'customdeploy_ats_mr_generate_cogs_report';


var CLIENT_SCRIPT_FILE_ID = 166884;

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/url', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/task'],
    function (serverWidget, search, redirect, url, record, email, runtime, file, task) {
        function onRequest(context) {
            if (context.request.method == 'GET') {
                var userObj = runtime.getCurrentUser();
                var userSubsidiary = userObj.subsidiary
                var userRole = userObj.role;
                log.debug('User Role ', userRole)
                log.debug('User Subsidiary ', userSubsidiary)
                var form = serverWidget.createForm({
                    title: 'CONSUMPTION REPORT FOR SPECIFIC ACTIVITY',
                    hideNavBar: false
                });

                form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;

                // Get parameters
                var pageId = parseInt(context.request.parameters.page);
                var scriptId = context.request.parameters.script;
                var deploymentId = context.request.parameters.deploy;
                var subs = context.request.parameters.subsidiary;

                var propertyFilter = [];
                var propertyList = [];
                //xg Insert Filters via Page URL Calls - Parameters - Pass values to Runsearch
                var subHolder = '';
                var accHolder = '';
                var objParametersToProcess = checkProcessedParameters(context.request.parameters);
                if (context.request.parameters.subsidiary) {

                    subHolder = decodeURIComponent(context.request.parameters.subsidiary);
                    subHolder = JSON.parse(subHolder) == '' ? '' : JSON.parse(subHolder);
                }
                if (context.request.parameters.account) {

                    accHolder = decodeURIComponent(context.request.parameters.account);
                    log.audit('account test', JSON.stringify(accHolder));
                    accHolder = JSON.parse(accHolder) == '' ? '' : JSON.parse(accHolder);
                }

                form.addFieldGroup({
                    id: 'custpage_available_filter',
                    label: 'Filters'
                });

                var startDate = form.addField({
                    id: 'custpage_startdate_filter',
                    type: serverWidget.FieldType.DATE,
                    label: 'From',
                    container: 'custpage_available_filter'

                });

                var endDate = form.addField({
                    id: 'custpage_enddate_filter',
                    type: serverWidget.FieldType.DATE,
                    label: 'To',
                    container: 'custpage_available_filter'

                });
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["internalid", "anyof", userSubsidiary]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                if (userRole == 3 || userRole == 1006) {
                    var subsidiary = form.addField({
                        id: 'custpage_subsidiary_filter',
                        type: serverWidget.FieldType.MULTISELECT,
                        label: 'SUBSIDIARY',
                        source: 'subsidiary',
                        container: 'custpage_available_filter'

                    });
                } else if(userRole == 1012 || 1011) {
                    var subsidiary = form.addField({
                        id: 'custpage_subsidiary_filter',
                        type: serverWidget.FieldType.MULTISELECT,
                        label: 'SUBSIDIARY',
                        container: 'custpage_available_filter'

                    });

                    subsidiarySearchObj.run().each(function (result) {
                        subsidiary.addSelectOption({
                            value: result.id,
                            text: result.getValue({
                                name: 'name'
                            })
                        })
                        return true;
                    });

                }

                if(userRole == 1025){
                    var safariCoAccountantTanzania = ['14', '23', '24', '40', '55', '19', '20', '35', '36', '37', '53', '29', '30', '31', '32', '33', '17']
                    var tanzaniaSubsidiarySearchObj = search.create({
                        type: "subsidiary",
                        filters:
                            [
                                ["internalid", "anyof", safariCoAccountantTanzania]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                })
                            ]
                    });
                    tanzaniaSubsidiarySearchObj.run().each(function (result) {

                        subsidiary.addSelectOption({
                            value: result.id,
                            text: result.getValue({
                                name: 'name'
                            })
                        })
                        return true;
                    });

                }
                if(userRole == 1010){
                    var safariCoAccountantKenya = ['11', '56', '14', '23', '41', '42', '51', '21', '47', '44', '49', '50', '46', '48', '45', '43', '26', '27']
                    var kenyaSubsidiarySearchObj = search.create({
                        type: "subsidiary",
                        filters:
                            [
                                ["internalid", "anyof", safariCoAccountantKenya]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                })
                            ]
                    });
                    kenyaSubsidiarySearchObj.run().each(function (result) {
                        subsidiary.addSelectOption({
                            value: result.id,
                            text: result.getValue({
                                name: 'name'
                            })
                        })
                        return true;
                    });
                }


                subsidiary.updateDisplaySize({
                    height: 10,
                    width: 500
                });


                var property = form.addField({
                    id: 'custpage_location_filter',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'PROPERTY',
                    container: 'custpage_available_filter'
                });


                var storeType = form.addField({
                    id: 'custpage_storetype_filter',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'STORE TYPE',
                    container: 'custpage_available_filter'
                });

                var consolidateWithSubProp = form.addField({
                    id: 'custpage_consolidatewithsubprop_filter',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Consolidate with sub properties',
                    container: 'custpage_available_filter'
                })

                //consolidateWithSubProp


                var account = form.addField({
                    id: 'custpage_account_filter',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'ACCOUNT',
                    container: 'custpage_available_filter'

                });


                account.updateDisplaySize({
                    height: 10,
                    width: 500
                });
                // Property Search
                var propertySearch = search.load({
                    id: PROPERTYSEARCHPARENT
                });

                subHolder ? propertySearch.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: subHolder
                })) : false;


                propertySearch.run().each(function (result) {
                    var pSearchName = result.getValue({
                        name: 'name'
                    });
                    var pSearchIintId = result.id;
                    //push to property filter
                    propertyFilter.push(pSearchIintId);
                    propertyList.push(pSearchIintId)
                    property.addSelectOption({
                        value: pSearchIintId,
                        text: pSearchName
                    })
                    return true;
                });

                // Account Search
                if (accHolder) {
                    var cogsSearch = search.load({
                        id: COSGACCOUNTSEARCH
                    });

                    cogsSearch.filters.push(search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: accHolder
                    }));

                    var searchResultCount = cogsSearch.runPaged().count;
                    if (searchResultCount > 0) {
                        cogsSearch.run().each(function (result) {
                            var accountname = result.getValue({
                                name: 'displayname'
                            });
                            var internalId = result.id;
                            account.addSelectOption({
                                value: internalId,
                                text: accountname
                            })
                            return true;
                        });
                    }

                }


                // Store Type Search
                var storeTypeSearch = search.load({
                    id: STORETYPESEARCH
                });

                subHolder ? storeTypeSearch.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: subHolder
                })) : false;

                var storeTypeList = new Array()
                storeTypeSearch.run().each(function (result) {

                    var stSearchName = result.getText({
                        name: 'custrecord_ats_store_type'
                    });
                    log.debug('stSearchName', stSearchName)
                    var stSearchIintId;
                    //switch for the list of store Internal ID
                    switch (stSearchName) {
                        case 'Admin Consumption':
                            stSearchIintId = 1;
                            break;
                        case 'Bar Consumption':
                            stSearchIintId = 2;
                            break;
                        case 'Bar Store':
                            stSearchIintId = 3;
                            break;
                        case 'Canteen Consumption':
                            stSearchIintId = 4;
                            break;
                        case 'Curio Shop Consumption':
                            stSearchIintId = 5;
                            break;
                        case 'Fuel Consumption':
                            stSearchIintId = 6;
                            break;
                        case 'Housekeeping Consumption':
                            stSearchIintId = 7;
                            break;
                        case 'Kitchen Consumption':
                            stSearchIintId = 8;
                            break;
                        case 'Main Store':
                            stSearchIintId = 9;
                            break;
                        case 'Maintenance Consumption':
                            stSearchIintId = 10;
                            break;
                        case 'Refurb Store':
                            stSearchIintId = 11;
                            break;


                        default:
                            text = "No value found";
                    }
                    //push the results to the array
                    storeTypeList.push({
                        'value': stSearchIintId,
                        'text': stSearchName
                    })
                    log.debug('stSearchIintId', stSearchIintId)

                    return true;
                });
                log.debug('StoreType LIST', storeTypeList)

                //function to remove duplicate store Type
                function removeDuplicates(originalArray, prop) {
                    var newArray = [];
                    var lookupObject = {};

                    for (var i in originalArray) {
                        lookupObject[originalArray[i][prop]] = originalArray[i];
                    }

                    for (i in lookupObject) {
                        newArray.push(lookupObject[i]);
                    }
                    return newArray;
                }

                const storeTypeListUnique = removeDuplicates(storeTypeList, "value");
                log.debug('StoreType Unique Val', storeTypeListUnique)

                //Display the Results in the store Type field

                for (var i = 0; i < storeTypeListUnique.length; i++) {
                    log.debug(' Store Type Value ', storeTypeListUnique[i]['value']);
                    log.debug(' Store Type Text ', storeTypeListUnique[i]['text']);
                    storeType.addSelectOption({

                        value: storeTypeListUnique[i]['value'],
                        text: storeTypeListUnique[i]['text']

                    })

                }

                // Add sublist that will show results
                // var sublist = form.addSublist({
                //     id: 'custpage_table',
                //     type: serverWidget.SublistType.LIST,
                //     label: 'Transactions'
                // });
                //
                // // Add columns to be shown on Page
                //
                // sublist.addField({
                //     id: 'accountmain',
                //     label: 'COGS / EXPENSE ACCOUNT',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'subsidiary',
                //     label: 'subsidiary',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'property',
                //     label: 'Property Name',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'trandate',
                //     label: 'Transaction Date',
                //     type: serverWidget.FieldType.DATE
                // });
                //
                // sublist.addField({
                //     id: 'tranid',
                //     label: 'Transaction Reference',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                //
                // sublist.addField({
                //     id: 'item',
                //     label: 'item',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'itemclass',
                //     label: 'Item Class',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'itemqty',
                //     label: 'Item Quantity',
                //     type: serverWidget.FieldType.TEXT
                // });
                //
                // sublist.addField({
                //     id: 'formulacol',
                //     label: 'SUM OF ITEM COST',
                //     type: serverWidget.FieldType.FLOAT
                // });
                //
                //
                // sublist.addField({
                //     id: 'amount',
                //     label: 'SUM OF AMOUNT',
                //     type: serverWidget.FieldType.CURRENCY
                // });

                // form.addButton({
                //     id: 'custpage_filter',
                //     label: 'Filter',
                //     functionName: 'runSearch(' + SEARCH_ID + ', ' + PAGE_SIZE + ')'
                // });

                form.addButton({
                    id: 'custpage_generate_csv',
                    label: 'Generate CSV',
                    functionName: 'generateReportToCSV'
                });

                form.addButton({
                    id: 'custpage_clearfilter',
                    label: 'Clear Filter',
                    functionName: 'clearFilter'
                });

                form.addButton({
                    id: 'custpage_addaccount',
                    label: 'Select Account',
                    functionName: 'redirectToAccountPage'
                });


                // Run search and determine page count
                //  in cs
                //  var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

                // Set pageId to correct value if out of index
                if (!pageId || pageId == '' || pageId < 0)
                    pageId = 0;
                else if (pageId >= pageCount)
                    pageId = pageCount - 1;

                // Add buttons to simulate Next & Previous
                //  if (pageId != 0) {
                //      form.addButton({
                //          id: 'custpage_previous',
                //          label: 'Previous',
                //          functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
                //      });
                //  }

                //  if (pageId != pageCount - 1) {
                //      form.addButton({
                //          id: 'custpage_next',
                //          label: 'Next',
                //          functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
                //      });
                //  }

                //   Add drop-down and options to navigate to specific page
                //  var selectOptions = form.addField({
                //    id: 'custpage_pageid',
                //      label: 'Page Index',
                //      type: serverWidget.FieldType.SELECT
                //  });

                //  for (i = 0; i < pageCount; i++) {
                //      if (i == pageId) {
                //          selectOptions.addSelectOption({
                //              value: 'pageid_' + i,
                //              text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                //              isSelected: true
                //          });
                //      } else {
                //          selectOptions.addSelectOption({
                //              value: 'pageid_' + i,
                //              text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                //          });
                //      }
                //  }

                // Get subset of data to be shown on page
                //var addResults = fetchSearchResult(retrieveSearch, pageId);

                // Set data returned to columns
                var j = 0;
                //  if (addResults != false) {

                // addResults.forEach(function (result) {
                //     var output = url.resolveRecord({
                //         recordType: record.Type.INVENTORY_ADJUSTMENT,
                //         recordId: result.internalid,
                //         isEditMode: false
                //     });
                //     var tranlink = ' <h1> <a href="' + output + '">' + result.tranid + '</a> </h1>'
                //     //log.debug('tranlink', tranlink)
                //
                //     sublist.setSublistValue({
                //         id: 'accountmain',
                //         line: j,
                //         value: result.accountmain
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'subsidiary',
                //         line: j,
                //         value: result.subsidiary
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'property',
                //         line: j,
                //         value: result.property
                //     });
                //
                //
                //     sublist.setSublistValue({
                //         id: 'trandate',
                //         line: j,
                //         value: result.trandate
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'tranid',
                //         line: j,
                //         value: tranlink
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'item',
                //         line: j,
                //         value: result.item
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'itemclass',
                //         line: j,
                //         value: result.itemclass
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'itemqty',
                //         line: j,
                //         value: result.itemqty
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'formulacol',
                //         line: j,
                //         value: result.formulacol
                //     });
                //
                //     sublist.setSublistValue({
                //         id: 'amount',
                //         line: j,
                //         value: result.amount
                //     });
                //
                //     j++;
                // });
                //  }


                context.response.writePage(form);
            }
            // POST - for moving to Restlet
            else {
                if (context.request.parameters.sendEmail) {
                    log.audit('csvContent body ', context.request.body);
                    var csvContent = decodeURIComponent(context.request.body);
                    sendEmailWithFile(csvContent);

                    return true;
                } else if (context.request.parameters.getFieldsForProcessing) {

                    try {
                        var getFieldsForProcessing = context.request.parameters.getFieldsForProcessing;
                        log.audit('parameters content ', JSON.stringify(context.request.parameters));
                        log.audit('check mr filters', JSON.stringify(getFieldsForProcessing))
                        var objTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: mapReduceId,
                            deploymentId: mapReduceDeployment,
                            params: {
                                'custscript_ats_cogs_config_report': getFieldsForProcessing
                            }
                        });
                        var objTaskId = objTask.submit();
                        context.response("PROCESSED");
                        return context.response("PROCESSED");
                    }
                    catch (e) {
                        if (e.name == 'MAP_REDUCE_ALREADY_RUNNING') {
                            return "PROCESSEDFAILED";
                        }
                    }

                }
            }
        }

        return {
            onRequest: onRequest
        };

        // Filter masterlist for Runsearch
        function checkProcessedParameters(paramsObjectHolder) {
            var objParametersToProcess = {};
            if (paramsObjectHolder.subsidiary) {
                objParametersToProcess['subsidiary'] = JSON.parse(decodeURIComponent(paramsObjectHolder.subsidiary));
            }

            if (paramsObjectHolder.startdate) {
                objParametersToProcess['startdate'] = JSON.parse(decodeURIComponent(paramsObjectHolder.startdate));
            }

            if (paramsObjectHolder.enddate) {
                objParametersToProcess['enddate'] = JSON.parse(decodeURIComponent(paramsObjectHolder.enddate));
            }

            if (paramsObjectHolder.account) {
                objParametersToProcess['accountmain'] = JSON.parse(decodeURIComponent(paramsObjectHolder.account));
            }

            if (paramsObjectHolder.location) {
                objParametersToProcess['location'] = JSON.parse(decodeURIComponent(paramsObjectHolder.location));
            }


            //  if(paramsObjectHolder.storeType){
            //      objParametersToProcess['custrecord_ats_store_type'] = JSON.parse(decodeURIComponent(paramsObjectHolder.storeType));

            //  }
            if (paramsObjectHolder.consolidateSubProp) {
                objParametersToProcess['consolidateSubProp'] = JSON.parse(decodeURIComponent(paramsObjectHolder.consolidateSubProp));
            }

            return objParametersToProcess;
        }

        function sendEmailWithFile(strContent) {
            var userObj = runtime.getCurrentUser();
            var userId = userObj.id;

            //Static Folder
            var fileID = file.create({
                name: 'COGS_IA_Report_' + getDateNow() + '.csv',
                fileType: file.Type.CSV,
                contents: strContent,
                folder: COGSFOLDER
            });
            //static Author
            email.send({
                author: DEFAULTEMAILSENDER,
                recipients: userId,
                subject: 'COGS_IA_Report ' + getDateNow(),
                body: 'See report attached below',
                attachments: [fileID]
            });
            log.audit('Email SENT', 'Email sent to: ' + userObj.email);
        }

        function getDateNow() {
            var dateHolder = new Date,
                dateFormat = [dateHolder.getMonth() + 1,
                        dateHolder.getDate(),
                        dateHolder.getFullYear()].join('_') + '_' +
                    [dateHolder.getHours(),
                        dateHolder.getMinutes()].join('_')
            return dateFormat;
        }
    });