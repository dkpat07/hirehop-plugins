$(document).ready(function() {
    if (window.save_status !== undefined) {
        var save_status_original = save_status;

        window.save_status = function(value) {
            if (value === 2) { // Confirmed = 2
                send_status_changed_email();
            }

            save_status_original(value);
        };

        window.send_status_changed_email = function() {
            if (job_data === undefined) {
                return;
            }

            Email.send({
                SecureToken : "62a6f00b-87eb-49bc-b7ac-9c149fdf0911",
                To : [job_data.USER_EMAIL, "operations@etherlive.co.uk", "hod@etherlive.co.uk", "accounts@etherlive.co.uk"],
                From : "enms@etherlive.co.uk",
                Subject : "JPS Alert -  CONFIRMED - " + job_data.JOB_NAME,
                Body :
                    "<html>" +
                    "<h1>" + job_data.JOB_NAME + " has been confirmed</h1>" +
                    "<p><span style='font-weight:600;'>Account Manager:</span> " + job_data.USER_NAME + "</p>" +
                    "<p><span style='font-weight:600;'>Customer:</span> " + job_data.NAME + "</p>" +
                    "<p><span style='font-weight:600;'>Outgoing:</span> " + job_data.OUT_DATE + "</p>" +
                    "<p><span style='font-weight:600;'>Job Start:</span> " + job_data.JOB_DATE + "</p>" +
                    "<p><span style='font-weight:600;'>Job Finish:</span> " + job_data.JOB_END + "</p>" +
                    "<p><span style='font-weight:600;'>Returning:</span> " + job_data.RETURN_DATE + "</p>" +
                    "<p><span style='font-weight:600;'>Direct Link:</span> <a href='" + window.location + "'>" + window.location + "</a></p>" +
                    "</html>"
            }).then(
                message => console.log(message)
            );
        };
    }
});