package com.nishacollection.dto;

import com.nishacollection.model.Invoice;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private BigDecimal todaySales;
    private long todayBillsCount;
    private long totalProducts;
    private long lowStockCount;
    private List<Invoice> recentInvoices;
}
