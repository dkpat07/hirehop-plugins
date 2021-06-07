$(document).ready(function() {
    if (doc_type == 1 && hh_api_version <= 1) {
        var fill_job_fields_original = fill_job_fields;

        fill_job_fields = function() {
            // Call the original function.
            fill_job_fields_original();

            // Change job tabs.
            $("#ui-id-2").html("Job (#" + job_id + " - " + job_data["JOB_NAME"] + ")");
        };
    }
});