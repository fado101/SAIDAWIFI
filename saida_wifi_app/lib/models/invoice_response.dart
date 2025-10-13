import 'invoice.dart';

class InvoiceResponse {
  final bool success;
  final List<Invoice> invoices;
  final String? message;

  InvoiceResponse({
    required this.success,
    required this.invoices,
    this.message,
  });

  factory InvoiceResponse.fromJson(Map<String, dynamic> json) {
    // Support both 'invoices' and 'data' keys for compatibility
    final invoicesJson = (json['invoices'] ?? json['data'] ?? []) as List<dynamic>;
    final invoices = invoicesJson
        .map((invoiceJson) => Invoice.fromJson(invoiceJson as Map<String, dynamic>))
        .toList();

    return InvoiceResponse(
      success: json['success'] == true,
      invoices: invoices,
      message: json['message']?.toString(),
    );
  }
}