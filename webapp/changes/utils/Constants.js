sap.ui.define([], function () {
	"use strict";

	return Object.freeze({
		TRANSACTION_CONTROLLER_TYPE: {
			DRAFT: "sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController",
			NON_DRAFT: "sap.suite.ui.generic.template.ObjectPage.extensionAPI.NonDraftTransactionController"
		},

		NO_ITEMS_AMOUNT: 0,
		ONE_ITEM_AMOUNT: 1,
		MAX_PERCENTAGE_VALUE: 100,

		DISTR_LINE_STATUS: {
			ERROR: "E",
			SUCCESS: "S",
			WARNING: "W"
		},

		DISTRIBUTION_ACTION: {
			ADD: "Add",
			COPY: "Copy"
		},

		CONTRACT_TYPE: {
			GROUP: "HC",
			BRAND: "CC"
		},

		GROUP_CONTRACT_SUBTYPE: "H",

		DEFAULT_PARAMS: {
			SOURCE_SYSTEM: "0"
		},

		BAILMENT_PAYMENT_MODEL_CODE: "02",

		CONTRACT_STATUS: {
			IN_PREPARATION: "01",
			IN_APPROVAL: "03",
			RELEASE_COMPLETED: "05"
		},

		FUNCTION_IMPORT: {
			VALIDATE_INPUT: "/ValidateIncotermShipInstPaymntTerm",
			RETRIGGER_WORKFLOW: "/RetriggerWorkflowSubOrdCtr",
			COPY_CONDITION: "/CopyCondition",
			QUOTA_INFO: "/QuotaInfo",
			HIER_COPY_DIST: "/HierCtrCopyDist",
			HIER_ITEM_COPY_DIST: "/HierCtrItemCopyDist",
			ZSB_ACTION: "/ZSBAction",
			ZSB_CALCULATE_PRICE: "/ZSBCalcPrice",
			CREATE_ZSB_COND: "/CreateZSBCond",
			ZSB_DL_CREATE_REQUEST: "/ZSBDLCreateRequest",
			ZSB_FIND_CONTRACTS: "/ZSBFindContracts",
			ALTERNATIVE_PART_CTR: "/CtrAltrPart",
			DELETE_ZSB_COMP: "/DelComponentZSB",
			DETERMINE_ZSB_ACTION: "/DetermineZSBAction",
			CREATE_PMAT_ROD: "/CreatePMATROD",
			ADD_USER_COMMENT: "/AddUserCommentCCTRHeader",
			STD_TEXT_FAV_PREVIEW: "/StdTxtFavupdPreview",
			STD_TEXT_MAINTAIN_NOTES: "/StdTxtMaintainNotes",
			ALTERNATIVE_PARTS_POPUP: "/CtrAltrPartPopUp",
			UPDATE_QUOTA: "/UpdateQuota"
		},
		VIEW_ID: {
			HEADER: "header",
			ITEM: "item",
			DISTRIBUTION: "distribution",
			HEADER_DISTRIBUTION: "headerDistribution",
			HIERARCHY_HEADER: "hierarchyHeader",
			HIERARCHY_ITEM: "hierarchyItem",
			HIERARCHY_DISTRIBUTION: "hierarchyDistribution",
			HIERARCHY_HEADER_DISTRIBUTION: "hierarchyHeaderDistribution"
		},
		LEVEL: {
			HEADER: "H",
			ITEM: "I"
		},
		FAV_LIST: {
			REMOVE: "FR",
			ADD: "FA"
		},
		PURCHANSING_DOCUMENT_CATEGORY: {
			CONTRACT: "K"
		},
		CONTRACTS_STATUS: {
			REJECTED: "08"
		},
		ITEM_OVERALL_STATUS_CODE: {
			ERROR: "1",
			WARNING: "2",
			SUCCESS: "3",
			COLOR_ERROR: "Error",
			COLOR_WARNING: "Warning",
			COLOR_SUCCESS: "Success"
		},
		SELECTED_NODE: {
			PLANT: "P"
		},
		PROCESS_INDICATOR: {
			PMATERIAL: "P"
		},
		PREVIEW_OPTION: "P",
		PRICE: "Price",
		VALIDATE_INPUT_FUNCTION_IMPORT: "/ValidateIncotermShipInstPaymntTerm",
		MESSAGE_SEVERITY: {
			WARNING: "warning"
		},
		ZSB_PROPERTY: {
			PRICE_PRELOGISTIC: "PricePreLogistic",
			PRICE_ADDEDVALUE: "PriceAddedValue",
			PRICE_HANDLING: "PriceHandling",
			PRICE_PERCENTAGE_PRELOGISTIC: "PricepercentagePreLogistic",
			PRICE_PERCENTAGE_ADDEDVALUE: "PricepercentageAddedValue",
			PRICE_PERCENTAGE_HANDLING: "PricepercentageHandling"
		},
		ALTERNATIVEPART_CONTRACTTYPE: {
			HIERARCHY_CONTRACT: "H"
		},
		ENTITYSET: {
			ZSB_FIND_CONTRACTS: "xVWKSxNLP_CCTR_I_FIND_CTR_ZSB"
		},
		TAB_KEYS: {
			SINGLE: "01",
			MULTIPLE: "02",
			UOM: "03",
			ROD: "04"
		},
		ZSB_ERROR_CODES: {
			FIND_CONTRACTS: "/VWKS/NLP_CCTR/256"
		},
        QUALIFIER: {
            TAUFUNG: "06",
            ROD: "05"
        }
	});
});