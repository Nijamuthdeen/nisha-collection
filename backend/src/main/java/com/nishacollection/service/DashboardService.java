package com.nishacollection.service;

import com.nishacollection.dto.DashboardStats;
import com.nishacollection.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;

    public DashboardStats getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = LocalDate.now().atTime(23, 59, 59);

        BigDecimal todaySales = invoiceRepository.sumGrandTotalByDateRange(startOfDay, endOfDay);
        long todayBills       = invoiceRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        long totalProducts    = productRepository.count();
        long lowStockCount    = productRepository.countLowStockProducts();

        log.info("Dashboard: sales={} bills={} products={} lowStock={}",
                 todaySales, todayBills, totalProducts, lowStockCount);

        return DashboardStats.builder()
                .todaySales(todaySales != null ? todaySales : BigDecimal.ZERO)
                .todayBillsCount(todayBills)
                .totalProducts(totalProducts)
                .lowStockCount(lowStockCount)
                .recentInvoices(invoiceRepository.findTop10ByOrderByCreatedAtDesc())
                .build();
    }
}
