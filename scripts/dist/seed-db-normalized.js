"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_1 = require("@neondatabase/serverless");
var Analytics_Test_Data_json_1 = require("./Analytics_Test_Data.json");
var sql = (0, serverless_1.neon)(process.env.DATABASE_URL || "");
function normalizeAndSeedData() {
    return __awaiter(this, void 0, void 0, function () {
        var vendorMap, customerMap, _i, analyticsData_1, record, extractedData, vendorId, vendorData, vendorName, vendorResult, customerId, customerData, customerName, customerResult, invoiceNumber, invoiceDate, dueDate, summary, invoiceResult, invoiceId, lineItems, _a, lineItems_1, item, error_1, error_2;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    console.log("Starting normalized data seed...");
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 25, , 26]);
                    // Clear existing data
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["DELETE FROM payments"], ["DELETE FROM payments"])))];
                case 2:
                    // Clear existing data
                    _k.sent();
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["DELETE FROM line_items"], ["DELETE FROM line_items"])))];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DELETE FROM invoices"], ["DELETE FROM invoices"])))];
                case 4:
                    _k.sent();
                    return [4 /*yield*/, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["DELETE FROM customers"], ["DELETE FROM customers"])))];
                case 5:
                    _k.sent();
                    return [4 /*yield*/, sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["DELETE FROM vendors"], ["DELETE FROM vendors"])))];
                case 6:
                    _k.sent();
                    vendorMap = new Map();
                    customerMap = new Map();
                    _i = 0, analyticsData_1 = Analytics_Test_Data_json_1.default;
                    _k.label = 7;
                case 7:
                    if (!(_i < analyticsData_1.length)) return [3 /*break*/, 24];
                    record = analyticsData_1[_i];
                    extractedData = (_b = record.extractedData) === null || _b === void 0 ? void 0 : _b.llmData;
                    if (!extractedData)
                        return [3 /*break*/, 23];
                    _k.label = 8;
                case 8:
                    _k.trys.push([8, 22, , 23]);
                    vendorId = void 0;
                    vendorData = extractedData.vendor.value;
                    if (!((_c = vendorData === null || vendorData === void 0 ? void 0 : vendorData.vendorName) === null || _c === void 0 ? void 0 : _c.value)) return [3 /*break*/, 11];
                    vendorName = vendorData.vendorName.value;
                    if (!vendorMap.has(vendorName)) return [3 /*break*/, 9];
                    vendorId = vendorMap.get(vendorName);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n              INSERT INTO vendors (\n                name,\n                address\n              ) VALUES (\n                ", ",\n                ", "\n              ) RETURNING id\n            "], ["\n              INSERT INTO vendors (\n                name,\n                address\n              ) VALUES (\n                ", ",\n                ", "\n              ) RETURNING id\n            "])), vendorName, vendorData.vendorAddress.value)];
                case 10:
                    vendorResult = _k.sent();
                    vendorId = vendorResult[0].id;
                    if (vendorId) {
                        vendorMap.set(vendorName, vendorId);
                    }
                    _k.label = 11;
                case 11:
                    customerId = void 0;
                    customerData = extractedData.customer.value;
                    if (!((_d = customerData === null || customerData === void 0 ? void 0 : customerData.customerName) === null || _d === void 0 ? void 0 : _d.value)) return [3 /*break*/, 14];
                    customerName = customerData.customerName.value;
                    if (!customerMap.has(customerName)) return [3 /*break*/, 12];
                    customerId = customerMap.get(customerName);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n              INSERT INTO customers (\n                name,\n                address\n              ) VALUES (\n                ", ",\n                ", "\n              ) RETURNING id\n            "], ["\n              INSERT INTO customers (\n                name,\n                address\n              ) VALUES (\n                ", ",\n                ", "\n              ) RETURNING id\n            "])), customerName, customerData.customerAddress.value)];
                case 13:
                    customerResult = _k.sent();
                    customerId = customerResult[0].id;
                    if (customerId) {
                        customerMap.set(customerName, customerId);
                    }
                    _k.label = 14;
                case 14:
                    invoiceNumber = extractedData.invoice.value.invoiceId.value;
                    invoiceDate = extractedData.invoice.value.invoiceDate.value;
                    dueDate = (_e = extractedData.payment.value.dueDate) === null || _e === void 0 ? void 0 : _e.value;
                    summary = extractedData.summary.value;
                    return [4 /*yield*/, sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n          INSERT INTO invoices (\n            invoice_number,\n            vendor_id,\n            customer_id,\n            invoice_date,\n            due_date,\n            subtotal,\n            tax,\n            total,\n            status,\n            category\n          ) VALUES (\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", "\n          ) RETURNING id\n        "], ["\n          INSERT INTO invoices (\n            invoice_number,\n            vendor_id,\n            customer_id,\n            invoice_date,\n            due_date,\n            subtotal,\n            tax,\n            total,\n            status,\n            category\n          ) VALUES (\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", ",\n            ", "\n          ) RETURNING id\n        "])), invoiceNumber, vendorId || null, customerId || null, invoiceDate, dueDate || null, summary.subTotal.value, summary.totalTax.value, summary.invoiceTotal.value, record.isValidatedByHuman ? 'validated' : 'pending', summary.documentType || 'invoice')];
                case 15:
                    invoiceResult = _k.sent();
                    invoiceId = invoiceResult[0].id;
                    lineItems = ((_h = (_g = (_f = extractedData.lineItems) === null || _f === void 0 ? void 0 : _f.value) === null || _g === void 0 ? void 0 : _g.items) === null || _h === void 0 ? void 0 : _h.value) || [];
                    _a = 0, lineItems_1 = lineItems;
                    _k.label = 16;
                case 16:
                    if (!(_a < lineItems_1.length)) return [3 /*break*/, 19];
                    item = lineItems_1[_a];
                    return [4 /*yield*/, sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n            INSERT INTO line_items (\n              invoice_id,\n              description,\n              quantity,\n              unit_price,\n              amount\n            ) VALUES (\n              ", ",\n              ", ",\n              ", ",\n              ", ",\n              ", "\n            )\n          "], ["\n            INSERT INTO line_items (\n              invoice_id,\n              description,\n              quantity,\n              unit_price,\n              amount\n            ) VALUES (\n              ", ",\n              ", ",\n              ", ",\n              ", ",\n              ", "\n            )\n          "])), invoiceId, item.description.value, item.quantity.value, item.unitPrice.value, item.totalPrice.value)];
                case 17:
                    _k.sent();
                    _k.label = 18;
                case 18:
                    _a++;
                    return [3 /*break*/, 16];
                case 19:
                    if (!(record.isValidatedByHuman && dueDate)) return [3 /*break*/, 21];
                    return [4 /*yield*/, sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["\n            INSERT INTO payments (\n              invoice_id,\n              payment_date,\n              amount,\n              payment_method\n            ) VALUES (\n              ", ",\n              ", ",\n              ", ",\n              ", "\n            )\n          "], ["\n            INSERT INTO payments (\n              invoice_id,\n              payment_date,\n              amount,\n              payment_method\n            ) VALUES (\n              ", ",\n              ", ",\n              ", ",\n              ", "\n            )\n          "])), invoiceId, dueDate, summary.invoiceTotal.value, ((_j = extractedData.payment.value.bankAccountNumber) === null || _j === void 0 ? void 0 : _j.value) || 'Bank Transfer')];
                case 20:
                    _k.sent();
                    _k.label = 21;
                case 21:
                    console.log("Processed invoice ".concat(invoiceNumber));
                    return [3 /*break*/, 23];
                case 22:
                    error_1 = _k.sent();
                    console.error("Error processing record ".concat(record._id, ":"), error_1);
                    // Continue with next record
                    return [3 /*break*/, 23];
                case 23:
                    _i++;
                    return [3 /*break*/, 7];
                case 24:
                    console.log("Normalized data seed completed successfully!");
                    return [3 /*break*/, 26];
                case 25:
                    error_2 = _k.sent();
                    console.error("Seed error:", error_2);
                    process.exit(1);
                    return [3 /*break*/, 26];
                case 26: return [2 /*return*/];
            }
        });
    });
}
normalizeAndSeedData();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
