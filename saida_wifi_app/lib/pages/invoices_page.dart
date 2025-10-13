import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_service.dart';
import '../models/invoice.dart';
import '../models/invoice_response.dart';

class InvoicesPage extends ConsumerStatefulWidget {
  const InvoicesPage({super.key});

  @override
  ConsumerState<InvoicesPage> createState() => _InvoicesPageState();
}

class _InvoicesPageState extends ConsumerState<InvoicesPage> {
  final ApiService _apiService = ApiService();
  List<Invoice> _allInvoices = [];
  List<Invoice> _filteredInvoices = [];
  bool _isLoading = true;
  String? _error;
  String _selectedFilter = "all";

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final username = await _apiService.getSavedUsername();
      if (username != null) {
        final Map<String, dynamic> result = await _apiService.getInvoices();
        
        setState(() {
          if (result['success'] == true) {
            final invoiceResponse = InvoiceResponse.fromJson(result);
            _allInvoices = invoiceResponse.invoices;
            _applyFilter(); // Apply current filter to new data
          } else {
            _error = result['message']?.toString() ?? 'خطأ في تحميل الفواتير';
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'لم يتم العثور على بيانات المستخدم';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'تعذر الاتصال بالخادم لجلب بيانات الفواتير';
        _isLoading = false;
      });
    }
  }

  void _applyFilter() {
    if (_selectedFilter == "all") {
      _filteredInvoices = _allInvoices;
    } else if (_selectedFilter == "paid") {
      _filteredInvoices = _allInvoices.where((invoice) => invoice.isPaid).toList();
    } else if (_selectedFilter == "unpaid") {
      _filteredInvoices = _allInvoices.where((invoice) => !invoice.isPaid).toList();
    }
  }

  void _setFilter(String filter) {
    setState(() {
      _selectedFilter = filter;
      // Apply filter immediately within the same setState to avoid double rebuild
      if (_selectedFilter == "all") {
        _filteredInvoices = _allInvoices;
      } else if (_selectedFilter == "paid") {
        _filteredInvoices = _allInvoices.where((invoice) => invoice.isPaid).toList();
      } else if (_selectedFilter == "unpaid") {
        _filteredInvoices = _allInvoices.where((invoice) => !invoice.isPaid).toList();
      }
    });
  }

  int get _paidCount => _allInvoices.where((invoice) => invoice.isPaid).length;
  int get _unpaidCount => _allInvoices.where((invoice) => !invoice.isPaid).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            if (_isLoading) _buildLoadingState(),
            if (_error != null) _buildErrorState(),
            if (!_isLoading && _error == null) ...[
              _buildFilterButtons(),
              Expanded(
                child: _filteredInvoices.isEmpty
                    ? _buildEmptyState()
                    : Column(
                        children: [
                          Expanded(
                            child: RefreshIndicator(
                              onRefresh: _loadInvoices,
                              child: ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: _filteredInvoices.length,
                                itemBuilder: (context, index) {
                                  final invoice = _filteredInvoices[index];
                                  return _buildInvoiceCard(invoice);
                                },
                              ),
                            ),
                          ),
                          if (_allInvoices.isNotEmpty) _buildSummaryCard(),
                        ],
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      color: Colors.white,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_forward, size: 20),
            onPressed: () => Navigator.pop(context),
            padding: const EdgeInsets.all(8),
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
          ),
          const SizedBox(width: 8),
          // Logo placeholder - matches React version
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Colors.blue[600],
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(Icons.wifi, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'الفواتير',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Expanded(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
            SizedBox(height: 16),
            Text(
              'جارٍ تحميل الفواتير...',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Expanded(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.cancel,
                    size: 48,
                    color: Colors.red[500],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'خطأ في تحميل الفواتير',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: const TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loadInvoices,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('إعادة المحاولة'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterButtons() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterButton(
              "all",
              "الكل (${_allInvoices.length})",
              Icons.description,
            ),
            const SizedBox(width: 8),
            _buildFilterButton(
              "paid",
              "مدفوعة ($_paidCount)",
              Icons.check_circle,
            ),
            const SizedBox(width: 8),
            _buildFilterButton(
              "unpaid",
              "غير مدفوعة ($_unpaidCount)",
              Icons.cancel,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterButton(String filter, String text, IconData icon) {
    final isSelected = _selectedFilter == filter;
    return ElevatedButton.icon(
      onPressed: () => _setFilter(filter),
      icon: Icon(icon, size: 14),
      label: Text(
        text,
        style: const TextStyle(fontSize: 12),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? Colors.blue[600] : Colors.white,
        foregroundColor: isSelected ? Colors.white : Colors.black87,
        elevation: isSelected ? 2 : 0,
        side: BorderSide(
          color: isSelected ? Colors.blue[600]! : Colors.grey[300]!,
          width: 1,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        minimumSize: const Size(0, 36),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    if (_selectedFilter == "all") {
      message = "لم يتم العثور على أي فواتير لحسابك";
    } else if (_selectedFilter == "paid") {
      message = "لا توجد فواتير مدفوعة";
    } else {
      message = "لا توجد فواتير غير مدفوعة";
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.description,
                  size: 48,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                const Text(
                  'لا توجد فواتير',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  message,
                  style: const TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInvoiceCard(Invoice invoice) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'فاتورة #${invoice.id}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildStatusBadge(invoice.isPaid),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow('التاريخ', invoice.formattedDate),
                  _buildDetailRow('الخدمة', invoice.service),
                  Row(
                    children: [
                      _getPaymentMethodIcon(invoice.paymode),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          invoice.paymentMethodText,
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                  if (invoice.isPaid && invoice.formattedPaidDate.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'دُفعت: ${invoice.formattedPaidDate}',
                        style: const TextStyle(color: Colors.green),
                      ),
                    ),
                  _buildDetailRow('المدير', invoice.managername),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  invoice.formattedPrice,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: invoice.isPaid ? Colors.green[600] : Colors.red[600],
                  ),
                ),
                const Text(
                  'ليرة سورية',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool isPaid) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isPaid ? Colors.green[100] : Colors.red[100],
        border: Border.all(
          color: isPaid ? Colors.green[200]! : Colors.red[200]!,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPaid ? Icons.check_circle : Icons.cancel,
            size: 12,
            color: isPaid ? Colors.green[800] : Colors.red[800],
          ),
          const SizedBox(width: 4),
          Text(
            isPaid ? 'مدفوعة' : 'غير مدفوعة',
            style: TextStyle(
              fontSize: 12,
              color: isPaid ? Colors.green[800] : Colors.red[800],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              '$label:',
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.black87, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _getPaymentMethodIcon(String paymode) {
    IconData icon;
    switch (paymode) {
      case "4":
        icon = Icons.account_balance;
        break;
      default:
        icon = Icons.credit_card;
    }
    return Icon(icon, size: 16, color: Colors.grey);
  }

  Widget _buildSummaryCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ملخص الفواتير',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSummaryItem(
                    '${_allInvoices.length}',
                    'إجمالي الفواتير',
                    Colors.blue[600]!,
                  ),
                  _buildSummaryItem(
                    '$_paidCount',
                    'الفواتير المدفوعة',
                    Colors.green[600]!,
                  ),
                  _buildSummaryItem(
                    '$_unpaidCount',
                    'الفواتير غير المدفوعة',
                    Colors.red[600]!,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}