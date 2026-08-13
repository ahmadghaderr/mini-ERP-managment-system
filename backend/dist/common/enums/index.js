"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerOrderStatus = exports.SupplierInvoiceStatus = exports.StockMovementReason = exports.ProductCategory = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["STAFF"] = "staff";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["WATER"] = "water";
    ProductCategory["FOOD"] = "food";
    ProductCategory["HEALTHCARE"] = "healthcare";
    ProductCategory["ELECTRONICS"] = "electronics";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var StockMovementReason;
(function (StockMovementReason) {
    StockMovementReason["INVOICE_DELIVERED"] = "invoice_delivered";
    StockMovementReason["ORDER_DELIVERED"] = "order_delivered";
    StockMovementReason["TRANSFER_OUT"] = "transfer_out";
    StockMovementReason["TRANSFER_IN"] = "transfer_in";
    StockMovementReason["ADJUSTMENT"] = "adjustment";
})(StockMovementReason || (exports.StockMovementReason = StockMovementReason = {}));
var SupplierInvoiceStatus;
(function (SupplierInvoiceStatus) {
    SupplierInvoiceStatus["PENDING_EXTRACTION"] = "pending_extraction";
    SupplierInvoiceStatus["EXTRACTED"] = "extracted";
    SupplierInvoiceStatus["CONFIRMED"] = "confirmed";
    SupplierInvoiceStatus["DELIVERED"] = "delivered";
    SupplierInvoiceStatus["REJECTED"] = "rejected";
})(SupplierInvoiceStatus || (exports.SupplierInvoiceStatus = SupplierInvoiceStatus = {}));
var CustomerOrderStatus;
(function (CustomerOrderStatus) {
    CustomerOrderStatus["PENDING"] = "pending";
    CustomerOrderStatus["CONFIRMED"] = "confirmed";
    CustomerOrderStatus["DELIVERED"] = "delivered";
    CustomerOrderStatus["REJECTED"] = "rejected";
})(CustomerOrderStatus || (exports.CustomerOrderStatus = CustomerOrderStatus = {}));
//# sourceMappingURL=index.js.map