/** GLOBAL PLUGIN VARS **/
var ethl_forecast_probability_status = 'ETHL_FORECAST_PROBABILITY_STATUS';
var ethl_forecast_probability_field = 'ETHL_FORECAST_PROBABILITY';
var ethl_forecast_probability_statuses = {
    lead: {
        name: 'Lead',
        value: 'lead',
        percentage: null
    },
    75: {
        name: "75%",
        value: "75",
        percentage: 75
    },
    provisional: {
        name: 'Provisional',
        value: 'provisional',
        percentage: 75
    },
    booked: {
        name: 'Booked',
        value: 'booked',
        percentage: 100
    },
    prepped: {
        name: 'Prepped',
        value: 'prepped',
        percentage: 100
    }
};

/**
 * ------------------------------------
 * JOB EDIT FORECAST PROBABILITY
 * ------------------------------------
 */

/**
 * job_edit widget
 */
$(document).ready(function(){

    if(typeof($.custom.job_edit)!='undefined' && hh_api_version<=1) {
        $.widget('custom.job_edit', $.custom.job_edit, {
            _init_main: function() {
                // Call the old _init_main
                this._super(arguments);

                /**
                 * Etherlive Job Status field.
                 *
                 * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
                 */
                var ethl_job_status = $('<tr>')
                    .append($('<td>', { html: 'Probability Status:' }))
                    .append($('<td>')
                        .append($('<select>', {
                                'id':           'ethl_job_status',
                                'style':        'width: 300px;',
                            })
                        )
                    );
                $.each(ethl_forecast_probability_statuses, function(key, status){
                    $("<option>",{
                        text: status.name,
                        value: status.value
                    }).appendTo(ethl_job_status.find('select'));
                });

                ethl_job_status.on('change', function() {
                    var selectedValue = $(this).find('option:selected').val();
                    var selectedStatus = ethl_forecast_probability_statuses[selectedValue];

                    var forecastProbabilityField = $('#ethl_forecast_probability_edit');
                    forecastProbabilityField.val(selectedStatus.percentage);
                    forecastProbabilityField.prop('disabled', selectedStatus.percentage !== null)
                });

                /**
                 * Etherlive Forecast Probability field.
                 *
                 * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
                 */
                var ethl_forecast_probability_edit = $('<tr>')
                    .append($('<td>', { html: 'Probability (%):' }))
                    .append($('<td>')
                        .append($('<input>', {
                                'id':           'ethl_forecast_probability_edit',
                                'name':         'custom_index',
                                'class':        'data_cell',
                                'data-field':   'CUSTOM_INDEX',
                                'type':         'number',
                                'max':          '100',
                                'min':          '1',
                                'step':         '1',
                                'style':        'width: 300px;',
                                'required':     'required'
                            })
                        )
                    );

                this.ethl_job_status = ethl_job_status.insertAfter(this.job_type.closest('tr'));
                this.ethl_forecast_probability_edit = ethl_forecast_probability_edit.insertAfter(this.ethl_job_status.closest('tr'));
            },

            fill_job_edit: function() {
                // Call the old fill_job_edit
                this._super();

                // Retrieve any custom fields that already exist.
                var custom_fields = job_data["fields"];

                // Retrieve the forecast probability and set the field.
                var jobStatus = custom_fields[ethl_forecast_probability_status];

                if (jobStatus) {
                    // Set field values.
                    this.ethl_job_status.find('option[value=' + jobStatus.value + ']').prop('selected', true);
                    // this.ethl_forecast_probability_edit.find('input').val(jobForecastProbability.value);
                    this.ethl_forecast_probability_edit.find('input').prop('disabled', ethl_forecast_probability_statuses[jobStatus.value].percentage != null)
                }
            },

            save_job_form: function() {
                // Retrieve fields.
                var custom_fields           = this.fields.data('fields');
                var jobStatus               = this.ethl_job_status.find('option:selected').val();
                // var jobForecastProbability  = this.ethl_forecast_probability_edit.find('input').val();

                // Create new field object.
                var new_fields = {};
                new_fields[ethl_forecast_probability_status] = {
                    'type': 'text',
                    'value': jobStatus
                };
                // new_fields[ethl_forecast_probability_field] = {
                //     'type': 'text',
                //     'value': jobForecastProbability
                // };

                // Merge with existing fields.
                $.extend(custom_fields, new_fields);

                // Set newly merged fields.
                this.fields.data('fields', custom_fields);

                // Call super.
                this._super(arguments);
            }
        });
    }
});

/**8
 * ------------------------------------
 * FORECAST PROBABILITY MAIN
 * ------------------------------------
 */


/**
 * Hook fill_job_fields function.
 */
$(document).ready(function() {
    if (doc_type == 1 && hh_api_version<=1) {
        /**
         *  Add our forecast probability element.
         */
        var ethl_forecast_probability = $('<tr>', { 'id': 'ethl_forecast_probability' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Probability'}))
            .append($('<td>', { 'class': 'data_cell', html: '75' })
                .data('field', ethl_forecast_probability_field)
                .attr('data-field', ethl_forecast_probability_field)
            );

        ethl_forecast_probability.insertAfter($('#job_type'));


        var fill_job_fields_original = fill_job_fields;

        fill_job_fields = function() {
            // Call the original function.
            fill_job_fields_original();

            $("#details_tab .data_cell, .job_header .data_cell").each(function() {
                var field_name = $(this).data('field');

                if (field_name == ethl_forecast_probability_field) {
                    // TODO: Check exists and is valid.
                    var field_value = job_data['CUSTOM_INDEX'];

                    $(this).html(field_value ? field_value + '%' : 'N/A');
                }
            });
        }
    }
});

/**
 * ------------------------------------
 * FORECAST PROBABILITY SEARCH COLUMN
 * ------------------------------------
 */

$(document).ready(function() {
    if (doc_type == 0 && hh_api_version <= 1) {

        /**
         *  Show CUSTOM_INDEX search column to display our forecast probability.
         */
        lang["customIndexTxt"] = "Forecast Probability";
        // Show the custom index search
        $("#custom_index_search").css("display", "inline-block");
        // Make the custom index input numbers only
        $("#custom_index_input").addClass("num_search").attr("type", "tel");
        // Add the CUSTOM_INDEX column to search results
        allSearchCols.push("CUSTOM_INDEX");

        /**
         * Attempts to return the job ID from the provided rowData.
         *
         * @param rowData
         * @returns {string|boolean} False if the row is not a job specific row.
         */
        function get_job_id(rowData) {
            var id = rowData.ID;
            var indicator = id.substr(0, 1);

            // Check if this is not a job.
            if (indicator.toLowerCase() !== 'j') {
                return false;
            }

            return id.substr(1, id.length);
        }

        /**
         * Calculates the total revenue from the provided JSON supply list.
         *
         * @param itemSupplyList
         * @returns {number}
         */
        function calculate_revenue_total(itemSupplyList) {
            var total = 0;

            for (var i = 0; i < itemSupplyList.length; i++) {
                var item = itemSupplyList[i];

                if (item.kind == 2 || item.kind == 3 || item.kind == 4) {
                    total += parseInt(item.PRICE);
                }
            }

            return total;
        }

        /**
         * Retrieves the associated supply list for the current row and updates the column value.
         *
         * @param grid
         * @param rowId
         */
        function set_forecast_column(grid, rowId) {
            var rowData = grid.jqGrid('getRowData', rowId);
            var forecastColumnValue = rowData.CUSTOM_INDEX;

            // Get the job ID, set to false if this is not a job.
            var jobId = get_job_id(rowData);

            // Check if the column value contains a forecast probability.
            if (jobId && forecastColumnValue != undefined && forecastColumnValue != '') {
                $.ajax({
                    type: 'POST',
                    url: '/frames/items_to_supply_list.php',
                    data: 'id=' + jobId + '&job=' + jobId,
                    dataType: 'json',
                    success: function(response) {
                        console.log(response);
                        var total_revenue = calculate_revenue_total(response);
                        var forecast_revenue = total_revenue * (forecastColumnValue / 100);
                        var formattedColumnValue  = forecastColumnValue + '% @ Â£' + forecast_revenue.toFixed(2);

                        grid.jqGrid('setCell', rowId, 'CUSTOM_INDEX', formattedColumnValue);
                    }
                });
            }
        }

        // Hook our reload search function so we can change the values once populated.
        reload_search_grid = function(search_params) {
            var forcastedRows = [];

            $("#search_results")
                .jqGrid("setGridParam", {postData: null}) // Clear old post data
                .jqGrid("setGridParam", {
                    postData:search_params,
                    datatype:'json',
                    url:"/frames/search_field_results.php",
                    gridComplete: function() {
                        var grid = $(this);
                        var rows = grid.jqGrid('getDataIDs');

                        for (var i = 0; i < rows.length; i++) {
                            var rowId = rows[i];

                            if (!forcastedRows.includes(rowId)) {
                                set_forecast_column(grid, rowId)
                                forcastedRows.push(rowId);
                            }
                        }
                    }
                } );

            $("#gs_JOB_NAME, #gs_VENUE, #gs_MANAGER, #gs_MANAGER2, #gs_DEPOT, #gs_JOB_TYPE, #gs_CLIENT_REF, #gs_CLIENT, #gs_COMPANY").change(); // Forces a reload

        }

    }
});