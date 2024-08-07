sap.ui.define([
	"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Constants",
	"sap/ui/core/IconPool",
	"sap/ui/core/ValueState",
	"sap/ui/core/MessageType"
], function (Constants, IconPool, ValueState, MessageType) {
	"use strict";

	return {

		/**
		 * Return icon src based on the distribution line status.
		 * @param {string} sStatus distribution line status code
		 * @return {string} icon src
		 * @public
		 */
		getDistrStatusIcon: function (sStatus) {
			switch (sStatus) {
			case Constants.CONTRACT_STATUS.IN_PREPARATION:
			case Constants.CONTRACT_STATUS.IN_APPROVAL:
				return IconPool.getIconURI("status-critical");
			case Constants.CONTRACT_STATUS.RELEASE_COMPLETED:
				return IconPool.getIconURI("status-positive");
			default:
				return undefined;
			}
		},

		/**
		 * Return status state based on the distribution line status.
		 * @param {string} sStatus distribution line status code
		 * @return {sap.ui.core.ValueState} icon color
		 * @public
		 */
		getDistrStatusState: function (sStatus) {
			switch (sStatus) {
			case Constants.CONTRACT_STATUS.IN_PREPARATION:
			case Constants.CONTRACT_STATUS.IN_APPROVAL:
				return ValueState.Warning;
			case Constants.CONTRACT_STATUS.RELEASE_COMPLETED:
				return ValueState.Success;
			default:
				return ValueState.None;
			}
		},

		/**
		 * Format Boolean value. Return 'Yes' || 'No' string.
		 * @param {boolean} bValue boolean value
		 * @param {sap.base.i18n.ResourceBundle} oResBundle resource bundle
		 * @return {string} 'Yes' || 'No' string
		 */
		formatBooleanValue: function (bValue, oResBundle) {
			return bValue ? oResBundle.getText("YesText") : oResBundle.getText("NoText");
		},

		/**
		 * Format decimal value.
		 * @param {string} sValue decimal value
		 * @return {string} decimal value or empty string
		 * @public
		 */
		formatDecimalEmptyValue: function (sValue) {
			var sResValue = sValue;
			if (sResValue) {
				sResValue = sResValue.replaceAll(",", "");
				sResValue = +sResValue === 0 ? "" : sResValue;
			}
			return sResValue;
		},

		/**
		 * Format editable state for percentage cost fields based on PaymentModel.
		 * In case of 'Bailment' Payment Model - set disable.
		 * @param {string} sPaymentModel Payment Model code
		 * @return {boolean} true | false value
		 */
		formatPercentageCostEnableState: function (sPaymentModel) {
			return sPaymentModel === Constants.BAILMENT_PAYMENT_MODEL_CODE ? false : true;
		},

		/**
		 * Return column list item highlight color. Formatter is used.
		 * @param {string} sStatus contract line status code
		 * @return {sap.ui.core.MessageType} color
		 * @public
		 */
		getDistributionLineColor: function (sStatus) {
			if (sStatus === Constants.CONTRACT_STATUS.IN_PREPARATION || sStatus === Constants.CONTRACT_STATUS.IN_APPROVAL) {
				return MessageType.Warning;
			} else {
				return MessageType.None;
			}
		},
		/*
		 * formatter method for Visible property overall Quota pop up on item level 
		 * @param {string} Editable property maintained for the view
		 * @param {string} Current View property maintained for the view
		 * @return {boolean} value
		 */
		onOverallQuotaFormatter: function (sEditable, sCurrentView) {
			if (!sEditable && (sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM || sCurrentView === Constants.VIEW_ID.ITEM)) {
				return true;
			}
			return false;
		},
		/*
		 * formatter method for Visible property overall Quota pop up on Distribution level 
		 * @param {string} Editable property maintained for the view
		 * @param {string} Current View property maintained for the view
		 * @return {boolean} value
		 */
		onOverallQuotaDistributionFormatter: function (sEditable, sCurrentView) {
			if (sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION || sCurrentView === Constants.VIEW_ID.DISTRIBUTION) {
				return true;
			} else if (sEditable) {
				return true;
			}
			return false;
		},
		/*
		 * formatter method for  overall Quota  on item level Icon Status
		 * @param {string} Status maintianed for Overal Quota
		 * @return {string} icon src
		 * @public
		 */
		getOveralQuotaIconFormatter: function (sQuotaStatus) {
			switch (sQuotaStatus) {
			case Constants.ITEM_OVERALL_STATUS_CODE.ERROR:
				return IconPool.getIconURI("status-negative");
			case Constants.ITEM_OVERALL_STATUS_CODE.WARNING:
				return IconPool.getIconURI("status-critical");
			case Constants.ITEM_OVERALL_STATUS_CODE.SUCCESS:
				return IconPool.getIconURI("status-positive");
			default:
				return "";
			}

		},
		/*
		 * formatter method for status at item level 
		 * @param {string} Status maintianed for Overal Quota
		 * @return {string} Item overall status code
		 */
		getOveralQuotaStatusFormatter: function (sQuotaStatus) {
			switch (sQuotaStatus) {
			case Constants.ITEM_OVERALL_STATUS_CODE.ERROR:
				return Constants.ITEM_OVERALL_STATUS_CODE.COLOR_ERROR;
			case Constants.ITEM_OVERALL_STATUS_CODE.WARNING:
				return Constants.ITEM_OVERALL_STATUS_CODE.COLOR_WARNING;
			case Constants.ITEM_OVERALL_STATUS_CODE.SUCCESS:
				return Constants.ITEM_OVERALL_STATUS_CODE.COLOR_SUCCESS;
			default:
				return "None";
			}
		},

		/**
		 * Formats Overall Quota title in Smart Table in Edit mode.
		 * @param {object[]} aOverallQuotaItems contract items 
		 * @param {boolean} bIsContractItem true if it's for contract item level 
		 * @return {number} number of items to show in the smart table header
		 */
		formatOverallQuotaTitle: function (aOverallQuotaItems, bIsContractItem) {
			var iItemsLength = aOverallQuotaItems.length;
			if (!iItemsLength) {
				return Constants.NO_ITEMS_AMOUNT;
			} else {
				return bIsContractItem ? iItemsLength : iItemsLength - 1;
			}
		},

		/**
		 * Formats Overall Quota title in Smart Table in Edit mode.
		 * @param {string} sQuotaFlag the quota status
		 * @param {object} oResourceBundle the resource bundle for getting the text
		 * @return {string} the valid tooltip string
		 **/
		formatterOverallQuotaTooltip: function (sQuotaFlag, oResourceBundle) {
			switch (sQuotaFlag) {
			case Constants.ITEM_OVERALL_STATUS_CODE.ERROR:
				return oResourceBundle.getText("OverallQuotaError");
			case Constants.ITEM_OVERALL_STATUS_CODE.WARNING:
				return oResourceBundle.getText("OverallQuotaWarning");
			case Constants.ITEM_OVERALL_STATUS_CODE.SUCCESS:
				return oResourceBundle.getText("OverallQuotaSuccess");
			default:
				return "None";
			}
		},

		/**
		 * Formats Quota value.
		 * Instead of "000" -> "—" - for sap.m.Text.
		 * Instead of "000" -> "0" - for sap.m.Input.
		 * Removes leading zeros.
		 * @param {string} sQuota the quota status
		 * @param {boolean} bIsTextField true if it's a text field
		 * @return {string} Quota value string
		 **/
		formatQuotaValue: function (sQuota, bIsTextField) {
			var vQuota = Number(sQuota);
			if (vQuota) {
				return vQuota;
			} else if (isNaN(vQuota)) {
				return sQuota;
			} else {
				return bIsTextField ? "—" : "0";
			}
		},

		/**
		 * Formats Quota value state.
		 * Returns Error if value > 100 or value < 0 or value is NaN.
		 * @param {string} sQuota the quota status
		 * @return {sap.ui.core.ValueState} ValueState for Quota field
		 **/
		formatQuotaValueState: function (sQuota) {
			var vQuota = Number(sQuota);
			if (vQuota === 0) {
				return ValueState.None;
			} else if (vQuota) {
				return vQuota < 0 || vQuota > 100 ? ValueState.Error : ValueState.None;
			} else {
				return ValueState.Error;
			}
		}
	};
});