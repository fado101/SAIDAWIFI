class Invoice {
  final String id;
  final String date;
  final String price;
  final String paid;
  final String paymode;
  final String service;
  final String managername;

  Invoice({
    required this.id,
    required this.date,
    required this.price,
    required this.paid,
    required this.paymode,
    required this.service,
    required this.managername,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      price: json['price']?.toString() ?? '0',
      paid: json['paid']?.toString() ?? '',
      paymode: json['paymode']?.toString() ?? '0',
      service: json['service']?.toString() ?? '',
      managername: json['managername']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'price': price,
      'paid': paid,
      'paymode': paymode,
      'service': service,
      'managername': managername,
    };
  }

  // Helper method to check if invoice is paid
  bool get isPaid {
    try {
      final paidDate = DateTime.parse(paid);
      return paidDate.year > 1900;
    } catch (e) {
      return false;
    }
  }

  // Helper method to get formatted date
  String get formattedDate {
    try {
      final date = DateTime.parse(this.date);
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    } catch (e) {
      return this.date;
    }
  }

  // Helper method to get formatted paid date
  String get formattedPaidDate {
    if (!isPaid || paid.isEmpty || paid == '0000-00-00') return '';
    try {
      final date = DateTime.parse(paid);
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    } catch (e) {
      return paid;
    }
  }

  // Helper method to get payment method text in Arabic
  String get paymentMethodText {
    switch (paymode) {
      case "0":
        return "غير محدد";
      case "1":
        return "نقد";
      case "2":
        return "شيك";
      case "3":
        return "بطاقة ائتمان";
      case "4":
        return "تحويل بنكي";
      case "5":
        return "PayPal";
      default:
        return "غير محدد";
    }
  }

  // Helper method to format price
  String get formattedPrice {
    final numPrice = double.tryParse(price) ?? 0.0;
    if (numPrice >= 1000) {
      return '${(numPrice / 1000).round()}k';
    }
    return numPrice.round().toString();
  }
}