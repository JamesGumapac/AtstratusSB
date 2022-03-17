/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
const PROPERTYSEARCHPARENT = 'customsearch_ats_cogsreport_property'
const REPORTTYPE = ['ALL', 'STATISTIC', 'REVENUE', 'EXPENSE']

//CONSTS Declaration

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/render', 'N/file', 'N/https', 'N/runtime'],
    function (serverWidget, search, redirect, render, file, https, runtime) {
        function onRequest(context) {
            var objResponse = context.response;
            if (context.request.method == 'GET') {

                if (context.request.parameters.generateExcel) {
                    var fileHolderGenerated = file.load({
                        id: 43318
                    });

                    objResponse.writeFile({
                        file: fileHolderGenerated,
                        isInline: false
                    })

                    return;
                }

                var form = serverWidget.createForm({
                    title: 'Test Search',
                    hideNavBar: false
                });
                form.addFieldGroup({
                    id: 'custpage_available_filter',
                    label: 'Filters'
                });
                var propertyFilter = [];
                var propertyList = [];
                //xg Insert Filters via Page URL Calls - Parameters - Pass values to Runsearch
                var subHolder = '';
                var subsidiary = form.addField({
                    id: 'custpage_subsidiary_filter',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'SUBSIDIARY',
                    source: 'subsidiary',
                    container: 'custpage_available_filter'

                });
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
                form.clientScriptFileId = 43319;
                var accountingPeriod = form.addField({
                    id: 'custpage_accounting_period',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Accounting Period',
                    source: '-105', //accounting period
                    container: 'custpage_available_filter'
                });

                var accountingBooks = form.addField({
                    id: 'custpage_accounting_books',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Accounting Books',
                    source: '-253', //accounting books
                    container: 'custpage_available_filter'
                });
                var reportType = form.addField({
                    id: 'custpage_report_type',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Report Type',
                    container: 'custpage_available_filter'
                });
            for (var i = 0; i <REPORTTYPE.length; i++) {
                reportType.addSelectOption({
                    value: i,
                    text: REPORTTYPE[i]
                })
                }
                var searchHolder = search.load({
                    id: 'customsearch264'
                });
                //test
                var objHolder = {};
                objHolder['firstSearch'] = [];
                // Manual placement of Title
                // objHolder['firstSearch'].push({
                //     "misCategory":"REVENUE CATEGORY",
                //     "misNoOFDays": "NO OF DAYS",
                //     "misRoomsAvail" : "ROOMS AVAILABLE",
                //     "misRoomsSold" : "ROOMS SOLD",
                //     "misActual":"ACTUAL",
                //     "misBudget":"BUDGET"
                // });

                // object Conversion
                searchHolder.run().each(function (result) {
                    log.audit('title', JSON.stringify(result));
                    var misCategory = result.getText({
                        name: 'custrecord_ats_rev_category',
                        summary: search.Summary.GROUP
                    });


                    var misNoOFDays = result.getValue({
                        name: 'custrecord_ats_mis_num_of_days',
                        summary: search.Summary.SUM
                    });

                    var misRoomsAvail = result.getValue({
                        name: 'custrecord_ats_mis_rooms_available',
                        summary: search.Summary.SUM
                    });

                    var misRoomsSold = result.getValue({
                        name: 'custrecord_ats_mis_rooms_sold',
                        summary: search.Summary.SUM
                    });

                    var misActual = result.getValue({
                        name: 'custrecord_ats_mis_actual',
                        summary: search.Summary.GROUP
                    });

                    var misBudget = result.getValue({
                        name: 'custrecord_ats_mis_budget',
                        summary: search.Summary.GROUP
                    });

                    //defining static for test
                    misRoomsAvail = 20;
                    misRoomsSold = 30;

                    objHolder['firstSearch'].push({
                        "misCategory": misCategory,
                        "misNoOFDays": misNoOFDays,
                        "misRoomsAvail": misRoomsAvail,
                        "misRoomsSold": misRoomsSold,
                        "misActual": misActual,
                        "misBudget": misBudget,
                        //add filler part
                        "misSpaceCreation": ' ',
                        "fillerB": misCategory,
                        "fillerC": misNoOFDays,
                        "fillerD": misRoomsAvail,
                        "fillerE": misRoomsSold,
                        "fillerF": misActual,
                        "fillerG": misBudget
                    });

                    return true;
                });

                // Add 2nd layer for display purposes

                objHolder['firstSearch'].push({
                    "misCategory": '',
                    "misNoOFDays": '',
                    "misRoomsAvail": '',
                    "misRoomsSold": '',
                    "misActual": '',
                    "misBudget": '',
                    //add filler part
                    "misSpaceCreation": ' ',
                    "fillerB": '',
                    "fillerC": '',
                    "fillerD": '',
                    "fillerE": '',
                    "fillerF": '',
                    "fillerG": ''
                });

                searchHolder.run().each(function (result) {
                    log.audit('title', JSON.stringify(result));
                    var misCategory = result.getText({
                        name: 'custrecord_ats_rev_category',
                        summary: search.Summary.GROUP
                    });


                    var misNoOFDays = result.getValue({
                        name: 'custrecord_ats_mis_num_of_days',
                        summary: search.Summary.SUM
                    });

                    var misRoomsAvail = result.getValue({
                        name: 'custrecord_ats_mis_rooms_available',
                        summary: search.Summary.SUM
                    });

                    var misRoomsSold = result.getValue({
                        name: 'custrecord_ats_mis_rooms_sold',
                        summary: search.Summary.SUM
                    });

                    var misActual = result.getValue({
                        name: 'custrecord_ats_mis_actual',
                        summary: search.Summary.GROUP
                    });

                    var misBudget = result.getValue({
                        name: 'custrecord_ats_mis_budget',
                        summary: search.Summary.GROUP
                    });

                    //defining static for test
                    misRoomsAvail = 20;
                    misRoomsSold = 30;

                    objHolder['firstSearch'].push({
                        "misCategory": misCategory,
                        "misNoOFDays": misNoOFDays,
                        "misRoomsAvail": misRoomsAvail,
                        "misRoomsSold": misRoomsSold,
                        "misActual": misActual,
                        "misBudget": misBudget,
                        //add filler part
                        "misSpaceCreation": ' ',
                        "fillerB": misCategory,
                        "fillerC": misNoOFDays,
                        "fillerD": misRoomsAvail,
                        "fillerE": misRoomsSold,
                        "fillerF": misActual,
                        "fillerG": misBudget
                    });

                    return true;
                });


                log.audit('JSON Sample Holder', JSON.stringify(objHolder));

                var genFile = genExcelXMLFile(objHolder, 43315);

                form.addButton({
                    id: 'custpage_previous',
                    label: 'Test Generate Excel File',
                    functionName: 'generateExcelFile()'
                });

                context.response.writePage(form);


            }
        }

        function genExcelXMLFile(objArr, tempId) {

            var renderer = render.create();
            var dtNow = new Date();
            var fileTemplate = file.load({
                id: tempId
            });

            renderer.templateContent = fileTemplate.getContents();

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: objArr
            })

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'date',
                data: {'now': dtNow.toISOString()}
            })


            var fileXLSXML = file.create({
                name: 'ATS TEST GENFILE' + '.xls',
                fileType: file.Type.XMLDOC,
                contents: renderer.renderAsString()
            })
            fileXLSXML.folder = 40970;
            var fileId = fileXLSXML.save();

            return fileId;

        }

        return {
            onRequest: onRequest
        };


    });