/**
 * Converts the date retrieve from an input[type=date] element into a DD/MM/YYYY.
 *
 * @param originalDate | Date in the format of YYYY-MM-DD
 * @returns {string}
 */
 window.ethl_convert_date = function ethl_convert_date(originalDate) {
    var date = new Date(originalDate + " 00:00");
    return date.toLocaleDateString("en-GB");
};

window.ethl_capitalise = function(string) {
    if (typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1)
};

window.ethl_convert_value_to_string = function(value) {
    value = value.replace("_", " ");
    value = ethl_capitalise(value);
    return value;
};

window.ethl_format_currency = function(value) {
    return "£" + parseFloat(value, 10).toFixed(2)
};