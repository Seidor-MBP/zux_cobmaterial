sap.ui.define(['sap/ui/core/format/NumberFormat'], function (NumberFormat) {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit : function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        formatQuantStock: function(sValue1, sValue2){
			var oNumberFormat = NumberFormat.getFloatInstance({ maxFractionDigits: 3,
                                                                groupingEnabled: true,
                                                                groupingSeparator: ".",
                                                                decimalSeparator: "," });

            if (!sValue1) {
                return "";
            }

            if(!sValue2){
                return oNumberFormat.format(parseFloat(sValue1).toFixed(3));
            }

            return oNumberFormat.format(parseFloat(sValue1).toFixed(3)) + "   " + sValue2;            
        }

    };

});